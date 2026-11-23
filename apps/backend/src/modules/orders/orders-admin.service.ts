import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  type AdminBulkStatusResult,
  type AdminOrderDetail,
  type AdminOrderFilters,
  type AdminOrderRow,
  type AdminOrdersPage,
  type AdminOrderUpdate,
  ORDER_STATUSES,
  type OrderChannelName,
  type OrderStatusName,
  STOCK_RELEASING_STATUSES,
} from '@ehans/shared';
import { OrderChannel, OrderStatus, type Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CatalogCheckoutService } from '../catalog/catalog-checkout.service.js';
import { addDays, startOfDay, startOfMonth } from './dhaka-time.js';

const toDb = (s: OrderStatusName) => s.toUpperCase() as OrderStatus;
const fromDb = (s: OrderStatus) => s.toLowerCase() as OrderStatusName;
const releases = (s: OrderStatusName) => STOCK_RELEASING_STATUSES.includes(s);

/** "2026-11-23" → midnight of that day in Dhaka. */
const dhakaDate = (ymd: string) => {
  const [y, m, d] = ymd.split('-').map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d) - 6 * 3600_000);
};

/** [from, to) instants for a quick range or a custom from/to (glowy Order::dateRange). */
export function dateWindow(
  filters: Pick<AdminOrderFilters, 'range' | 'from' | 'to'>,
  now = new Date(),
): { gte?: Date; lt?: Date } | null {
  const today = startOfDay(now);
  switch (filters.range) {
    case 'today':
      return { gte: today, lt: addDays(today, 1) };
    case 'yesterday':
      return { gte: addDays(today, -1), lt: today };
    case '7days':
      return { gte: addDays(today, -6), lt: addDays(today, 1) };
    case 'month':
      return { gte: startOfMonth(now), lt: addDays(today, 1) };
    default: {
      if (!filters.from && !filters.to) return null;
      return {
        ...(filters.from ? { gte: dhakaDate(filters.from) } : {}),
        ...(filters.to ? { lt: addDays(dhakaDate(filters.to), 1) } : {}),
      };
    }
  }
}

/** glowy Order::scopeAdminFilter */
export function orderWhere(filters: AdminOrderFilters, now = new Date()): Prisma.OrderWhereInput {
  const q = filters.q?.trim();
  const window = dateWindow(filters, now);
  return {
    ...(filters.status ? { status: toDb(filters.status) } : {}),
    ...(filters.channel ? { channel: filters.channel.toUpperCase() as OrderChannel } : {}),
    ...(q
      ? {
          OR: [
            { number: { contains: q, mode: 'insensitive' } },
            { customerName: { contains: q, mode: 'insensitive' } },
            { phone: { contains: q } },
            { email: { contains: q, mode: 'insensitive' } },
            { ipAddress: q },
          ],
        }
      : {}),
    ...(window ? { createdAt: window } : {}),
  };
}

/**
 * Admin orders (glowy OrderController, OrderStatusController, OrderNoteController,
 * OrderBulkStatusController, OrderService::transition).
 */
@Injectable()
export class OrdersAdminService {
  private readonly logger = new Logger(OrdersAdminService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly catalog: CatalogCheckoutService,
  ) {}

  async list(filters: AdminOrderFilters, page: number, pageSize: number): Promise<AdminOrdersPage> {
    const where = orderWhere(filters);
    const [total, rows, counts] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          items: {
            orderBy: { createdAt: 'asc' },
            select: { productName: true, variantTitle: true, quantity: true },
          },
        },
      }),
      // glowy counts every order per status for the tabs
      this.prisma.order.groupBy({ by: ['status'], _count: { _all: true } }),
    ]);
    const statusCounts = Object.fromEntries(ORDER_STATUSES.map((s) => [s, 0])) as Record<
      OrderStatusName,
      number
    >;
    for (const c of counts) statusCounts[fromDb(c.status)] = c._count._all;

    return {
      items: rows.map((o) => ({
        ...this.base(o),
        quantity: o.items.reduce((n, i) => n + i.quantity, 0),
        items: o.items.map((i) => ({
          name: i.productName,
          variantTitle: i.variantTitle,
          quantity: i.quantity,
        })),
      })),
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      statusCounts,
    };
  }

  async detail(number: string): Promise<AdminOrderDetail> {
    const o = await this.prisma.order.findUnique({
      where: { number },
      include: { items: { orderBy: { createdAt: 'asc' } } },
    });
    if (!o) throw new NotFoundException('Order not found');
    const [images, customerOrderCount, sameIpOrderCount] = await Promise.all([
      this.catalog.mainImages(o.items.map((i) => i.productId).filter((id): id is string => !!id)),
      this.prisma.order.count({ where: { phone: o.phone } }),
      o.ipAddress ? this.prisma.order.count({ where: { ipAddress: o.ipAddress } }) : 0,
    ]);
    return {
      ...this.base(o),
      address: o.address,
      shippingZone: o.shippingZone,
      paymentReference: o.paymentReference,
      paymentAccount: o.paymentAccount,
      couponCode: o.couponCode,
      subtotal: o.subtotal,
      discount: o.discount,
      shippingFee: o.shippingFee,
      items: o.items.map((i) => ({
        id: i.id,
        productId: i.productId,
        name: i.productName,
        variantTitle: i.variantTitle,
        image: i.productId ? (images.get(i.productId) ?? null) : null,
        unitPrice: i.unitPrice,
        quantity: i.quantity,
        lineTotal: i.lineTotal,
      })),
      customerOrderCount,
      sameIpOrderCount,
    };
  }

  /** Quick status change (list popup); returns the new label for the toast. */
  async setStatus(number: string, status: OrderStatusName): Promise<void> {
    await this.prisma.$transaction((tx) => this.transition(tx, number, status));
  }

  /** glowy OrderNoteController: internal note, edited inline on the list. */
  async setNote(number: string, adminNote: string | null): Promise<void> {
    await this.prisma.order.update({ where: { number }, data: { adminNote } }).catch(() => {
      throw new NotFoundException('Order not found');
    });
  }

  /** The order page's fulfilment form: status (with stock moves), courier, tracking, note. */
  async update(number: string, input: AdminOrderUpdate): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await this.transition(tx, number, input.status);
      await tx.order.update({
        where: { number },
        data: {
          courier: input.courier,
          trackingNumber: input.trackingNumber,
          adminNote: input.adminNote,
        },
      });
    });
  }

  /** glowy OrderBulkStatusController: orders that can't be reopened are skipped, not fatal. */
  async bulkStatus(numbers: string[], status: OrderStatusName): Promise<AdminBulkStatusResult> {
    const orders = await this.prisma.order.findMany({
      where: { number: { in: numbers } },
      select: { number: true, status: true },
    });
    let updated = 0;
    const skipped: string[] = [];
    for (const o of orders) {
      if (fromDb(o.status) === status) continue;
      try {
        await this.prisma.$transaction((tx) => this.transition(tx, o.number, status));
        updated++;
      } catch (error) {
        if (!(error instanceof ConflictException)) throw error;
        skipped.push(o.number);
      }
    }
    this.logger.log('orders bulk status', { status, updated, skipped: skipped.length });
    return { updated, skipped };
  }

  /**
   * glowy OrderService::transition: cancelling/returning puts the units back in stock;
   * reopening a cancelled/returned order takes them out again (fails without stock).
   */
  private async transition(
    tx: Prisma.TransactionClient,
    number: string,
    to: OrderStatusName,
  ): Promise<void> {
    const order = await tx.order.findUnique({
      where: { number },
      select: {
        id: true,
        status: true,
        items: {
          select: { productId: true, variantId: true, productName: true, quantity: true },
        },
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    const from = fromDb(order.status);
    if (from === to) return;

    const lines = order.items
      .filter((i): i is typeof i & { productId: string } => i.productId !== null)
      .map((i) => ({
        productId: i.productId,
        variantId: i.variantId,
        name: i.productName,
        quantity: i.quantity,
      }));
    if (!releases(from) && releases(to)) await this.catalog.release(tx, lines);
    if (releases(from) && !releases(to)) {
      try {
        await this.catalog.reserve(tx, lines);
      } catch (error) {
        if (!(error instanceof ConflictException)) throw error;
        // the catalog names the product that ran out
        const detail = String((error.getResponse() as { message?: string[] }).message?.[0] ?? '');
        const name = /“(.+)”/.exec(detail)?.[1];
        throw new ConflictException([
          name
            ? `Cannot reopen this order: “${name}” doesn't have enough stock.`
            : 'Cannot reopen this order: not enough stock.',
        ]);
      }
    }
    await tx.order.update({ where: { id: order.id }, data: { status: toDb(to) } });
    this.logger.log('order status changed', { orderId: order.id, from, to });
  }

  private base(o: {
    id: string;
    number: string;
    status: OrderStatus;
    channel: OrderChannel;
    customerName: string;
    phone: string;
    email: string | null;
    city: string;
    ipAddress: string | null;
    courier: string | null;
    trackingNumber: string | null;
    paymentMethod: string;
    paymentStatus: string | null;
    note: string | null;
    adminNote: string | null;
    total: number;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: o.id,
      number: o.number,
      status: fromDb(o.status),
      channel: o.channel.toLowerCase() as OrderChannelName,
      customerName: o.customerName,
      phone: o.phone,
      email: o.email,
      city: o.city,
      ipAddress: o.ipAddress,
      courier: o.courier,
      trackingNumber: o.trackingNumber,
      paymentMethod: o.paymentMethod,
      paymentStatus: o.paymentStatus,
      note: o.note,
      adminNote: o.adminNote,
      total: o.total,
      createdAt: o.createdAt.toISOString(),
      updatedAt: o.updatedAt.toISOString(),
    } satisfies Omit<AdminOrderRow, 'items' | 'quantity'>;
  }
}

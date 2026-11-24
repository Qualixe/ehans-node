import { Injectable, NotFoundException } from '@nestjs/common';
import {
  type AdminUser,
  type AdminOrderDetail,
  type AdminOrderFilters,
  type AdminOrderRow,
  type FraudCheckDto,
  type AdminOrderUpdate,
  type OrderChannelName,
  type OrderStatusName,
} from '@ehans/shared';
import { OrderChannel, OrderStatus, type Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CatalogCheckoutService } from '../catalog/catalog-checkout.service.js';
import { FraudService } from '../fraud/fraud.service.js';
import { OrderPanelService } from './order-panel.service.js';
import { addDays, startOfDay, startOfMonth } from './dhaka-time.js';

const toDb = (s: OrderStatusName) => s.toUpperCase() as OrderStatus;
const fromDb = (s: OrderStatus) => s.toLowerCase() as OrderStatusName;

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
 * The order page (glowy OrderController@show/update) and the fraud check. The list, status
 * changes, notes and bulk actions live in OrderPanelService.
 */
@Injectable()
export class OrdersAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly catalog: CatalogCheckoutService,
    private readonly fraud: FraudService,
    private readonly panel: OrderPanelService,
  ) {}

  async detail(number: string): Promise<AdminOrderDetail> {
    const o = await this.prisma.order.findUnique({
      where: { number },
      include: { items: { orderBy: { createdAt: 'asc' } } },
    });
    if (!o) throw new NotFoundException('Order not found');
    const [images, customerOrderCount, sameIpOrderCount, fraudCheck] = await Promise.all([
      this.catalog.mainImages(o.items.map((i) => i.productId).filter((id): id is string => !!id)),
      this.prisma.order.count({ where: { phone: o.phone } }),
      o.ipAddress ? this.prisma.order.count({ where: { ipAddress: o.ipAddress } }) : 0,
      this.fraud.savedOne(o.phone),
    ]);
    return {
      ...this.base(o),
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
      fraudCheck,
      fraudEnabled: this.fraud.enabled,
    };
  }

  /** glowy FraudCheckController: BD Courier history for the order's phone (cached unless fresh). */
  async fraudCheck(number: string, fresh: boolean): Promise<FraudCheckDto> {
    const order = await this.prisma.order.findUnique({
      where: { number },
      select: { phone: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    return this.fraud.check(order.phone, fresh);
  }

  /** The order page's fulfilment form: status (with stock moves), courier, tracking, note. */
  async update(number: string, input: AdminOrderUpdate, actor: AdminUser): Promise<void> {
    // status goes through the order panel: stock moves and "handled by" are recorded
    await this.panel.setStatus(number, input.status, actor);
    await this.prisma.order.update({
      where: { number },
      data: { courier: input.courier, trackingNumber: input.trackingNumber },
    });
    if (input.adminNote?.trim()) await this.panel.addNote(number, input.adminNote, actor);
  }

  private base(o: {
    id: string;
    number: string;
    status: OrderStatus;
    channel: OrderChannel;
    customerName: string;
    phone: string;
    email: string | null;
    address: string;
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
      address: o.address,
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

import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  type AdminUser,
  type BlockedContactDto,
  type CustomerHint,
  districtByKey,
  DISTRICTS,
  MANUAL_SOURCES,
  NOT_SALE_STATUSES,
  OPEN_STATUSES,
  ORDER_STATUS_LABELS,
  ORDER_STATUSES,
  type OrderStatusName,
  type PanelFilters,
  type PanelKpis,
  type PanelOrderDetail,
  type PanelOrderInput,
  type PanelOrderRow,
  type PanelOrdersPage,
  type PanelTab,
  POS_MAX_QUANTITY,
  SHIPPING_ZONES,
  TO_CONFIRM_STATUSES,
} from '@ehans/shared';
import { OrderChannel, OrderStatus, Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CatalogCheckoutService, type StockLine } from '../catalog/catalog-checkout.service.js';
import { FraudService } from '../fraud/fraud.service.js';
import { SettingsService } from '../settings/settings.service.js';
import { orderNumber } from './checkout.service.js';
import { addDays, startOfDay } from './dhaka-time.js';

const toDb = (s: OrderStatusName) => s.toUpperCase() as OrderStatus;
const fromDb = (s: OrderStatus) => s.toLowerCase() as OrderStatusName;
const releases = (s: OrderStatusName) => NOT_SALE_STATUSES.includes(s);
const OPEN_DB = OPEN_STATUSES.map(toDb);
const SALE_DB = ORDER_STATUSES.filter((s) => !NOT_SALE_STATUSES.includes(s)).map(toDb);
const label = (s: OrderStatusName) => ORDER_STATUS_LABELS[s];

/** "2026-11-23" → midnight of that day in Dhaka. */
const dhakaDate = (ymd: string) => {
  const [y, m, d] = ymd.split('-').map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d) - 6 * 3600_000);
};

/** [from, to) for the panel's date filter (Dhaka days). */
export function panelWindow(
  f: Pick<PanelFilters, 'date' | 'from' | 'to'>,
  now = new Date(),
): { gte?: Date; lt?: Date } | null {
  const today = startOfDay(now);
  const tomorrow = addDays(today, 1);
  switch (f.date) {
    case 'today':
      return { gte: today, lt: tomorrow };
    case 'yesterday':
      return { gte: addDays(today, -1), lt: today };
    case '7d':
      return { gte: addDays(today, -6), lt: tomorrow };
    case '15d':
      return { gte: addDays(today, -14), lt: tomorrow };
    case '30d':
      return { gte: addDays(today, -29), lt: tomorrow };
    case 'custom':
      if (!f.from && !f.to) return null;
      return {
        ...(f.from ? { gte: dhakaDate(f.from) } : {}),
        ...(f.to ? { lt: addDays(dhakaDate(f.to), 1) } : {}),
      };
    default:
      return null;
  }
}

const rowInclude = {
  items: { orderBy: { createdAt: 'asc' } },
  notes: { orderBy: { createdAt: 'asc' } },
  assignedTo: { select: { id: true, name: true } },
  createdBy: { select: { id: true, name: true } },
  events: { orderBy: { createdAt: 'desc' }, take: 20 },
} satisfies Prisma.OrderInclude;
type RowRecord = Prisma.OrderGetPayload<{ include: typeof rowInclude }>;

/** The courier services the panel knows (booking is done by the courier module). */
export const COURIER_NAMES: Record<string, string> = {
  steadfast: 'Steadfast',
  pathao: 'Pathao',
  redx: 'RedX',
  paperfly: 'Paperfly',
};

/**
 * The order panel (orders, duplicates, block list, manual orders): every change is recorded as
 * an order event with the staff member's name, which is what "handled by" shows.
 */
@Injectable()
export class OrderPanelService {
  private readonly logger = new Logger(OrderPanelService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly catalog: CatalogCheckoutService,
    private readonly fraud: FraudService,
    private readonly settings: SettingsService,
  ) {}

  // ---------------------------------------------------------------- list

  async list(
    f: PanelFilters,
    page: number,
    pageSize: number,
    couriers: PanelOrdersPage['couriers'],
  ): Promise<PanelOrdersPage> {
    const window = panelWindow(f);
    const inRange: Prisma.OrderWhereInput = window ? { createdAt: window } : {};
    const [dupPairs, blocked] = await Promise.all([this.duplicatePairs(), this.blockedSets()]);
    const dupIds = [...new Set(dupPairs.map((p) => p.id))];
    const blockedWhere: Prisma.OrderWhereInput = {
      OR: [{ phone: { in: [...blocked.phones] } }, { ipAddress: { in: [...blocked.ips] } }],
    };

    const where: Prisma.OrderWhereInput = {
      AND: [inRange, ...this.filterWhere(f, dupIds, blockedWhere)],
    };
    const [
      total,
      rows,
      statusCounts,
      dupInRange,
      blockedInRange,
      allInRange,
      summary,
      kpis,
      staff,
      allOrders,
    ] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: rowInclude,
      }),
      this.prisma.order.groupBy({ by: ['status'], where: inRange, _count: { _all: true } }),
      this.prisma.order.count({ where: { AND: [inRange, { id: { in: dupIds } }] } }),
      this.prisma.order.count({ where: { AND: [inRange, blockedWhere] } }),
      this.prisma.order.count({ where: inRange }),
      this.prisma.order.aggregate({
        where: { AND: [where, { status: { in: SALE_DB } }] },
        _sum: { total: true },
      }),
      this.kpis(dupIds.length),
      this.staff(),
      this.prisma.order.count(),
    ]);

    const tabs = Object.fromEntries([
      ['all', allInRange],
      ...ORDER_STATUSES.map((s) => [s, 0]),
      ['dup', dupInRange],
      ['blocked', blockedInRange],
    ]) as Record<PanelTab, number>;
    for (const c of statusCounts) tabs[fromDb(c.status)] = c._count._all;

    const [images, fraudChecks] = await Promise.all([
      this.catalog.mainImages(
        rows.flatMap((o) => o.items.map((i) => i.productId)).filter((id): id is string => !!id),
      ),
      this.fraud.saved(rows.map((o) => o.phone)),
    ]);
    const dupsOf = new Map<string, string[]>();
    for (const p of dupPairs) dupsOf.set(p.id, [...(dupsOf.get(p.id) ?? []), p.other_number]);

    return {
      items: rows.map((o) => this.toRow(o, images, dupsOf.get(o.id) ?? [], blocked)),
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      tabs,
      kpis,
      summary: { count: total, value: summary._sum.total ?? 0 },
      allOrders,
      staff,
      couriers,
      fraudChecks,
      fraudEnabled: this.fraud.enabled,
    };
  }

  private filterWhere(
    f: PanelFilters,
    dupIds: string[],
    blockedWhere: Prisma.OrderWhereInput,
  ): Prisma.OrderWhereInput[] {
    const and: Prisma.OrderWhereInput[] = [];
    if (f.tab === 'dup') and.push({ id: { in: dupIds } });
    else if (f.tab === 'blocked') and.push(blockedWhere);
    else if (f.tab && f.tab !== 'all') and.push({ status: toDb(f.tab) });

    if (f.assignee === 'none') and.push({ assignedToId: null });
    else if (f.assignee) and.push({ assignedToId: f.assignee });

    if (f.courier === 'none') and.push({ courierService: null });
    else if (f.courier) and.push({ courierService: f.courier });

    if (f.source === 'manual') {
      and.push({ OR: [{ createdById: { not: null } }, { source: { in: [...MANUAL_SOURCES] } }] });
    } else if (f.source === 'recovered') and.push({ recoveredFromId: { not: null } });
    else if (f.source) and.push({ source: f.source });

    const q = f.q?.trim();
    if (q) {
      const digits = q.replace(/[\s-]/g, '');
      const like = { contains: q, mode: 'insensitive' } as const;
      and.push({
        OR: [
          { number: like },
          { customerName: like },
          { phone: { contains: digits } },
          { altPhone: { contains: digits } },
          { address: like },
          { city: like },
          { ipAddress: q },
          { consignmentId: like },
          { trackingNumber: like },
          { items: { some: { productName: like } } },
        ],
      });
    }
    return and;
  }

  /** Pairs of open orders with the same phone or IP within the duplicate window. */
  private async duplicatePairs(): Promise<{ id: string; other_number: string }[]> {
    // the window is a Fraud & security setting
    const { dupWindowHours } = await this.settings.security();
    return this.prisma.$queryRaw<{ id: string; other_number: string }[]>`
      SELECT a.id, b.number AS other_number
      FROM orders a
      JOIN orders b ON b.id <> a.id
        AND (a.phone = b.phone OR (a.ip_address IS NOT NULL AND a.ip_address = b.ip_address))
        AND ABS(EXTRACT(EPOCH FROM (a.created_at - b.created_at))) < ${dupWindowHours * 3600}
      WHERE a.status::text IN (${Prisma.join(OPEN_DB)})
        AND b.status::text IN (${Prisma.join(OPEN_DB)})
        AND a.phone <> 'walk-in'
      ORDER BY b.created_at`;
  }

  private async blockedSets(): Promise<{ phones: Set<string>; ips: Set<string> }> {
    const rows = await this.prisma.blockedContact.findMany({ select: { kind: true, value: true } });
    return {
      phones: new Set(rows.filter((r) => r.kind === 'phone').map((r) => r.value)),
      ips: new Set(rows.filter((r) => r.kind === 'ip').map((r) => r.value)),
    };
  }

  private async kpis(duplicates: number): Promise<PanelKpis> {
    const today = startOfDay(new Date());
    const [todays, byStatus, shippedDue, sales] = await Promise.all([
      this.prisma.order.aggregate({
        where: { createdAt: { gte: today } },
        _count: { _all: true },
        _sum: { total: true },
      }),
      this.prisma.order.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.order.aggregate({
        where: { status: OrderStatus.SHIPPED },
        _sum: { total: true, advance: true },
      }),
      this.prisma.order.aggregate({ where: { status: { in: SALE_DB } }, _sum: { total: true } }),
    ]);
    const count = (s: OrderStatus) => byStatus.find((b) => b.status === s)?._count._all ?? 0;
    const delivered = count(OrderStatus.DELIVERED);
    const returned = count(OrderStatus.RETURNED);
    return {
      todayOrders: todays._count._all,
      todayValue: todays._sum.total ?? 0,
      waiting: count(OrderStatus.PENDING),
      noAnswer: count(OrderStatus.NO_ANSWER),
      followUp: count(OrderStatus.FOLLOW_UP),
      shipped: count(OrderStatus.SHIPPED),
      codToCollect: Math.max(0, (shippedDue._sum.total ?? 0) - (shippedDue._sum.advance ?? 0)),
      deliverySuccess:
        delivered + returned ? Math.round((delivered / (delivered + returned)) * 100) : 0,
      delivered,
      returned,
      salesValue: sales._sum.total ?? 0,
      duplicates,
    };
  }

  /** Dashboard: the panel's KPI row, and pending orders that are duplicates or blocked. */
  async overview(): Promise<{
    kpis: PanelKpis;
    attention: { kind: 'dup' | 'blocked'; number: string; customerName: string; by: string }[];
  }> {
    const [pairs, blocked] = await Promise.all([this.duplicatePairs(), this.blockedSets()]);
    const dupIds = [...new Set(pairs.map((p) => p.id))];
    const [kpis, dups, blockedRows] = await Promise.all([
      this.kpis(dupIds.length),
      this.prisma.order.findMany({
        where: { id: { in: dupIds }, status: OrderStatus.PENDING },
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: { number: true, customerName: true },
      }),
      this.prisma.order.findMany({
        where: {
          status: OrderStatus.PENDING,
          OR: [{ phone: { in: [...blocked.phones] } }, { ipAddress: { in: [...blocked.ips] } }],
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { number: true, customerName: true, phone: true },
      }),
    ]);
    return {
      kpis,
      attention: [
        ...dups.map((o) => ({ kind: 'dup' as const, ...o, by: '' })),
        ...blockedRows.map((o) => ({
          kind: 'blocked' as const,
          number: o.number,
          customerName: o.customerName,
          by: blocked.phones.has(o.phone) ? 'number' : 'IP',
        })),
      ],
    };
  }

  /** Staff accounts orders can be assigned to (the panel's "teams"). */
  staff() {
    return this.prisma.user.findMany({
      where: { isAdmin: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    });
  }

  private toRow(
    o: RowRecord,
    images: Map<string, string>,
    duplicates: string[],
    blocked: { phones: Set<string>; ips: Set<string> },
  ): PanelOrderRow {
    const status = fromDb(o.status);
    const district = DISTRICTS.find((d) => d.name === o.city);
    const last = o.notes[o.notes.length - 1];
    const handler =
      status === 'pending'
        ? null
        : (o.events.find((e) => e.kind === 'status' || e.kind === 'created') ?? null);
    return {
      id: o.id,
      number: o.number,
      status,
      createdAt: o.createdAt.toISOString(),
      updatedAt: o.updatedAt.toISOString(),
      source: o.source,
      manual: o.createdById !== null || MANUAL_SOURCES.includes(o.source as never),
      createdBy: o.createdBy?.name ?? null,
      ipAddress: o.ipAddress,
      recovered: o.recoveredFromId !== null,
      customerName: o.customerName,
      phone: o.phone,
      altPhone: o.altPhone,
      address: o.address,
      district: o.city,
      insideDhaka: (district?.zone ?? o.shippingZone) === 'inside_dhaka',
      customerNote: o.note,
      items: o.items.map((i) => ({
        productId: i.productId,
        variantId: i.variantId,
        name: i.productName,
        variantTitle: i.variantTitle,
        image: i.productId ? (images.get(i.productId) ?? null) : null,
        unitPrice: i.unitPrice,
        quantity: i.quantity,
      })),
      subtotal: o.subtotal,
      delivery: o.shippingFee,
      discount: o.discount,
      advance: o.advance,
      total: o.total,
      due: Math.max(0, o.total - o.advance),
      payment: o.paymentMethod,
      assignedTo: o.assignedTo,
      handledBy: handler
        ? {
            name: handler.actorName ?? 'System',
            at: handler.createdAt.toISOString(),
            text: handler.text,
          }
        : null,
      courier: o.courierService
        ? {
            service: o.courierService,
            name: COURIER_NAMES[o.courierService] ?? o.courier ?? o.courierService,
            consignmentId: o.consignmentId,
            trackingCode: o.trackingNumber,
            status: o.courierStatus,
          }
        : o.courier
          ? {
              service: 'other',
              name: o.courier,
              consignmentId: null,
              trackingCode: o.trackingNumber,
              status: null,
            }
          : null,
      notes: {
        count: o.notes.length,
        last: last
          ? { body: last.body, author: last.authorName, at: last.createdAt.toISOString() }
          : null,
        authors: [...new Set(o.notes.map((n) => n.authorName))],
      },
      duplicates,
      blocked: blocked.phones.has(o.phone) || (!!o.ipAddress && blocked.ips.has(o.ipAddress)),
    };
  }

  // ---------------------------------------------------------------- one order

  async detail(number: string): Promise<PanelOrderDetail> {
    const o = await this.prisma.order.findUnique({ where: { number }, include: rowInclude });
    if (!o) throw new NotFoundException('Order not found');
    const [images, dupPairs, blocked, previous, ipOrders, events] = await Promise.all([
      this.catalog.mainImages(o.items.map((i) => i.productId).filter((id): id is string => !!id)),
      this.duplicatePairs(),
      this.blockedSets(),
      this.prisma.order.findMany({
        where: { phone: o.phone, id: { not: o.id } },
        orderBy: { createdAt: 'desc' },
        take: 30,
        include: { items: { select: { productName: true, quantity: true } } },
      }),
      o.ipAddress
        ? this.prisma.order.findMany({
            where: { ipAddress: o.ipAddress },
            select: { customerName: true },
            distinct: ['customerName'],
          })
        : [],
      this.prisma.orderEvent.findMany({ where: { orderId: o.id }, orderBy: { createdAt: 'desc' } }),
    ]);
    const row = this.toRow(
      o,
      images,
      dupPairs.filter((p) => p.id === o.id).map((p) => p.other_number),
      blocked,
    );
    return {
      ...row,
      districtKey: DISTRICTS.find((d) => d.name === o.city)?.key ?? null,
      events: events.map((e) => ({ text: e.text, at: e.createdAt.toISOString() })),
      noteList: o.notes.map((n) => ({
        body: n.body,
        author: n.authorName,
        at: n.createdAt.toISOString(),
      })),
      previousOrders: previous.map((p) => ({
        number: p.number,
        createdAt: p.createdAt.toISOString(),
        status: fromDb(p.status),
        total: p.total,
        items: p.items.map((i) => `${i.productName} × ${i.quantity}`).join(', '),
        courier: p.courierService
          ? (COURIER_NAMES[p.courierService] ?? p.courierService)
          : p.courier,
      })),
      ipNames: ipOrders.map((x) => x.customerName),
    };
  }

  /** Under the phone field of the order forms: blocked? returning? still-open orders? */
  async customerHint(phone: string, excludeNumber?: string): Promise<CustomerHint> {
    const [block, previous] = await Promise.all([
      this.prisma.blockedContact.findUnique({
        where: { kind_value: { kind: 'phone', value: phone } },
        select: { reason: true },
      }),
      this.prisma.order.findMany({
        where: { phone, ...(excludeNumber ? { number: { not: excludeNumber } } : {}) },
        select: { number: true, status: true },
      }),
    ]);
    return {
      blocked: block ? { reason: block.reason } : null,
      previous: previous.length,
      openOrders: previous.filter((p) => OPEN_DB.includes(p.status)).map((p) => p.number),
    };
  }

  // ---------------------------------------------------------------- create / edit

  /** "New order" / POS / "Make order" from an incomplete checkout. */
  async create(input: PanelOrderInput, actor: AdminUser): Promise<{ number: string }> {
    const district = this.district(input.district);
    await this.refuseBlocked(input.phone);
    const lines = await this.priceLines(input.items);
    const status = input.status;
    const totals = this.totals(lines, input);

    const created = await this.prisma.$transaction(async (tx) => {
      if (!releases(status)) await this.reserve(tx, lines);
      let number = orderNumber();
      while (await tx.order.findUnique({ where: { number }, select: { id: true } })) {
        number = orderNumber();
      }
      const recovered = input.recoveredFromId
        ? await tx.incompleteCheckout.findUnique({ where: { id: input.recoveredFromId } })
        : null;
      const order = await tx.order.create({
        data: {
          number,
          status: toDb(status),
          channel: input.source === 'POS' ? OrderChannel.POS : OrderChannel.DIRECT,
          source: input.source,
          customerName: input.customerName.trim(),
          phone: input.phone,
          altPhone: input.altPhone || null,
          address: input.address.trim(),
          city: district.name,
          shippingZone: district.zone,
          paymentMethod: input.payment,
          assignedToId: input.assignedToId ?? actor.id,
          createdById: actor.id,
          recoveredFromId: recovered && recovered.state !== 'recovered' ? recovered.id : null,
          ...totals,
          items: { create: lines.map((l) => this.itemData(l)) },
          notes: input.note?.trim()
            ? { create: { body: input.note.trim(), authorId: actor.id, authorName: actor.name } }
            : undefined,
          events: {
            create: [
              {
                kind: 'created',
                actorId: actor.id,
                actorName: actor.name,
                text: recovered
                  ? `Recovered from incomplete checkout by ${actor.name}`
                  : `Manual order from ${input.source} by ${actor.name}`,
              },
              ...(status !== 'pending'
                ? [
                    {
                      kind: 'status',
                      actorId: actor.id,
                      actorName: actor.name,
                      text: `Status set to ${label(status)} by ${actor.name}`,
                    },
                  ]
                : []),
            ],
          },
        },
        select: { id: true, number: true },
      });
      if (recovered && recovered.state !== 'recovered') {
        await tx.incompleteCheckout.update({
          where: { id: recovered.id },
          data: { state: 'recovered', handledById: actor.id, handledAt: new Date() },
        });
      }
      return order;
    });
    this.logger.log('manual order created', {
      orderId: created.id,
      staffId: actor.id,
      source: input.source,
    });
    return { number: created.number };
  }

  /** The edit order popup: customer, status, team, products, prices, delivery, discount, advance. */
  async update(number: string, input: PanelOrderInput, actor: AdminUser): Promise<void> {
    const district = this.district(input.district);
    const lines = await this.priceLines(input.items);
    const totals = this.totals(lines, input);
    await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { number },
        include: { items: true },
      });
      if (!order) throw new NotFoundException('Order not found');
      const from = fromDb(order.status);
      const to = input.status;
      // stock follows the order: put the old lines back, take the new ones
      if (!releases(from)) await this.catalog.release(tx, this.stockLines(order.items));
      if (!releases(to)) await this.reserve(tx, lines);

      await tx.orderItem.deleteMany({ where: { orderId: order.id } });
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: toDb(to),
          source: input.source,
          customerName: input.customerName.trim(),
          phone: input.phone,
          altPhone: input.altPhone || null,
          address: input.address.trim(),
          city: district.name,
          shippingZone: district.zone,
          paymentMethod: input.payment,
          assignedToId: input.assignedToId || null,
          ...totals,
          items: { create: lines.map((l) => this.itemData(l)) },
        },
      });
      const events: Prisma.OrderEventCreateManyInput[] = [];
      if (from !== to) {
        events.push(this.statusEvent(order.id, to, actor));
      }
      events.push({
        orderId: order.id,
        kind: 'edited',
        actorId: actor.id,
        actorName: actor.name,
        text: `Order edited by ${actor.name}`,
      });
      await tx.orderEvent.createMany({ data: events });
      if (input.note?.trim()) {
        await tx.orderNote.create({
          data: {
            orderId: order.id,
            body: input.note.trim(),
            authorId: actor.id,
            authorName: actor.name,
          },
        });
      }
    });
  }

  // ---------------------------------------------------------------- quick actions

  /** Status menu / "Confirm" / "Call not received" / "Follow up" / "Ready for delivery". */
  async setStatus(number: string, status: OrderStatusName, actor: AdminUser): Promise<void> {
    await this.prisma.$transaction((tx) => this.transition(tx, number, status, actor));
  }

  async bulkStatus(numbers: string[], status: OrderStatusName, actor: AdminUser) {
    let updated = 0;
    const skipped: string[] = [];
    const blocked = await this.blockedSets();
    for (const number of numbers) {
      try {
        if (status === 'confirmed') {
          const o = await this.prisma.order.findUnique({
            where: { number },
            select: { status: true, phone: true, ipAddress: true },
          });
          // bulk confirm only touches orders waiting for confirmation, never blocked customers
          if (!o || !TO_CONFIRM_STATUSES.includes(fromDb(o.status))) continue;
          if (blocked.phones.has(o.phone) || (o.ipAddress && blocked.ips.has(o.ipAddress))) {
            skipped.push(number);
            continue;
          }
        }
        const changed = await this.prisma.$transaction((tx) =>
          this.transition(tx, number, status, actor),
        );
        if (changed) updated++;
      } catch (error) {
        if (!(error instanceof ConflictException)) throw error;
        skipped.push(number);
      }
    }
    return { updated, skipped };
  }

  async assign(numbers: string[], staffId: string | null, actor: AdminUser): Promise<number> {
    const staff = staffId
      ? await this.prisma.user.findFirst({
          where: { id: staffId, isAdmin: true },
          select: { id: true, name: true },
        })
      : null;
    if (staffId && !staff) throw new BadRequestException(['Choose a staff member.']);
    const orders = await this.prisma.order.findMany({
      where: { number: { in: numbers } },
      select: { id: true },
    });
    await this.prisma.$transaction([
      this.prisma.order.updateMany({
        where: { id: { in: orders.map((o) => o.id) } },
        data: { assignedToId: staff?.id ?? null },
      }),
      this.prisma.orderEvent.createMany({
        data: orders.map((o) => ({
          orderId: o.id,
          kind: 'assigned',
          actorId: actor.id,
          actorName: actor.name,
          text: staff
            ? `Assigned to ${staff.name} by ${actor.name}`
            : `Unassigned by ${actor.name}`,
        })),
      }),
    ]);
    return orders.length;
  }

  async addNote(number: string, body: string, actor: AdminUser): Promise<void> {
    const order = await this.findId(number);
    await this.prisma.orderNote.create({
      data: { orderId: order.id, body: body.trim(), authorId: actor.id, authorName: actor.name },
    });
  }

  /** Deletes orders; open ones put their stock back first. */
  async remove(numbers: string[], actor: AdminUser): Promise<number> {
    let removed = 0;
    for (const number of numbers) {
      await this.prisma.$transaction(async (tx) => {
        const order = await tx.order.findUnique({ where: { number }, include: { items: true } });
        if (!order) return;
        if (!releases(fromDb(order.status)))
          await this.catalog.release(tx, this.stockLines(order.items));
        await tx.order.delete({ where: { id: order.id } });
        removed++;
      });
    }
    this.logger.log('orders deleted', { count: removed, staffId: actor.id });
    return removed;
  }

  /** Duplicates popup: keep this one, cancel the other open duplicates (with a note). */
  async keepDuplicate(number: string, actor: AdminUser): Promise<number> {
    const pairs = await this.duplicatePairs();
    const keep = await this.findId(number);
    const others = pairs.filter((p) => p.id === keep.id).map((p) => p.other_number);
    for (const other of others) await this.cancelAsDuplicate(other, number, actor);
    return others.length;
  }

  async cancelAsDuplicate(number: string, kept: string, actor: AdminUser): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await this.transition(tx, number, 'cancelled', actor);
      const o = await tx.order.findUniqueOrThrow({ where: { number }, select: { id: true } });
      await tx.orderNote.create({
        data: {
          orderId: o.id,
          body: `Duplicate order, cancelled (kept #${kept})`,
          authorId: actor.id,
          authorName: actor.name,
        },
      });
    });
  }

  /** Fraud & security: a new order below the success threshold goes to "Follow up". */
  async autoHold(number: string, ratio: number, threshold: number): Promise<boolean> {
    const order = await this.prisma.order.findUnique({
      where: { number },
      select: { id: true, status: true },
    });
    if (!order || order.status !== OrderStatus.PENDING) return false;
    await this.prisma.$transaction([
      this.prisma.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.FOLLOW_UP },
      }),
      this.prisma.orderEvent.create({
        data: {
          orderId: order.id,
          kind: 'status',
          actorName: 'System',
          text: `Auto-hold: courier success ${ratio}% is below ${threshold}% (Follow up)`,
        },
      }),
    ]);
    return true;
  }

  // ---------------------------------------------------------------- block list

  async block(
    number: string,
    input: { phone: boolean; ip: boolean; reason?: string | null; cancel: boolean },
    actor: AdminUser,
  ): Promise<number> {
    const o = await this.prisma.order.findUnique({
      where: { number },
      select: { id: true, phone: true, ipAddress: true, status: true },
    });
    if (!o) throw new NotFoundException('Order not found');
    const reason = input.reason?.trim() || `Blocked from order #${number}`;
    const targets = [
      ...(input.phone && o.phone !== 'walk-in' ? [{ kind: 'phone', value: o.phone }] : []),
      ...(input.ip && o.ipAddress ? [{ kind: 'ip', value: o.ipAddress }] : []),
    ];
    let added = 0;
    for (const t of targets) {
      const r = await this.prisma.blockedContact.createMany({
        data: [{ ...t, reason, createdById: actor.id }],
        skipDuplicates: true,
      });
      added += r.count;
    }
    if (added) {
      await this.prisma.orderEvent.create({
        data: {
          orderId: o.id,
          kind: 'blocked',
          actorId: actor.id,
          actorName: actor.name,
          text: `Blocked ${targets.map((t) => t.kind.toUpperCase().replace('PHONE', 'phone')).join(' + ')} by ${actor.name}`,
        },
      });
    }
    if (input.cancel && OPEN_DB.includes(o.status))
      await this.setStatus(number, 'cancelled', actor);
    return added;
  }

  async blockedList(): Promise<BlockedContactDto[]> {
    const rows = await this.prisma.blockedContact.findMany({
      orderBy: { createdAt: 'desc' },
      include: { createdBy: { select: { name: true } } },
    });
    return rows.map((r) => ({
      id: r.id,
      kind: r.kind as 'phone' | 'ip',
      value: r.value,
      reason: r.reason,
      createdBy: r.createdBy?.name ?? null,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async addBlock(
    kind: 'phone' | 'ip',
    value: string,
    reason: string | null,
    actor: AdminUser,
  ): Promise<void> {
    await this.prisma.blockedContact.createMany({
      data: [{ kind, value, reason, createdById: actor.id }],
      skipDuplicates: true,
    });
  }

  async unblock(id: string): Promise<void> {
    await this.prisma.blockedContact.deleteMany({ where: { id } });
  }

  /** Storefront checkout refuses blocked numbers and IPs (exported for CheckoutService). */
  async isBlocked(phone: string, ip: string | null | undefined): Promise<boolean> {
    const hit = await this.prisma.blockedContact.findFirst({
      where: { OR: [{ kind: 'phone', value: phone }, ...(ip ? [{ kind: 'ip', value: ip }] : [])] },
      select: { id: true },
    });
    return hit !== null;
  }

  // ---------------------------------------------------------------- manual orders summary (POS page)

  async manualSummary(): Promise<{ range: string; orders: number; value: number }[]> {
    const today = startOfDay(new Date());
    const ranges: [string, Date, Date][] = [
      ['today', today, addDays(today, 1)],
      ['yesterday', addDays(today, -1), today],
      ['7d', addDays(today, -6), addDays(today, 1)],
      ['15d', addDays(today, -14), addDays(today, 1)],
      ['30d', addDays(today, -29), addDays(today, 1)],
    ];
    const manual: Prisma.OrderWhereInput = {
      OR: [{ createdById: { not: null } }, { source: { in: [...MANUAL_SOURCES] } }],
    };
    return Promise.all(
      ranges.map(async ([range, gte, lt]) => {
        const where = { AND: [manual, { createdAt: { gte, lt } }] };
        const [orders, sales] = await Promise.all([
          this.prisma.order.count({ where }),
          this.prisma.order.aggregate({
            where: { AND: [where, { status: { in: SALE_DB } }] },
            _sum: { total: true },
          }),
        ]);
        return { range, orders, value: sales._sum.total ?? 0 };
      }),
    );
  }

  // ---------------------------------------------------------------- helpers

  /**
   * Status change with stock: cancel/return/fake put the units back; reopening takes them out
   * again (fails when the stock is gone). Records who did it. Returns false when unchanged.
   */
  private async transition(
    tx: Prisma.TransactionClient,
    number: string,
    to: OrderStatusName,
    actor: AdminUser,
  ): Promise<boolean> {
    const order = await tx.order.findUnique({ where: { number }, include: { items: true } });
    if (!order) throw new NotFoundException('Order not found');
    const from = fromDb(order.status);
    if (from === to) return false;
    const lines = this.stockLines(order.items);
    if (!releases(from) && releases(to)) await this.catalog.release(tx, lines);
    if (releases(from) && !releases(to)) await this.reserve(tx, lines);
    await tx.order.update({
      where: { id: order.id },
      data: {
        status: toDb(to),
        // confirming hands the order to whoever confirmed it, if nobody had it yet
        ...(to === 'confirmed' && !order.assignedToId ? { assignedToId: actor.id } : {}),
      },
    });
    await tx.orderEvent.create({ data: this.statusEvent(order.id, to, actor) });
    this.logger.log('order status changed', { orderId: order.id, from, to, staffId: actor.id });
    return true;
  }

  private statusEvent(
    orderId: string,
    to: OrderStatusName,
    actor: AdminUser,
  ): Prisma.OrderEventCreateManyInput {
    return {
      orderId,
      kind: 'status',
      actorId: actor.id,
      actorName: actor.name,
      text:
        to === 'confirmed'
          ? `Confirmed by ${actor.name}`
          : `Status set to ${label(to)} by ${actor.name}`,
    };
  }

  private async reserve(tx: Prisma.TransactionClient, lines: StockLine[]): Promise<void> {
    try {
      await this.catalog.reserve(tx, lines);
    } catch (error) {
      if (!(error instanceof ConflictException)) throw error;
      const detail = String((error.getResponse() as { message?: string[] }).message?.[0] ?? '');
      const name = /“(.+)”/.exec(detail)?.[1];
      throw new ConflictException([
        name ? `“${name}” doesn't have enough stock.` : 'Not enough stock.',
      ]);
    }
  }

  /** Products, variants and stock checked by the catalog; staff may change the unit price. */
  private async priceLines(items: PanelOrderInput['items']) {
    if (!items.length) throw new BadRequestException(['Add at least one product.']);
    const resolved = await this.catalog.resolve(
      items.map((i) => ({
        productId: i.productId,
        variantId: i.variantId ?? null,
        quantity: i.quantity,
      })),
      { bundles: false, maxQuantity: POS_MAX_QUANTITY, checkStock: false },
    );
    return resolved.map((line) => {
      const typed = items.find(
        (i) => i.productId === line.productId && (i.variantId ?? null) === (line.variantId ?? null),
      );
      const unitPrice = typed ? Math.max(0, Math.round(typed.unitPrice)) : line.unitPrice;
      return { ...line, unitPrice, lineSubtotal: unitPrice * line.quantity, lineDiscount: 0 };
    });
  }

  private totals(lines: { lineSubtotal: number }[], input: PanelOrderInput) {
    const subtotal = lines.reduce((n, l) => n + l.lineSubtotal, 0);
    const delivery = Math.max(0, Math.round(input.delivery));
    const discount = Math.min(Math.max(0, Math.round(input.discount)), subtotal + delivery);
    const total = subtotal + delivery - discount;
    return {
      subtotal,
      shippingFee: delivery,
      discount,
      advance: Math.min(Math.max(0, Math.round(input.advance)), total),
      total,
    };
  }

  private itemData(l: {
    productId: string;
    variantId: string | null;
    name: string;
    variantTitle: string | null;
    unitPrice: number;
    quantity: number;
    lineSubtotal: number;
  }) {
    return {
      productId: l.productId,
      variantId: l.variantId,
      productName: l.name,
      variantTitle: l.variantTitle,
      unitPrice: l.unitPrice,
      quantity: l.quantity,
      lineTotal: l.lineSubtotal,
    };
  }

  private stockLines(
    items: {
      productId: string | null;
      variantId: string | null;
      productName: string;
      quantity: number;
    }[],
  ): StockLine[] {
    return items
      .filter((i): i is typeof i & { productId: string } => i.productId !== null)
      .map((i) => ({
        productId: i.productId,
        variantId: i.variantId,
        name: i.productName,
        quantity: i.quantity,
      }));
  }

  private district(key: string) {
    const d = districtByKey(key);
    if (!d) throw new BadRequestException(['Please choose the district.']);
    return d;
  }

  private async refuseBlocked(phone: string): Promise<void> {
    const b = await this.prisma.blockedContact.findUnique({
      where: { kind_value: { kind: 'phone', value: phone } },
      select: { id: true },
    });
    if (b) throw new ConflictException(['This number is on the block list. Unblock it first.']);
  }

  private async findId(number: string) {
    const o = await this.prisma.order.findUnique({ where: { number }, select: { id: true } });
    if (!o) throw new NotFoundException('Order not found');
    return o;
  }

  /** Inside / outside Dhaka delivery charges, for the forms. */
  static fees() {
    return { inside: SHIPPING_ZONES.inside_dhaka.fee, outside: SHIPPING_ZONES.outside_dhaka.fee };
  }
}

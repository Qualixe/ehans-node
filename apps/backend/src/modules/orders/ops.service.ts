import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import {
  type ActivityType,
  type AdminUser,
  BD_MOBILE,
  type FraudCheckerPage,
  type FraudLookup,
  type OrderStatusName,
  type SecurityOverview,
  type SecuritySettings,
  type ShipmentsPage,
  type TeamPage,
  TO_CONFIRM_STATUSES,
} from '@ehans/shared';
import { OrderStatus } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AuthService } from '../auth/auth.service.js';
import { CourierService } from '../couriers/courier.service.js';
import { FraudService } from '../fraud/fraud.service.js';
import { SettingsService } from '../settings/settings.service.js';
import { startOfDay } from './dhaka-time.js';
import { COURIER_NAMES, OrderPanelService } from './order-panel.service.js';

const fromDb = (s: OrderStatus) => s.toLowerCase() as OrderStatusName;
/** The courier keeps 1% of the cash it collects (the demo's COD fee). */
const COD_FEE = 0.01;
const ONLINE_MS = 15 * 60_000;
const TO_CONFIRM_DB = TO_CONFIRM_STATUSES.map((s) => s.toUpperCase() as OrderStatus);

/** What an order event counts as on Team activity (from the event kind and its text). */
function classify(
  kind: string,
  text: string,
): { type: ActivityType; credit?: 'confirmed' | 'ready' | 'cancelled' | 'fake' | 'blocked' } {
  if (kind === 'created') return { type: 'order' };
  if (kind === 'courier') return { type: 'courier' };
  if (kind === 'edited') return { type: 'edit' };
  if (kind === 'assigned') return { type: 'assign' };
  if (kind === 'blocked') return { type: 'block', credit: 'blocked' };
  if (/^Confirmed|Status set to Confirmed/.test(text))
    return { type: 'status', credit: 'confirmed' };
  if (/Ready for delivery/.test(text)) return { type: 'status', credit: 'ready' };
  if (/Status set to Cancelled/.test(text)) return { type: 'status', credit: 'cancelled' };
  if (/Status set to Fake order/.test(text)) return { type: 'status', credit: 'fake' };
  return { type: 'status' };
}

/** Courier & COD, Team activity, Fraud checker and Fraud & security (order panel pages). */
@Injectable()
export class OpsService {
  private readonly logger = new Logger(OpsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly panel: OrderPanelService,
    private readonly fraud: FraudService,
    private readonly settings: SettingsService,
    private readonly auth: AuthService,
    private readonly couriers: CourierService,
  ) {}

  // ---------------------------------------------------------------- Courier & COD

  async shipments(): Promise<ShipmentsPage> {
    const rows = await this.prisma.order.findMany({
      where: { courierService: { not: null } },
      orderBy: { courierSentAt: 'desc' },
      take: 300,
      select: {
        number: true,
        customerName: true,
        phone: true,
        city: true,
        courierService: true,
        consignmentId: true,
        trackingNumber: true,
        courierStatus: true,
        courierSentAt: true,
        courierFee: true,
        codAmount: true,
        total: true,
        advance: true,
        status: true,
        codSettledAt: true,
      },
    });
    const cod = (r: (typeof rows)[number]) => r.codAmount ?? Math.max(0, r.total - r.advance);
    const ids = [
      ...new Set([
        ...this.couriers.available().map((c) => c.id),
        ...rows.map((r) => r.courierService!),
      ]),
    ];
    return {
      couriers: ids.map((id) => {
        const mine = rows.filter((r) => r.courierService === id);
        const transit = mine.filter((r) => r.status === OrderStatus.SHIPPED);
        return {
          id,
          name: COURIER_NAMES[id] ?? id,
          inTransit: transit.length,
          inTransitCod: transit.reduce((n, r) => n + cod(r), 0),
          delivered: mine.filter(
            (r) => r.status === OrderStatus.DELIVERED || r.status === OrderStatus.PARTIAL,
          ).length,
          returned: mine.filter((r) => r.status === OrderStatus.RETURNED).length,
        };
      }),
      payouts: ids
        .map((id) => {
          const due = rows.filter(
            (r) =>
              r.courierService === id &&
              !r.codSettledAt &&
              (r.status === OrderStatus.DELIVERED || r.status === OrderStatus.PARTIAL),
          );
          const gross = due.reduce((n, r) => n + cod(r), 0);
          const fees = due.reduce(
            (n, r) => n + (r.courierFee ?? 0) + Math.round(cod(r) * COD_FEE),
            0,
          );
          return {
            courier: id,
            name: COURIER_NAMES[id] ?? id,
            parcels: due.length,
            cod: gross,
            fees,
            net: gross - fees,
          };
        })
        .filter((p) => p.parcels > 0),
      rows: rows.map((r) => ({
        number: r.number,
        customerName: r.customerName,
        phone: r.phone,
        district: r.city,
        courier: r.courierService!,
        courierName: COURIER_NAMES[r.courierService!] ?? r.courierService!,
        consignmentId: r.consignmentId,
        trackingCode: r.trackingNumber,
        trackingUrl: CourierService.trackingUrl(
          r.courierService!,
          r.consignmentId,
          r.trackingNumber,
          r.phone,
        ),
        courierStatus: r.courierStatus,
        sentAt: r.courierSentAt?.toISOString() ?? null,
        cod: cod(r),
        status: fromDb(r.status),
        settled: r.codSettledAt !== null,
      })),
    };
  }

  /** "Mark received": the courier paid out the COD of its delivered parcels. */
  async settle(courier: string, actor: AdminUser): Promise<number> {
    const due = await this.prisma.order.findMany({
      where: {
        courierService: courier,
        codSettledAt: null,
        status: { in: [OrderStatus.DELIVERED, OrderStatus.PARTIAL] },
      },
      select: { id: true },
    });
    if (!due.length) return 0;
    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.order.updateMany({
        where: { id: { in: due.map((d) => d.id) } },
        data: { codSettledAt: now },
      }),
      this.prisma.orderEvent.createMany({
        data: due.map((d) => ({
          orderId: d.id,
          kind: 'payout',
          actorId: actor.id,
          actorName: actor.name,
          text: `COD payout received from ${COURIER_NAMES[courier] ?? courier} by ${actor.name}`,
        })),
      }),
    ]);
    this.logger.log('courier payout received', { courier, parcels: due.length, staffId: actor.id });
    return due.length;
  }

  // ---------------------------------------------------------------- Team activity

  async team(): Promise<TeamPage> {
    const since = new Date(Date.now() - 30 * 24 * 3600_000);
    const [staff, events, notes, assigned] = await Promise.all([
      this.prisma.user.findMany({
        where: { isAdmin: true },
        select: { id: true, name: true, role: true },
        orderBy: { name: 'asc' },
      }),
      this.prisma.orderEvent.findMany({
        where: { createdAt: { gte: since }, actorName: { not: null } },
        orderBy: { createdAt: 'desc' },
        take: 2000,
        include: { order: { select: { number: true, customerName: true, createdAt: true } } },
      }),
      this.prisma.orderNote.findMany({
        where: { createdAt: { gte: since } },
        orderBy: { createdAt: 'desc' },
        take: 500,
        include: { order: { select: { number: true, customerName: true } } },
      }),
      this.prisma.order.groupBy({
        by: ['assignedToId'],
        where: { assignedToId: { not: null } },
        _count: { _all: true },
      }),
    ]);

    const feed = [
      ...events.map((e) => ({
        at: e.createdAt,
        who: e.actorName ?? 'System',
        actorId: e.actorId,
        ...classify(e.kind, e.text),
        text: e.text.replace(/ by [^,()]+$/, ''),
        orderNumber: e.order.number,
        customerName: e.order.customerName,
        confirmMinutes:
          classify(e.kind, e.text).credit === 'confirmed'
            ? (e.createdAt.getTime() - e.order.createdAt.getTime()) / 60_000
            : null,
      })),
      ...notes.map((n) => ({
        at: n.createdAt,
        who: n.authorName,
        actorId: n.authorId,
        type: 'note' as const,
        credit: undefined,
        text: `Note: ${n.body}`,
        orderNumber: n.order.number,
        customerName: n.order.customerName,
        confirmMinutes: null,
      })),
    ].sort((a, b) => b.at.getTime() - a.at.getTime());

    const people = staff.map((u) => {
      const mine = feed.filter((f) => f.actorId === u.id);
      const credit = (k: string) => mine.filter((f) => f.credit === k).length;
      const times = mine.map((f) => f.confirmMinutes).filter((m): m is number => m !== null);
      const last = mine[0]?.at ?? null;
      return {
        id: u.id,
        name: u.name,
        role: u.role === 'OWNER' ? 'Owner' : 'Staff',
        online: last !== null && Date.now() - last.getTime() < ONLINE_MS,
        lastActive: last?.toISOString() ?? null,
        confirmed: credit('confirmed'),
        ready: credit('ready'),
        cancelled: credit('cancelled'),
        fake: credit('fake'),
        blocked: credit('blocked'),
        handled: assigned.find((a) => a.assignedToId === u.id)?._count._all ?? 0,
        avgConfirmMinutes: times.length
          ? Math.round(times.reduce((a, b) => a + b, 0) / times.length)
          : null,
      };
    });

    const today = startOfDay(new Date()).getTime();
    const hours = Array.from({ length: 24 }, () => 0);
    for (const f of feed) {
      if (f.at.getTime() < today || f.who === 'System') continue;
      hours[new Date(f.at.getTime() + 6 * 3600_000).getUTCHours()]!++;
    }
    return {
      people,
      events: feed.slice(0, 300).map((f) => ({
        at: f.at.toISOString(),
        who: f.who,
        type: f.type,
        text: f.text,
        orderNumber: f.orderNumber,
        customerName: f.customerName,
      })),
      hours,
    };
  }

  // ---------------------------------------------------------------- Fraud checker

  async fraudChecker(): Promise<FraudCheckerPage> {
    const [recent, waiting] = await Promise.all([
      this.fraud.recentPhones(6),
      this.prisma.order.findMany({
        where: { status: { in: TO_CONFIRM_DB } },
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: { number: true, customerName: true, phone: true },
      }),
    ]);
    const checks = await this.fraud.saved(waiting.map((w) => w.phone));
    return {
      recent,
      waiting: waiting.map((w) => ({ ...w, check: checks[w.phone] ?? null })),
      enabled: this.fraud.enabled,
    };
  }

  /** Look up any number: courier history (checked now unless fresh), our orders, block state. */
  async fraudLookup(rawPhone: string, run: boolean, fresh: boolean): Promise<FraudLookup> {
    const phone = rawPhone.replace(/[\s\-()]/g, '').replace(/^\+?88(?=01)/, '');
    if (!BD_MOBILE.test(phone))
      throw new BadRequestException(['Enter an 11-digit mobile number starting with 01.']);
    const [orders, hint] = await Promise.all([
      this.prisma.order.findMany({
        where: { phone },
        orderBy: { createdAt: 'desc' },
        take: 30,
        select: { number: true, createdAt: true, total: true, status: true, customerName: true },
      }),
      this.panel.customerHint(phone),
    ]);
    const check =
      run && this.fraud.enabled
        ? await this.fraud.check(phone, fresh)
        : await this.fraud.savedOne(phone);
    return {
      phone,
      name: orders[0]?.customerName ?? null,
      blocked: hint.blocked !== null,
      check,
      enabled: this.fraud.enabled,
      orders: orders.map((o) => ({
        number: o.number,
        createdAt: o.createdAt.toISOString(),
        total: o.total,
        status: fromDb(o.status),
      })),
    };
  }

  // ---------------------------------------------------------------- Fraud & security

  async security(): Promise<SecurityOverview> {
    const [settings, blocked, logins, failed] = await Promise.all([
      this.settings.security(),
      this.prisma.blockedContact.groupBy({ by: ['kind'], _count: { _all: true } }),
      this.auth.loginHistory(20),
      this.auth.failedLoginsSince(new Date(Date.now() - 48 * 3600_000)),
    ]);
    return {
      settings,
      blockedPhones: blocked.find((b) => b.kind === 'phone')?._count._all ?? 0,
      blockedIps: blocked.find((b) => b.kind === 'ip')?._count._all ?? 0,
      riskyOpen:
        settings.autoHoldBelow > 0 ? (await this.riskyOpen(settings.autoHoldBelow)).length : 0,
      failedLogins48h: failed,
      logins,
    };
  }

  saveSecurity(input: SecuritySettings, actor: AdminUser): Promise<SecuritySettings> {
    this.logger.log('security rules saved', { staffId: actor.id });
    return this.settings.setSecurity(input);
  }

  /** "Run on open orders": puts pending orders below the success rule on Follow up. */
  async runRules(): Promise<number> {
    const { autoHoldBelow } = await this.settings.security();
    if (autoHoldBelow <= 0) return 0;
    let held = 0;
    for (const o of await this.riskyOpen(autoHoldBelow)) {
      if (await this.panel.autoHold(o.number, o.ratio, autoHoldBelow)) held++;
    }
    return held;
  }

  /** Open orders waiting to confirm whose saved courier success is below the threshold. */
  private async riskyOpen(threshold: number) {
    const open = await this.prisma.order.findMany({
      where: { status: OrderStatus.PENDING },
      select: { number: true, phone: true },
    });
    const checks = await this.fraud.saved(open.map((o) => o.phone));
    return open
      .map((o) => ({ number: o.number, ratio: checks[o.phone]?.successRatio ?? null }))
      .filter(
        (o): o is { number: string; ratio: number } => o.ratio !== null && o.ratio < threshold,
      );
  }
}

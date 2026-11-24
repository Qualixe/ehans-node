import { Injectable } from '@nestjs/common';
import {
  type DashboardAlert,
  type DashboardOverview,
  NOT_SALE_STATUSES,
  ORDER_STATUS_LABELS,
  ORDER_STATUSES,
  type OrderStatusName,
  type ProfitDay,
  type ReportColumn,
  type ReportPage,
  type ReportPeriod,
  type ReportTab,
} from '@ehans/shared';
import type { OrderStatus } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CatalogCheckoutService, type ProductFacts } from '../catalog/catalog-checkout.service.js';
import { CatalogStatsService } from '../catalog/catalog-stats.service.js';
import { FraudService } from '../fraud/fraud.service.js';
import { addDays, bucketKey, bucketLabel, startOfDay } from './dhaka-time.js';
import { OpsService } from './ops.service.js';
import { OrderPanelService } from './order-panel.service.js';

const COD_FEE = 0.01;
const fromDb = (s: OrderStatus) => s.toLowerCase() as OrderStatusName;
const isSale = (s: OrderStatusName) => !NOT_SALE_STATUSES.includes(s);
/** past confirmation: what "Confirmed+" counts in the team table */
const NOT_CONFIRMED: OrderStatusName[] = [
  'pending',
  'no_answer',
  'follow_up',
  'cancelled',
  'returned',
  'fake',
];

export interface ProfitInput {
  status: OrderStatusName;
  total: number;
  advance: number;
  codAmount: number | null;
  courierFee: number | null;
  shippingFee: number;
  /** product cost of all lines */
  cost: number;
}

export interface OrderProfit {
  revenue: number;
  productCost: number;
  courier: number;
  returnLoss: number;
  profit: number;
}

/** Realised profit of one order (see reports.types.ts); null while it isn't delivered or returned. */
export function orderProfit(o: ProfitInput): OrderProfit | null {
  const fee = o.courierFee ?? o.shippingFee;
  if (o.status === 'delivered') {
    const courier = fee + Math.round(Math.max(0, o.total - o.advance) * COD_FEE);
    return {
      revenue: o.total,
      productCost: o.cost,
      courier,
      returnLoss: 0,
      profit: o.total - o.cost - courier,
    };
  }
  if (o.status === 'partial') {
    const collected = o.codAmount ?? Math.max(0, o.total - o.advance);
    const revenue = collected + o.advance;
    const productCost = o.total ? Math.round((o.cost * revenue) / o.total) : o.cost;
    const courier = fee + Math.round(collected * COD_FEE);
    return {
      revenue,
      productCost,
      courier,
      returnLoss: 0,
      profit: revenue - productCost - courier,
    };
  }
  if (o.status === 'returned') {
    const returnLoss = fee + Math.round(fee / 2);
    return {
      revenue: o.advance,
      productCost: 0,
      courier: 0,
      returnLoss,
      profit: o.advance - returnLoss,
    };
  }
  return null;
}

const pct = (part: number, whole: number) => (whole ? Math.round((part / whole) * 100) : null);

const orderSelect = {
  status: true,
  total: true,
  advance: true,
  codAmount: true,
  courierFee: true,
  shippingFee: true,
  city: true,
  source: true,
  courierService: true,
  assignedToId: true,
  createdAt: true,
  items: {
    select: {
      productId: true,
      variantId: true,
      quantity: true,
      lineTotal: true,
      productName: true,
    },
  },
} as const;

interface Costed {
  status: OrderStatusName;
  total: number;
  city: string;
  source: string;
  courierService: string | null;
  assignedToId: string | null;
  createdAt: Date;
  items: {
    productId: string | null;
    name: string;
    quantity: number;
    lineTotal: number;
    cost: number;
  }[];
  pl: OrderProfit | null;
}

const COURIER_NAMES: Record<string, string> = {
  steadfast: 'Steadfast',
  pathao: 'Pathao',
  redx: 'RedX',
  paperfly: 'Paperfly',
};

/** Dashboard and Reports (demo pageDashboard / pageReports) from real orders only. */
@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly catalog: CatalogCheckoutService,
    private readonly stats: CatalogStatsService,
    private readonly fraud: FraudService,
    private readonly panel: OrderPanelService,
    private readonly ops: OpsService,
  ) {}

  /** Orders placed since `from`, with product cost and realised profit. */
  private async orders(
    from: Date,
  ): Promise<{ orders: Costed[]; facts: Map<string, ProductFacts>; missingCost: number }> {
    const rows = await this.prisma.order.findMany({
      where: { createdAt: { gte: from } },
      orderBy: { createdAt: 'asc' },
      select: orderSelect,
    });
    const facts = await this.catalog.reportFacts(
      rows.flatMap((o) =>
        o.items.map((i) => i.productId).filter((id): id is string => Boolean(id)),
      ),
    );
    let missingCost = 0;
    const orders = rows.map((o) => {
      const status = fromDb(o.status);
      const items = o.items.map((i) => {
        const f = i.productId ? facts.get(i.productId) : undefined;
        const unit = f
          ? ((i.variantId ? f.variantCost.get(i.variantId) : undefined) ?? f.defaultCost)
          : null;
        if (unit === null && isSale(status)) missingCost++;
        return {
          productId: i.productId,
          name: f?.name ?? i.productName,
          quantity: i.quantity,
          lineTotal: i.lineTotal,
          cost: (unit ?? 0) * i.quantity,
        };
      });
      const cost = items.reduce((n, i) => n + i.cost, 0);
      return {
        status,
        total: o.total,
        city: o.city,
        source: o.source,
        courierService: o.courierService,
        assignedToId: o.assignedToId,
        createdAt: o.createdAt,
        items,
        pl: orderProfit({ ...o, status, cost }),
      };
    });
    return { orders, facts, missingCost };
  }

  private profitDays(orders: Costed[], days: number, now: Date): ProfitDay[] {
    const out = new Map<string, ProfitDay>();
    for (let d = days - 1; d >= 0; d--) {
      const day = bucketKey(addDays(now, -d), 'day');
      out.set(day, {
        day,
        delivered: 0,
        returned: 0,
        revenue: 0,
        productCost: 0,
        courier: 0,
        returnLoss: 0,
        ads: null,
        expenses: null,
        profit: 0,
      });
    }
    for (const o of orders) {
      const row = out.get(bucketKey(o.createdAt, 'day'));
      if (!row || !o.pl) continue;
      if (o.status === 'returned') row.returned++;
      else row.delivered++;
      row.revenue += o.pl.revenue;
      row.productCost += o.pl.productCost;
      row.courier += o.pl.courier;
      row.returnLoss += o.pl.returnLoss;
      row.profit += o.pl.profit;
    }
    return [...out.values()];
  }

  async dashboard(now = new Date()): Promise<DashboardOverview> {
    const from30 = addDays(startOfDay(now), -29);
    const [{ orders, missingCost }, panel, ship, lowStock, staff, pending] = await Promise.all([
      this.orders(from30),
      this.panel.overview(),
      this.ops.shipments(),
      this.stats.lowStock(5),
      this.panel.staff(),
      this.prisma.order.findMany({ where: { status: 'PENDING' }, select: { phone: true } }),
    ]);
    const saved = await this.fraud.saved(pending.map((p) => p.phone));
    const f7 = this.profitDays(orders, 7, now);
    const payout = ship.payouts.reduce((n, p) => n + p.net, 0);

    const days = f7.map(({ day }) => {
      const mine = orders.filter((o) => bucketKey(o.createdAt, 'day') === day);
      return {
        day,
        orders: mine.length,
        delivered: mine.filter((o) => o.status === 'delivered').length,
      };
    });

    const counts = new Map<OrderStatusName, number>();
    for (const o of orders) counts.set(o.status, (counts.get(o.status) ?? 0) + 1);

    const names = new Map(staff.map((s) => [s.id, s.name]));
    const teams = new Map<string, DashboardOverview['team'][number]>();
    for (const o of orders) {
      const key = o.assignedToId ?? '';
      const t = teams.get(key) ?? {
        id: o.assignedToId,
        name: o.assignedToId ? (names.get(o.assignedToId) ?? 'Former staff') : 'Unassigned',
        handled: 0,
        confirmed: 0,
        cancelled: 0,
      };
      t.handled++;
      if (!NOT_CONFIRMED.includes(o.status)) t.confirmed++;
      if (o.status === 'cancelled') t.cancelled++;
      teams.set(key, t);
    }

    const sold = new Map<string, { name: string; quantity: number }>();
    for (const o of orders) {
      if (!isSale(o.status)) continue;
      for (const i of o.items) {
        if (!i.productId) continue;
        const s = sold.get(i.productId) ?? { name: i.name, quantity: 0 };
        s.quantity += i.quantity;
        sold.set(i.productId, s);
      }
    }
    const top = [...sold.entries()].sort((a, b) => b[1].quantity - a[1].quantity).slice(0, 5);
    const images = await this.catalog.mainImages(top.map(([id]) => id));

    const attention: DashboardAlert[] = [
      ...panel.attention.map((a) => ({
        kind: a.kind,
        number: a.number,
        text:
          a.kind === 'dup'
            ? `#${a.number} ${a.customerName} looks like a duplicate`
            : `#${a.number} came from a blocked ${a.by}`,
      })),
      ...lowStock.map((p) => ({
        kind: 'stock' as const,
        text: `${p.name}: ${p.stock <= 0 ? 'out of stock' : `only ${p.stock} left`}`,
      })),
    ];

    return {
      kpis: panel.kpis,
      finance: {
        profit7: f7.reduce((n, d) => n + d.profit, 0),
        revenue7: f7.reduce((n, d) => n + d.revenue, 0),
        withCouriers: ship.couriers.reduce((n, c) => n + c.inTransitCod, 0) + payout,
        readyForPayout: payout,
        unchecked: pending.filter((p) => !saved[p.phone]).length,
      },
      days,
      attention,
      statuses: ORDER_STATUSES.filter((s) => counts.get(s)).map((s) => ({
        status: s,
        count: counts.get(s)!,
      })),
      team: [...teams.values()].sort((a, b) => b.handled - a.handled),
      bestSellers: top.map(([productId, s]) => ({
        productId,
        name: s.name,
        image: images.get(productId) ?? null,
        quantity: s.quantity,
      })),
      missingCost,
    };
  }

  async report(tab: ReportTab, days: ReportPeriod, now = new Date()): Promise<ReportPage> {
    const { orders, facts, missingCost } = await this.orders(addDays(startOfDay(now), -(days - 1)));
    const daily = this.profitDays(orders, days, now);
    const sum = (k: 'revenue' | 'delivered' | 'profit' | 'returned') =>
      daily.reduce((n, d) => n + d[k], 0);
    const base = {
      tab,
      days,
      summary: {
        sales: sum('revenue'),
        delivered: sum('delivered'),
        profit: sum('profit'),
        returned: sum('returned'),
      },
      missingCost,
      note: null as string | null,
    };
    const col = (label: string, kind: ReportColumn['kind'] = 'int'): ReportColumn => ({
      label,
      kind,
    });

    if (tab === 'daily') {
      const today = bucketKey(now, 'day');
      return {
        ...base,
        head: [
          col('Date', 'text'),
          col('Delivered'),
          col('Returned'),
          col('Sales', 'money'),
          col('Product cost', 'money'),
          col('Courier', 'money'),
          col('Return loss', 'money'),
          col('Ads', 'money'),
          col('Expenses', 'money'),
          col('Net profit', 'money'),
        ],
        rows: [...daily]
          .reverse()
          .map((d) => [
            d.day === today ? 'Today' : bucketLabel(new Date(`${d.day}T06:00:00Z`), 'day'),
            d.delivered,
            d.returned,
            d.revenue,
            d.productCost,
            d.courier,
            d.returnLoss,
            d.ads,
            d.expenses,
            d.profit,
          ]),
        note: 'Grouped by the day the order was placed. Ads and expenses appear once Accounts is set up.',
      };
    }

    if (tab === 'products') {
      const by = new Map<string, { name: string; units: number; value: number; gross: number }>();
      for (const o of orders) {
        if (!isSale(o.status)) continue;
        for (const i of o.items) {
          const key = i.productId ?? `name:${i.name}`;
          const g = by.get(key) ?? { name: i.name, units: 0, value: 0, gross: 0 };
          g.units += i.quantity;
          g.value += i.lineTotal;
          g.gross += i.lineTotal - i.cost;
          by.set(key, g);
        }
      }
      return {
        ...base,
        head: [
          col('Product', 'text'),
          col('Category', 'text'),
          col('Units'),
          col('Sales value', 'money'),
          col('Gross profit', 'money'),
          col('Stock left'),
        ],
        rows: [...by.entries()]
          .sort((a, b) => b[1].units - a[1].units)
          .map(([key, g]) => {
            const f = facts.get(key);
            return [g.name, f?.category ?? '—', g.units, g.value, g.gross, f ? f.stock : null];
          }),
        note: 'Open orders count too (cancelled, returned and fake do not). Gross profit = sales − product cost.',
      };
    }

    if (tab === 'status') {
      return {
        ...base,
        head: [col('Status', 'text'), col('Orders'), col('Value', 'money'), col('Share', 'pct')],
        rows: ORDER_STATUSES.map((s) => {
          const mine = orders.filter((o) => o.status === s);
          return [
            ORDER_STATUS_LABELS[s],
            mine.length,
            mine.reduce((n, o) => n + o.total, 0),
            pct(mine.length, orders.length),
          ];
        }),
      };
    }

    const staff =
      tab === 'team' ? new Map((await this.panel.staff()).map((s) => [s.id, s.name])) : null;
    const keyOf = (o: Costed): [string, string] | null => {
      if (tab === 'district') return [o.city, o.city];
      if (tab === 'source') return [o.source, o.source];
      if (tab === 'courier')
        return o.courierService
          ? [o.courierService, COURIER_NAMES[o.courierService] ?? o.courierService]
          : null;
      return o.assignedToId
        ? [o.assignedToId, staff!.get(o.assignedToId) ?? 'Former staff']
        : ['', 'Unassigned'];
    };
    const groups = new Map<
      string,
      {
        label: string;
        orders: number;
        delivered: number;
        returned: number;
        cancelled: number;
        value: number;
        profit: number;
      }
    >();
    for (const o of orders) {
      const k = keyOf(o);
      if (!k) continue;
      const g = groups.get(k[0]) ?? {
        label: k[1],
        orders: 0,
        delivered: 0,
        returned: 0,
        cancelled: 0,
        value: 0,
        profit: 0,
      };
      g.orders++;
      if (o.status === 'delivered') g.delivered++;
      if (o.status === 'returned') g.returned++;
      if (o.status === 'cancelled') g.cancelled++;
      if (o.status !== 'cancelled') g.value += o.total;
      g.profit += o.pl?.profit ?? 0;
      groups.set(k[0], g);
    }
    return {
      ...base,
      head: [
        col('Name', 'text'),
        col('Orders'),
        col('Delivered'),
        col('Returned'),
        col('Cancelled'),
        col('Success', 'pct'),
        col('Order value', 'money'),
        col('Realised profit', 'money'),
      ],
      rows: [...groups.values()]
        .sort((a, b) => b.value - a.value)
        .map((g) => [
          g.label,
          g.orders,
          g.delivered,
          g.returned,
          g.cancelled,
          pct(g.delivered, g.delivered + g.returned),
          g.value,
          g.profit,
        ]),
      note: 'Success = delivered ÷ (delivered + returned). Order value leaves out cancelled orders.',
    };
  }
}

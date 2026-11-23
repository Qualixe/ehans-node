import { Injectable } from '@nestjs/common';
import {
  type AdminNavigation,
  type AdminSearchResults,
  type DashboardMetrics,
  type DashboardRange,
  ORDER_CHANNEL_INFO,
  ORDER_CHANNELS,
  type OrderChannelName,
  type OrderStatusName,
} from '@ehans/shared';
import { OrderStatus } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import {
  addDays,
  addMonths,
  bucketKey,
  bucketLabel,
  startOfDay,
  startOfMonth,
} from './dhaka-time.js';

/** Phone stored on anonymous POS sales; never counted as a customer. */
export const WALK_IN_PHONE = 'walk-in';

/** Statuses that count towards revenue (glowy: OrderStatus::revenueStatuses()). */
export const REVENUE_STATUSES: OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.CONFIRMED,
  OrderStatus.PROCESSING,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
];

const lower = <T extends string>(value: string) => value.toLowerCase() as T;

/** Percent change, as glowy's DashboardMetrics::change(). */
export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

type OrderMetrics = Omit<DashboardMetrics, 'storeStatus' | 'aov' | 'lowStock'> & {
  aov: { value: number; change: number | null };
};

/** Read-only order aggregates for the admin dashboard and navigation badges. */
@Injectable()
export class OrderStatsService {
  constructor(private readonly prisma: PrismaService) {}

  async dashboard(range: DashboardRange, now = new Date()): Promise<OrderMetrics> {
    const [start, bucket] =
      range === '7d'
        ? [addDays(startOfDay(now), -6), 'day' as const]
        : range === '30d'
          ? [addDays(startOfDay(now), -29), 'day' as const]
          : [addMonths(startOfMonth(now), -11), 'month' as const];
    const previousStart = new Date(start.getTime() - (now.getTime() - start.getTime()));

    const countable = (from: Date, to: Date) => ({
      status: { in: REVENUE_STATUSES },
      createdAt: { gte: from, lte: to },
    });

    const [current, previous, fulfilled, customers, customersBefore, newThisMonth] =
      await Promise.all([
        this.prisma.order.findMany({
          where: countable(start, now),
          select: { total: true, subtotal: true, discount: true, createdAt: true },
        }),
        this.prisma.order.aggregate({
          where: countable(previousStart, start),
          _sum: { total: true },
          _count: { _all: true },
        }),
        this.prisma.order.count({
          where: { ...countable(start, now), status: OrderStatus.DELIVERED },
        }),
        this.prisma.order.groupBy({ by: ['phone'], where: { phone: { not: WALK_IN_PHONE } } }),
        this.prisma.order.groupBy({
          by: ['phone'],
          where: { phone: { not: WALK_IN_PHONE }, createdAt: { lt: start } },
        }),
        this.prisma.order.groupBy({
          by: ['phone'],
          where: { phone: { not: WALK_IN_PHONE } },
          having: { createdAt: { _min: { gte: startOfMonth(now) } } },
        }),
      ]);

    const revenue = current.reduce((sum, o) => sum + o.total, 0);
    const previousRevenue = previous._sum.total ?? 0;
    const orderCount = current.length;
    const previousCount = previous._count._all;
    const aov = orderCount > 0 ? Math.floor(revenue / orderCount) : 0;
    const previousAov = previousCount > 0 ? Math.floor(previousRevenue / previousCount) : 0;

    return {
      range,
      revenue: {
        value: revenue,
        previous: previousRevenue,
        change: percentChange(revenue, previousRevenue),
      },
      orders: {
        value: orderCount,
        fulfilled,
        change: percentChange(orderCount, previousCount),
      },
      customers: {
        value: customers.length,
        newThisMonth: newThisMonth.length,
        change: percentChange(customers.length, customersBefore.length),
      },
      aov: { value: aov, change: percentChange(aov, previousAov) },
      chart: this.chart(current, start, now, bucket),
      channels: await this.channels(start, now),
      topProducts: await this.topProducts(start, now),
      recentOrders: await this.recentOrders(8),
    };
  }

  private chart(
    orders: { total: number; subtotal: number; discount: number; createdAt: Date }[],
    start: Date,
    end: Date,
    bucket: 'day' | 'month',
  ): DashboardMetrics['chart'] {
    const grouped = new Map<string, { gross: number; net: number }>();
    for (const o of orders) {
      const key = bucketKey(o.createdAt, bucket);
      const g = grouped.get(key) ?? { gross: 0, net: 0 };
      g.gross += o.total;
      g.net += o.subtotal - o.discount;
      grouped.set(key, g);
    }
    const labels: string[] = [];
    const gross: number[] = [];
    const net: number[] = [];
    for (
      let date = start;
      date <= end;
      date = bucket === 'day' ? addDays(date, 1) : addMonths(date, 1)
    ) {
      const g = grouped.get(bucketKey(date, bucket));
      labels.push(bucketLabel(date, bucket));
      gross.push(g?.gross ?? 0);
      net.push(g?.net ?? 0);
    }
    return { labels, gross, net };
  }

  private async channels(from: Date, to: Date): Promise<DashboardMetrics['channels']> {
    const rows = await this.prisma.order.groupBy({
      by: ['channel'],
      where: { createdAt: { gte: from, lte: to } },
      _count: { _all: true },
    });
    const counts = new Map(rows.map((r) => [lower<OrderChannelName>(r.channel), r._count._all]));
    const total = Math.max(
      1,
      rows.reduce((n, r) => n + r._count._all, 0),
    );
    return ORDER_CHANNELS.map((channel) => ({
      channel,
      ...ORDER_CHANNEL_INFO[channel],
      count: counts.get(channel) ?? 0,
      percent: Math.round(((counts.get(channel) ?? 0) / total) * 1000) / 10,
    })).filter((c) => c.count > 0);
  }

  private async topProducts(from: Date, to: Date): Promise<DashboardMetrics['topProducts']> {
    const rows = await this.prisma.orderItem.groupBy({
      by: ['productName'],
      where: { order: { status: { in: REVENUE_STATUSES }, createdAt: { gte: from, lte: to } } },
      _sum: { quantity: true, lineTotal: true },
      orderBy: { _sum: { lineTotal: 'desc' } },
      take: 5,
    });
    return rows.map((r) => ({
      name: r.productName,
      quantity: r._sum.quantity ?? 0,
      revenue: r._sum.lineTotal ?? 0,
    }));
  }

  async recentOrders(limit: number): Promise<DashboardMetrics['recentOrders']> {
    const orders = await this.prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        number: true,
        customerName: true,
        status: true,
        channel: true,
        total: true,
        createdAt: true,
        _count: { select: { items: true } },
      },
    });
    return orders.map((o) => ({
      id: o.id,
      number: o.number,
      customerName: o.customerName,
      status: lower<OrderStatusName>(o.status),
      channel: lower<OrderChannelName>(o.channel),
      total: o.total,
      itemCount: o._count.items,
      createdAt: o.createdAt.toISOString(),
    }));
  }

  /** Topbar search: up to 20 orders by number, customer name, phone or email. */
  async search(term: string): Promise<AdminSearchResults['orders']> {
    const orders = await this.prisma.order.findMany({
      where: {
        OR: [
          { number: { contains: term, mode: 'insensitive' } },
          { customerName: { contains: term, mode: 'insensitive' } },
          { phone: { contains: term } },
          { email: { contains: term, mode: 'insensitive' } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        number: true,
        customerName: true,
        phone: true,
        status: true,
        total: true,
        createdAt: true,
      },
    });
    return orders.map((o) => ({
      ...o,
      status: lower<OrderStatusName>(o.status),
      createdAt: o.createdAt.toISOString(),
    }));
  }

  pendingCount(): Promise<number> {
    return this.prisma.order.count({ where: { status: OrderStatus.PENDING } });
  }

  /** Latest pending orders for the topbar notification feed. */
  async pendingNotifications(limit = 5): Promise<AdminNavigation['notifications']> {
    const orders = await this.prisma.order.findMany({
      where: { status: OrderStatus.PENDING },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: { id: true, number: true, customerName: true, total: true, createdAt: true },
    });
    return orders.map((o) => ({ ...o, createdAt: o.createdAt.toISOString() }));
  }
}

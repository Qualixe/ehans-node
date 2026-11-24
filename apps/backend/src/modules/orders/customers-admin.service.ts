import { Injectable, NotFoundException } from '@nestjs/common';
import {
  type AdminCustomerDetail,
  type AdminCustomerRow,
  type AdminPage,
  type CustomerSort,
  type OrderStatusName,
  REVENUE_STATUSES,
} from '@ehans/shared';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CustomerAuthService } from '../auth/customer-auth.service.js';

const PAGE_SIZE = 25;
/** POS sales without a customer (glowy Order::WALK_IN_PHONE). */
export const WALK_IN_PHONE = 'walk-in';

const REVENUE_SQL = Prisma.join(
  REVENUE_STATUSES.map((s) => Prisma.sql`${s.toUpperCase()}::order_status`),
);
const escapeLike = (s: string) => s.replace(/[\\%_]/g, (c) => `\\${c}`);

interface CustomerSqlRow {
  phone: string;
  name: string;
  email: string | null;
  city: string;
  orders_count: bigint;
  spent: bigint | null;
  first_order_at: Date;
  last_order_at: Date;
}

/** glowy CustomerController: guests identified by phone number, aggregated from their orders. */
@Injectable()
export class CustomersAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accounts: CustomerAuthService,
  ) {}

  async list(
    q: string | undefined,
    sort: CustomerSort,
    page: number,
  ): Promise<AdminPage<AdminCustomerRow>> {
    const term = q?.trim();
    const search = term
      ? Prisma.sql`AND (customer_name ILIKE ${`%${escapeLike(term)}%`} OR phone ILIKE ${`%${escapeLike(term)}%`} OR email ILIKE ${`%${escapeLike(term)}%`})`
      : Prisma.empty;
    const order =
      sort === 'spent' ? Prisma.sql`spent DESC NULLS LAST` : Prisma.sql`last_order_at DESC`;

    const [countRows, rows] = await Promise.all([
      this.prisma.$queryRaw<{ total: bigint }[]>`
        SELECT COUNT(DISTINCT phone) AS total FROM orders
        WHERE phone <> ${WALK_IN_PHONE} ${search}`,
      this.prisma.$queryRaw<CustomerSqlRow[]>`
        SELECT phone,
               MAX(customer_name) AS name,
               MAX(email) AS email,
               MAX(city) AS city,
               COUNT(*) AS orders_count,
               SUM(CASE WHEN status IN (${REVENUE_SQL}) THEN total ELSE 0 END) AS spent,
               MIN(created_at) AS first_order_at,
               MAX(created_at) AS last_order_at
        FROM orders
        WHERE phone <> ${WALK_IN_PHONE} ${search}
        GROUP BY phone
        ORDER BY ${order}, phone
        LIMIT ${PAGE_SIZE} OFFSET ${(page - 1) * PAGE_SIZE}`,
    ]);
    const total = Number(countRows[0]?.total ?? 0);
    return {
      items: rows.map((r) => ({
        phone: r.phone,
        name: r.name,
        email: r.email,
        city: r.city,
        ordersCount: Number(r.orders_count),
        spent: Number(r.spent ?? 0),
        firstOrderAt: r.first_order_at.toISOString(),
        lastOrderAt: r.last_order_at.toISOString(),
      })),
      page,
      pageSize: PAGE_SIZE,
      total,
      totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    };
  }

  /** glowy CustomerPasswordController: staff set a new password for a customer who forgot it. */
  setPassword(userId: string, password: string, staffId: string): Promise<void> {
    return this.accounts.setPasswordByStaff(userId, password, staffId);
  }

  async detail(phone: string): Promise<AdminCustomerDetail> {
    if (phone === WALK_IN_PHONE) throw new NotFoundException('Customer not found');
    const orders = await this.prisma.order.findMany({
      where: { phone },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { items: true } } },
    });
    const latest = orders[0];
    if (!latest) throw new NotFoundException('Customer not found');
    const account = await this.accounts.accountForPhone(phone);

    const status = (s: string) => s.toLowerCase() as OrderStatusName;
    const countable = orders.filter((o) => REVENUE_STATUSES.includes(status(o.status)));
    const spent = countable.reduce((n, o) => n + o.total, 0);
    return {
      phone,
      name: latest.customerName,
      email: latest.email,
      address: latest.address,
      city: latest.city,
      firstOrderAt: orders[orders.length - 1]!.createdAt.toISOString(),
      stats: {
        orders: orders.length,
        spent,
        aov: countable.length ? Math.floor(spent / countable.length) : 0,
        cancelled: orders.filter((o) => ['cancelled', 'returned'].includes(status(o.status)))
          .length,
      },
      account,
      orders: orders.map((o) => ({
        number: o.number,
        createdAt: o.createdAt.toISOString(),
        itemCount: o._count.items,
        status: status(o.status),
        total: o.total,
      })),
    };
  }
}

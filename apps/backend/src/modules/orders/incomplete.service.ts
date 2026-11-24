import { HttpException, HttpStatus, Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  type AdminUser,
  BD_MOBILE,
  districtByKey,
  type IncompleteCapture,
  type IncompleteItem,
  type IncompletePage,
  type IncompleteRow,
  type IncompleteState,
  type PanelFilters,
} from '@ehans/shared';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { LoginThrottle } from '../auth/login-throttle.js';
import { CatalogCheckoutService } from '../catalog/catalog-checkout.service.js';
import { panelWindow } from './order-panel.service.js';

const STATES: IncompleteState[] = ['new', 'called', 'recovered'];

/**
 * Incomplete checkouts (order panel "Incomplete orders"): what a shopper typed in Buy now or
 * checkout once the phone number was valid, so staff can call and recover the sale.
 */
@Injectable()
export class IncompleteService {
  private readonly logger = new Logger(IncompleteService.name);
  /** a browser saves a draft while typing: 30 saves a minute per network is plenty */
  private readonly throttle = new LoginThrottle(30, 60_000);

  constructor(
    private readonly prisma: PrismaService,
    private readonly catalog: CatalogCheckoutService,
  ) {}

  /** Storefront: create or update this browser's draft. Recovered drafts are left alone. */
  async capture(input: IncompleteCapture, ip: string | undefined): Promise<void> {
    const key = ip ?? 'unknown';
    if (this.throttle.retryAfter(key) > 0) {
      throw new HttpException('Too many requests.', HttpStatus.TOO_MANY_REQUESTS);
    }
    this.throttle.hit(key);
    const phone = input.phone.replace(/[\s-]/g, '').replace(/^\+?88(?=01)/, '');
    if (!BD_MOBILE.test(phone) || !input.items.length) return;

    const existing = await this.prisma.incompleteCheckout.findUnique({
      where: { sessionKey: input.sessionKey },
      select: { state: true },
    });
    if (existing?.state === 'recovered') return;

    // names and prices from the catalog; products that vanished are dropped
    let lines: IncompleteItem[] = [];
    try {
      const resolved = await this.catalog.resolve(
        input.items.map((i) => ({
          productId: i.productId,
          variantId: i.variantId ?? null,
          quantity: i.quantity,
        })),
        { checkStock: false },
      );
      lines = resolved.map((l) => ({
        productId: l.productId,
        variantId: l.variantId,
        name: l.name,
        variantTitle: l.variantTitle,
        quantity: l.quantity,
        unitPrice: l.quantity
          ? Math.round((l.lineSubtotal - l.lineDiscount) / l.quantity)
          : l.unitPrice,
      }));
    } catch {
      return;
    }
    const data = {
      phone,
      name: input.name?.trim().slice(0, 100) || null,
      address: input.address?.trim().slice(0, 500) || null,
      district: input.district && districtByKey(input.district) ? input.district : null,
      items: lines as unknown as Prisma.InputJsonValue,
      value: lines.reduce((n, l) => n + l.unitPrice * l.quantity, 0),
      step: input.step.slice(0, 40),
      ipAddress: ip?.slice(0, 45) ?? null,
    };
    await this.prisma.incompleteCheckout.upsert({
      where: { sessionKey: input.sessionKey },
      create: { sessionKey: input.sessionKey, ...data },
      update: data,
    });
  }

  /** Checkout placed the order: this browser's draft is recovered and linked to it. */
  async recoveredBy(
    sessionKey: string | null | undefined,
    orderId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    if (!sessionKey) return;
    const db = tx ?? this.prisma;
    const draft = await db.incompleteCheckout.findUnique({
      where: { sessionKey },
      select: { id: true, state: true },
    });
    if (!draft || draft.state === 'recovered') return;
    await db.incompleteCheckout.update({
      where: { id: draft.id },
      data: { state: 'recovered', handledAt: new Date() },
    });
    await db.order.update({ where: { id: orderId }, data: { recoveredFromId: draft.id } });
  }

  async list(
    state: IncompleteState | 'all',
    f: Pick<PanelFilters, 'date' | 'from' | 'to'>,
  ): Promise<IncompletePage> {
    const window = panelWindow(f);
    const inRange: Prisma.IncompleteCheckoutWhereInput = window ? { createdAt: window } : {};
    const all = await this.prisma.incompleteCheckout.findMany({
      where: inRange,
      orderBy: { createdAt: 'desc' },
      include: {
        handledBy: { select: { name: true } },
        order: { select: { number: true } },
      },
    });
    const phones = [...new Set(all.map((r) => r.phone))];
    const past = phones.length
      ? await this.prisma.order.groupBy({
          by: ['phone'],
          where: { phone: { in: phones } },
          _count: { _all: true },
        })
      : [];
    const pastNames = phones.length
      ? await this.prisma.order.findMany({
          where: { phone: { in: phones } },
          orderBy: { createdAt: 'desc' },
          distinct: ['phone'],
          select: { phone: true, customerName: true },
        })
      : [];
    const items = all.map((r) => this.toRow(r, past, pastNames));
    const counts = { all: items.length, new: 0, called: 0, recovered: 0 };
    for (const r of items) counts[r.state]++;
    const recovered = items.filter((r) => r.state === 'recovered');
    return {
      items: state === 'all' ? items : items.filter((r) => r.state === state),
      counts,
      kpis: {
        total: items.length,
        cartValue: items.reduce((n, r) => n + r.value, 0),
        notContacted: counts.new,
        recovered: recovered.length,
        recoveredValue: recovered.reduce((n, r) => n + r.value, 0),
        atStake: items.filter((r) => r.state !== 'recovered').reduce((n, r) => n + r.value, 0),
      },
    };
  }

  async get(id: string): Promise<IncompleteRow> {
    const r = await this.prisma.incompleteCheckout.findUnique({
      where: { id },
      include: { handledBy: { select: { name: true } }, order: { select: { number: true } } },
    });
    if (!r) throw new NotFoundException('Incomplete checkout not found');
    return this.toRow(r, [], []);
  }

  async markCalled(id: string, actor: AdminUser): Promise<void> {
    const r = await this.prisma.incompleteCheckout.updateMany({
      where: { id, state: 'new' },
      data: { state: 'called', handledById: actor.id, handledAt: new Date() },
    });
    if (!r.count) throw new NotFoundException('Incomplete checkout not found');
  }

  async remove(id: string, actor: AdminUser): Promise<void> {
    await this.prisma.incompleteCheckout.deleteMany({ where: { id } });
    this.logger.log('incomplete checkout deleted', { id, staffId: actor.id });
  }

  private toRow(
    r: Prisma.IncompleteCheckoutGetPayload<{
      include: { handledBy: { select: { name: true } }; order: { select: { number: true } } };
    }>,
    past: { phone: string; _count: { _all: number } }[],
    pastNames: { phone: string; customerName: string }[],
  ): IncompleteRow {
    return {
      id: r.id,
      createdAt: r.createdAt.toISOString(),
      phone: r.phone,
      name: r.name,
      pastName: pastNames.find((p) => p.phone === r.phone)?.customerName ?? null,
      pastOrders: past.find((p) => p.phone === r.phone)?._count._all ?? 0,
      address: r.address,
      district: r.district,
      items: Array.isArray(r.items) ? (r.items as unknown as IncompleteItem[]) : [],
      value: r.value,
      step: r.step,
      state: STATES.includes(r.state as IncompleteState) ? (r.state as IncompleteState) : 'new',
      handledBy:
        r.handledBy && r.handledAt
          ? { name: r.handledBy.name, at: r.handledAt.toISOString() }
          : null,
      orderNumber: r.order?.number ?? null,
    };
  }
}

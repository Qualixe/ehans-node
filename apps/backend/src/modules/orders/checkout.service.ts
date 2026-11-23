import { randomBytes, timingSafeEqual } from 'node:crypto';
import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  type CheckoutItemInput,
  type CheckoutQuote,
  type OrderConfirmation,
  type OrderStatusName,
  type PlacedOrder,
  type PlaceOrderRequest,
  SHIPPING_ZONES,
  districtByKey,
} from '@ehans/shared';
import { STORE_SETTINGS } from '../../config/store-settings.js';
import { OrderChannel } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { LoginThrottle } from '../auth/login-throttle.js';
import { CatalogCheckoutService, type ResolvedLine } from '../catalog/catalog-checkout.service.js';
import { bucketKey } from './dhaka-time.js';

/** Confirmation links work for 30 days (glowy: temporarySignedRoute addDays(30)). */
const LINK_DAYS = 30;
const NUMBER_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Order number like glowy's (GL + yymmdd + 5 random): EH + yymmdd (Dhaka) + 5 random. */
export function orderNumber(now = new Date()): string {
  const ymd = bucketKey(now, 'day').replace(/-/g, '').slice(2);
  const bytes = randomBytes(5);
  return `EH${ymd}${[...bytes].map((b) => NUMBER_ALPHABET[b % NUMBER_ALPHABET.length]).join('')}`;
}

/** Totals for priced lines (glowy QuickCheckout::totals, with ehans' bundle discounts). */
export function totalsFor(lines: ResolvedLine[], district: string | null | undefined) {
  const subtotal = lines.reduce((n, l) => n + l.lineSubtotal, 0);
  const discount = lines.reduce((n, l) => n + l.lineDiscount, 0);
  const freeShipping = lines.some((l) => l.freeDelivery);
  const zone = district ? (districtByKey(district)?.zone ?? null) : null;
  const shipping = freeShipping || !zone ? 0 : SHIPPING_ZONES[zone].fee;
  return {
    subtotal,
    discount,
    freeShipping,
    zone,
    shipping,
    total: subtotal - discount + shipping,
  };
}

/** Storefront checkout: quotes, placing orders, the customer's confirmation page. */
@Injectable()
export class CheckoutService {
  private readonly logger = new Logger(CheckoutService.name);
  /** glowy: throttle:10,1 on order routes, per client IP */
  private readonly throttle = new LoginThrottle(10, 60_000);

  constructor(
    private readonly prisma: PrismaService,
    private readonly catalog: CatalogCheckoutService,
  ) {}

  async quote(items: CheckoutItemInput[], district?: string | null): Promise<CheckoutQuote> {
    const lines = await this.catalog.resolve(items);
    return {
      lines: lines.map((line) => {
        const { freeDelivery, ...rest } = line;
        void freeDelivery;
        return rest;
      }),
      ...totalsFor(lines, district),
    };
  }

  async place(input: PlaceOrderRequest, ip: string | undefined): Promise<PlacedOrder> {
    if (STORE_SETTINGS.status !== 'live') {
      throw new BadRequestException([
        'Online ordering is paused right now. Please call us to order.',
      ]);
    }
    const key = ip ?? 'unknown';
    const wait = this.throttle.retryAfter(key);
    if (wait > 0) {
      throw new HttpException(
        `Too many orders from your network. Please try again in ${wait} seconds.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    this.throttle.hit(key);

    const district = districtByKey(input.district);
    if (!district) throw new BadRequestException(['Please choose your district.']);
    const lines = await this.catalog.resolve(input.items);
    const totals = totalsFor(lines, district.key);
    const token = randomBytes(24).toString('base64url');

    const order = await this.prisma.$transaction(async (tx) => {
      await this.catalog.reserve(tx, lines);
      let number = orderNumber();
      while (await tx.order.findUnique({ where: { number }, select: { id: true } })) {
        number = orderNumber();
      }
      return tx.order.create({
        data: {
          number,
          accessToken: token,
          customerName: input.customerName.trim(),
          phone: input.phone,
          address: input.address.trim(),
          city: district.name,
          shippingZone: district.zone,
          note: input.note?.trim() || null,
          paymentMethod: 'cod',
          channel: OrderChannel.DIRECT,
          ipAddress: ip?.slice(0, 45) ?? null,
          subtotal: totals.subtotal,
          discount: totals.discount,
          shippingFee: totals.shipping,
          total: totals.total,
          items: {
            create: lines.map((l) => ({
              productId: l.productId,
              variantId: l.variantId,
              productName: l.name,
              variantTitle: l.variantTitle,
              unitPrice: l.unitPrice,
              quantity: l.quantity,
              lineTotal: l.lineSubtotal - l.lineDiscount,
            })),
          },
        },
        select: { id: true, number: true },
      });
    });
    this.logger.log('order placed', { orderId: order.id, mode: input.mode, total: totals.total });
    return { number: order.number, token };
  }

  /** The confirmation page, for whoever holds the link (number + secret token, 30 days). */
  async confirmation(number: string, token: string): Promise<OrderConfirmation> {
    const order = await this.prisma.order.findUnique({
      where: { number },
      include: { items: { orderBy: { createdAt: 'asc' } } },
    });
    const expired = !order || Date.now() - order.createdAt.getTime() > LINK_DAYS * 24 * 3600_000;
    const tokenOk =
      order?.accessToken &&
      token.length === order.accessToken.length &&
      timingSafeEqual(Buffer.from(token), Buffer.from(order.accessToken));
    if (!order || expired || !tokenOk) throw new NotFoundException('Order not found');
    const images = await this.catalog.mainImages(
      order.items.map((i) => i.productId).filter((id): id is string => id !== null),
    );

    return {
      number: order.number,
      status: order.status.toLowerCase() as OrderStatusName,
      createdAt: order.createdAt.toISOString(),
      customerName: order.customerName,
      phone: order.phone,
      address: order.address,
      city: order.city,
      paymentMethod: order.paymentMethod,
      note: order.note,
      items: order.items.map((i) => ({
        name: i.productName,
        variantTitle: i.variantTitle,
        image: i.productId ? (images.get(i.productId) ?? null) : null,
        unitPrice: i.unitPrice,
        quantity: i.quantity,
        lineTotal: i.lineTotal,
      })),
      subtotal: order.subtotal,
      discount: order.discount,
      shippingFee: order.shippingFee,
      total: order.total,
    };
  }
}

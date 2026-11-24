import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { type AdminUser, NOT_SALE_STATUSES, type OrderStatusName } from '@ehans/shared';
import { OrderStatus } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CourierService } from '../couriers/courier.service.js';
import { COURIER_NAMES, OrderPanelService } from './order-panel.service.js';

export interface CourierBookingInput {
  courier: string;
  /** Cash to collect; defaults to the order's total minus advance */
  cod?: number;
  note?: string | null;
  pathao?: { cityId: number; zoneId: number; areaId?: number | null; weightKg?: number };
}

/**
 * "Send to courier" (glowy OrderCourierController): books the parcel with the courier's API,
 * stores the real consignment and marks the order Shipped. Sync pulls the courier's status.
 */
@Injectable()
export class OrderCourierService {
  private readonly logger = new Logger(OrderCourierService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly couriers: CourierService,
    private readonly panel: OrderPanelService,
  ) {}

  async book(number: string, input: CourierBookingInput, actor: AdminUser) {
    const order = await this.prisma.order.findUnique({
      where: { number },
      include: { items: { select: { productName: true, variantTitle: true, quantity: true } } },
    });
    if (!order) throw new NotFoundException('Order not found');
    const status = order.status.toLowerCase() as OrderStatusName;
    if (order.consignmentId) {
      throw new BadRequestException([`#${number} is already booked (CN ${order.consignmentId}).`]);
    }
    if (NOT_SALE_STATUSES.includes(status)) {
      throw new BadRequestException([`#${number} is ${status}; it can't be sent to a courier.`]);
    }
    if (await this.panel.isBlocked(order.phone, order.ipAddress)) {
      throw new BadRequestException([`#${number}: the customer is blocked.`]);
    }

    const cod = Math.max(0, Math.round(input.cod ?? order.total - order.advance));
    const booking = await this.couriers.book(input.courier, {
      invoice: order.number,
      name: order.customerName,
      phone: order.phone,
      address: `${order.address}, ${order.city}`,
      cod,
      itemDescription: order.items
        .map(
          (i) => `${i.productName}${i.variantTitle ? ` (${i.variantTitle})` : ''} x${i.quantity}`,
        )
        .join(', '),
      quantity: order.items.reduce((n, i) => n + i.quantity, 0),
      note: input.note ?? order.note,
      pathao: input.pathao,
    });
    const name = COURIER_NAMES[input.courier] ?? input.courier;

    await this.prisma.$transaction([
      this.prisma.order.update({
        where: { id: order.id },
        data: {
          courier: name,
          courierService: input.courier,
          consignmentId: booking.consignmentId,
          trackingNumber: booking.trackingCode,
          courierStatus: booking.status,
          courierFee: booking.fee,
          codAmount: cod,
          courierSentAt: new Date(),
          status: OrderStatus.SHIPPED,
        },
      }),
      this.prisma.orderEvent.create({
        data: {
          orderId: order.id,
          kind: 'courier',
          actorId: actor.id,
          actorName: actor.name,
          text: `Sent to ${name} (CN ${booking.consignmentId}) by ${actor.name}`,
        },
      }),
    ]);
    this.logger.log('parcel booked', {
      orderId: order.id,
      courier: input.courier,
      staffId: actor.id,
    });
    return { number, consignmentId: booking.consignmentId, trackingCode: booking.trackingCode };
  }

  /** Bulk "Send to courier": books each order; failures are reported, not fatal. */
  async bookMany(numbers: string[], courier: string, actor: AdminUser) {
    const booked: string[] = [];
    const failed: { number: string; reason: string }[] = [];
    for (const number of numbers) {
      try {
        await this.book(number, { courier }, actor);
        booked.push(number);
      } catch (error) {
        const reason =
          error instanceof Error && 'getResponse' in error
            ? String(
                ((error as { getResponse: () => { message?: unknown } }).getResponse().message as
                  string[] | string | undefined) ?? error.message,
              )
            : 'failed';
        failed.push({ number, reason });
      }
    }
    return { booked, failed };
  }

  /** Pulls the courier's status; delivered / partial / returned move the order too. */
  async sync(number: string, actor: AdminUser) {
    const order = await this.prisma.order.findUnique({
      where: { number },
      select: { id: true, courierService: true, consignmentId: true, status: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (!order.courierService || !order.consignmentId) {
      throw new BadRequestException(['This order has not been sent to a courier yet.']);
    }
    const courierStatus = await this.couriers.status(order.courierService, order.consignmentId);
    await this.prisma.order.update({
      where: { id: order.id },
      data: { courierStatus, courierSyncedAt: new Date() },
    });
    const next = CourierService.orderStatusFor(order.courierService, courierStatus);
    if (next && next !== (order.status.toLowerCase() as OrderStatusName)) {
      await this.panel.setStatus(number, next, actor);
    }
    return { courierStatus, status: next ?? (order.status.toLowerCase() as OrderStatusName) };
  }
}

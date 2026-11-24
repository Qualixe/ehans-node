import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  AdminPage,
  CustomerOrderRow,
  OrderConfirmation,
  OrderStatusName,
} from '@ehans/shared';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CatalogCheckoutService } from '../catalog/catalog-checkout.service.js';

const PAGE_SIZE = 10;

/**
 * "My orders" for a signed-in customer (glowy AccountDashboardController / AccountOrderController):
 * only orders placed while signed in to this account.
 */
@Injectable()
export class AccountOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly catalog: CatalogCheckoutService,
  ) {}

  async list(customerId: string, page: number): Promise<AdminPage<CustomerOrderRow>> {
    const where = { userId: customerId };
    const [total, orders] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        select: {
          number: true,
          createdAt: true,
          status: true,
          total: true,
          items: { select: { productId: true }, orderBy: { createdAt: 'asc' } },
        },
      }),
    ]);
    const images = await this.catalog.mainImages(
      orders.flatMap((o) => o.items.map((i) => i.productId)).filter((id): id is string => !!id),
    );
    return {
      items: orders.map((o) => ({
        number: o.number,
        createdAt: o.createdAt.toISOString(),
        status: o.status.toLowerCase() as OrderStatusName,
        total: o.total,
        itemCount: o.items.length,
        images: o.items
          .map((i) => (i.productId ? images.get(i.productId) : undefined))
          .filter((src): src is string => !!src)
          .slice(0, 3),
      })),
      page,
      pageSize: PAGE_SIZE,
      total,
      totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    };
  }

  async detail(customerId: string, number: string): Promise<OrderConfirmation> {
    const order = await this.prisma.order.findFirst({
      where: { number, userId: customerId },
      include: { items: { orderBy: { createdAt: 'asc' } } },
    });
    if (!order) throw new NotFoundException('Order not found');
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

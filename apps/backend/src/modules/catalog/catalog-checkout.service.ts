import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { type CheckoutItemInput, type CheckoutLine, MAX_QUANTITY_PER_ITEM } from '@ehans/shared';
import type { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';

/** A priced line plus what the order needs to reserve stock and apply delivery rules. */
/** What reserving or releasing stock needs from an order line. */
export type StockLine = Pick<CheckoutLine, 'productId' | 'variantId' | 'name' | 'quantity'>;

export interface ResolvedLine extends CheckoutLine {
  /** The bundle tier applied to this line gives free delivery. */
  freeDelivery: boolean;
}

/**
 * Catalog side of checkout (glowy QuickCheckout::lines + OrderService::reserve): turns
 * "product, variant, quantity" into lines priced from the catalog, and reserves stock.
 * Exported for the orders module, which never reads catalog tables itself.
 */
@Injectable()
export class CatalogCheckoutService {
  constructor(private readonly prisma: PrismaService) {}

  async resolve(items: CheckoutItemInput[]): Promise<ResolvedLine[]> {
    if (!items.length) throw new BadRequestException(['Your bag is empty.']);
    const products = await this.prisma.product.findMany({
      where: { id: { in: [...new Set(items.map((i) => i.productId))] }, isActive: true },
      select: {
        id: true,
        name: true,
        price: true,
        stock: true,
        bundlesEnabled: true,
        images: { orderBy: { position: 'asc' }, take: 1, select: { path: true } },
        options: { select: { name: true }, orderBy: { position: 'asc' } },
        variants: {
          orderBy: { position: 'asc' },
          select: {
            id: true,
            title: true,
            price: true,
            stock: true,
            image: { select: { path: true } },
          },
        },
        bundles: { select: { quantity: true, discountPercent: true, freeDelivery: true } },
      },
    });

    // the same product/variant twice (e.g. cart lines at different bundle prices) is one line
    const merged = new Map<string, CheckoutItemInput>();
    for (const item of items) {
      const key = `${item.productId}:${item.variantId ?? ''}`;
      const prev = merged.get(key);
      merged.set(key, { ...item, quantity: (prev?.quantity ?? 0) + item.quantity });
    }

    return [...merged.values()].map((item) => {
      const product = products.find((p) => p.id === item.productId);
      if (!product) {
        throw new BadRequestException(['A product in your order is no longer available.']);
      }
      const hasOptions = product.options.length > 0;
      let variant = item.variantId
        ? product.variants.find((v) => v.id === item.variantId)
        : undefined;
      if (item.variantId && !variant) {
        throw new BadRequestException([`“${product.name}”: that option is no longer available.`]);
      }
      if (hasOptions && !variant) {
        throw new BadRequestException([
          `Please choose an available ${product.options.map((o) => o.name.toLowerCase()).join(' / ')} for “${product.name}”.`,
        ]);
      }
      // a product without options may still have its single "Default Title" variant (admin-made)
      if (!hasOptions && !variant && product.variants.length === 1) variant = product.variants[0];

      if (item.quantity > MAX_QUANTITY_PER_ITEM) {
        throw new BadRequestException([
          `You can order at most ${MAX_QUANTITY_PER_ITEM} of “${product.name}” at a time.`,
        ]);
      }
      const available = variant ? variant.stock : product.stock;
      if (available <= 0) {
        throw new BadRequestException([`Sorry, “${product.name}” is out of stock.`]);
      }
      if (item.quantity > available) {
        throw new BadRequestException([`Only ${available} of “${product.name}” left in stock.`]);
      }

      const unitPrice = variant?.price ?? product.price;
      // Bundle & Save: the biggest tier not above the quantity ("Buy 3, save 15%")
      const tier = (product.bundlesEnabled ? product.bundles : [])
        .filter((b) => b.quantity <= item.quantity)
        .sort((a, b) => b.quantity - a.quantity)[0];
      const lineSubtotal = unitPrice * item.quantity;
      const discountPercent = tier?.discountPercent ?? 0;
      return {
        productId: product.id,
        variantId: variant?.id ?? null,
        name: product.name,
        variantTitle: hasOptions && variant ? variant.title : null,
        image: variant?.image?.path ?? product.images[0]?.path ?? null,
        unitPrice,
        quantity: item.quantity,
        discountPercent,
        lineSubtotal,
        // whole taka, like every money value in the shop
        lineDiscount: Math.round((lineSubtotal * discountPercent) / 100),
        freeDelivery: tier?.freeDelivery ?? false,
      };
    });
  }

  /** Main image per product (order pages show it next to each line). */
  async mainImages(productIds: string[]): Promise<Map<string, string>> {
    const rows = await this.prisma.productImage.findMany({
      where: { productId: { in: [...new Set(productIds)] } },
      orderBy: [{ productId: 'asc' }, { position: 'asc' }],
      distinct: ['productId'],
      select: { productId: true, path: true },
    });
    return new Map(rows.map((r) => [r.productId, r.path]));
  }

  /**
   * Takes the ordered units out of stock inside the order's transaction. The variant is the
   * stock-keeping unit; the product total and sold count move with it (glowy reserve()).
   * Throws when another order took the last units in the meantime.
   */
  async reserve(tx: Prisma.TransactionClient, lines: StockLine[]): Promise<void> {
    for (const line of lines) {
      if (line.variantId) {
        const v = await tx.productVariant.updateMany({
          where: { id: line.variantId, productId: line.productId, stock: { gte: line.quantity } },
          data: { stock: { decrement: line.quantity } },
        });
        if (v.count === 0) throw outOfStock(line.name);
      }
      const p = await tx.product.updateMany({
        where: { id: line.productId, stock: { gte: line.quantity } },
        data: { stock: { decrement: line.quantity }, soldCount: { increment: line.quantity } },
      });
      if (p.count === 0) throw outOfStock(line.name);
    }
  }

  /**
   * Puts a cancelled or returned order's units back in stock (glowy OrderService::transition).
   * Lines whose product was deleted are skipped; the sold count never goes below zero.
   */
  async release(tx: Prisma.TransactionClient, lines: StockLine[]): Promise<void> {
    for (const line of lines) {
      if (line.variantId) {
        await tx.productVariant.updateMany({
          where: { id: line.variantId, productId: line.productId },
          data: { stock: { increment: line.quantity } },
        });
      }
      await tx.$executeRaw`
        UPDATE products
        SET stock = stock + ${line.quantity},
            sold_count = GREATEST(sold_count - ${line.quantity}, 0)
        WHERE id = ${line.productId}::uuid`;
    }
  }
}

const outOfStock = (name: string) =>
  new ConflictException([`Sorry, “${name}” just went out of stock.`]);

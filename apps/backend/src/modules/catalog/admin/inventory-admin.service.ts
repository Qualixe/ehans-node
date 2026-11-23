import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  type InventoryPage,
  type InventoryRow,
  LOW_STOCK_THRESHOLD,
  type StockAdjustment,
  type StockFilter,
} from '@ehans/shared';
import { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../../prisma/prisma.service.js';

const PAGE_SIZE = 30;

/**
 * Every stock line: product variants, plus products without variants (their stock lives on the
 * product row). glowy only lists variants because it gives every product a default variant.
 */
const LINES = Prisma.sql`
  SELECT 'variant' AS kind, v.id, p.id AS product_id, p.name AS product_name, c.name AS category_name,
         v.title AS variant_title, v.sku, v.stock, v.price, v.position,
         COALESCE(vi.path, (SELECT pi.path FROM product_images pi
                             WHERE pi.product_id = p.id ORDER BY pi.position LIMIT 1)) AS image,
         p.sku AS product_sku
    FROM product_variants v
    JOIN products p ON p.id = v.product_id
    LEFT JOIN categories c ON c.id = p.category_id
    LEFT JOIN product_images vi ON vi.id = v.image_id
  UNION ALL
  SELECT 'product', p.id, p.id, p.name, c.name, NULL, p.sku, p.stock, p.price, 0,
         (SELECT pi.path FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.position LIMIT 1),
         p.sku
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
   WHERE NOT EXISTS (SELECT 1 FROM product_variants v WHERE v.product_id = p.id)`;

interface LineRow {
  kind: 'variant' | 'product';
  id: string;
  product_id: string;
  product_name: string;
  category_name: string | null;
  variant_title: string | null;
  sku: string | null;
  stock: number;
  price: number;
  image: string | null;
}

/** Admin Inventory screen (glowy InventoryController). */
@Injectable()
export class InventoryAdminService {
  private readonly logger = new Logger(InventoryAdminService.name);

  constructor(private readonly prisma: PrismaService) {}

  async list(filter: { stock?: StockFilter; q?: string; page: number }): Promise<InventoryPage> {
    const t = LOW_STOCK_THRESHOLD;
    const conditions: Prisma.Sql[] = [];
    if (filter.stock === 'low') conditions.push(Prisma.sql`stock BETWEEN 1 AND ${t}`);
    if (filter.stock === 'out') conditions.push(Prisma.sql`stock = 0`);
    const term = filter.q?.trim();
    if (term) {
      // a literal search: escape LIKE wildcards in what the admin typed
      const like = `%${term.replace(/[\\%_]/g, (m) => `\\${m}`)}%`;
      conditions.push(
        Prisma.sql`(sku ILIKE ${like} OR variant_title ILIKE ${like} OR product_name ILIKE ${like} OR product_sku ILIKE ${like})`,
      );
    }
    const where = conditions.length
      ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`
      : Prisma.empty;

    const [rows, counted, summary] = await Promise.all([
      this.prisma.$queryRaw<LineRow[]>`
        SELECT * FROM (${LINES}) lines ${where}
         ORDER BY stock, product_id, position
         LIMIT ${PAGE_SIZE} OFFSET ${(filter.page - 1) * PAGE_SIZE}`,
      this.prisma.$queryRaw<{ total: bigint }[]>`
        SELECT COUNT(*) AS total FROM (${LINES}) lines ${where}`,
      this.prisma.$queryRaw<
        { units: bigint | null; value: bigint | null; low: bigint; out: bigint }[]
      >`
        SELECT SUM(stock) AS units, SUM(stock::bigint * price) AS value,
               COUNT(*) FILTER (WHERE stock BETWEEN 1 AND ${t}) AS low,
               COUNT(*) FILTER (WHERE stock = 0) AS out
          FROM (${LINES}) lines`,
    ]);
    const total = Number(counted[0]?.total ?? 0);
    const s = summary[0];
    return {
      items: rows.map((r): InventoryRow => ({
        kind: r.kind,
        id: r.id,
        productId: r.product_id,
        productName: r.product_name,
        categoryName: r.category_name,
        variantTitle: r.variant_title,
        sku: r.sku,
        stock: r.stock,
        price: r.price,
        image: r.image,
      })),
      page: filter.page,
      pageSize: PAGE_SIZE,
      total,
      totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
      threshold: t,
      summary: {
        units: Number(s?.units ?? 0),
        value: Number(s?.value ?? 0),
        low: Number(s?.low ?? 0),
        out: Number(s?.out ?? 0),
      },
    };
  }

  /** Sets or adds stock; a variant change also refreshes the product total (glowy refreshCaches). */
  async adjust(
    kind: 'variant' | 'product',
    id: string,
    { mode, quantity }: StockAdjustment,
  ): Promise<{ name: string; stock: number }> {
    const result = await this.prisma.$transaction(async (tx) => {
      if (kind === 'product') {
        const product = await tx.product.findUnique({
          where: { id },
          select: { name: true, stock: true },
        });
        if (!product) throw new NotFoundException('Product not found');
        const stock = mode === 'add' ? product.stock + quantity : quantity;
        await tx.product.update({ where: { id }, data: { stock } });
        return { name: product.name, stock };
      }
      const variant = await tx.productVariant.findUnique({
        where: { id },
        select: { stock: true, title: true, productId: true, product: { select: { name: true } } },
      });
      if (!variant) throw new NotFoundException('Variant not found');
      const stock = mode === 'add' ? variant.stock + quantity : quantity;
      await tx.productVariant.update({ where: { id }, data: { stock } });
      const sum = await tx.productVariant.aggregate({
        where: { productId: variant.productId },
        _sum: { stock: true },
      });
      await tx.product.update({
        where: { id: variant.productId },
        data: { stock: sum._sum.stock ?? 0 },
      });
      const isDefault = variant.title === 'Default Title';
      return {
        name: `${variant.product.name}${isDefault ? '' : ` (${variant.title})`}`,
        stock,
      };
    });
    this.logger.log('stock adjusted', { kind, id, mode, quantity, stock: result.stock });
    return result;
  }
}

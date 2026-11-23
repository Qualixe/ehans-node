import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { AdminPage, AdminProductRow, ProductStatusFilter } from '@ehans/shared';
import type { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { UploadsService } from '../../uploads/uploads.service.js';

const PAGE_SIZE = 20;

const rowSelect = {
  id: true,
  name: true,
  slug: true,
  sku: true,
  brand: true,
  price: true,
  compareAtPrice: true,
  stock: true,
  soldCount: true,
  isActive: true,
  isFeatured: true,
  category: { select: { name: true } },
  images: { orderBy: { position: 'asc' }, take: 1, select: { path: true } },
  _count: { select: { variants: true } },
} as const satisfies Prisma.ProductSelect;

type Row = Prisma.ProductGetPayload<{ select: typeof rowSelect }>;

const toRow = ({ category, images, _count, ...p }: Row): AdminProductRow => ({
  ...p,
  categoryName: category?.name ?? null,
  variantCount: _count.variants,
  image: images[0]?.path ?? null,
});

/** "name, SKU or brand contains" (glowy's LIKE search; Prisma escapes the term). */
const termFilter = (term: string): Prisma.ProductWhereInput => ({
  OR: [
    { name: { contains: term, mode: 'insensitive' } },
    { sku: { contains: term, mode: 'insensitive' } },
    { brand: { contains: term, mode: 'insensitive' } },
  ],
});

/** Admin Products list, delete and search (glowy ProductController / SearchController). */
@Injectable()
export class ProductsAdminService {
  private readonly logger = new Logger(ProductsAdminService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly uploads: UploadsService,
  ) {}

  async list(filter: {
    q?: string;
    category?: string;
    status?: ProductStatusFilter;
    page: number;
  }): Promise<AdminPage<AdminProductRow>> {
    const and: Prisma.ProductWhereInput[] = [];
    const term = filter.q?.trim();
    if (term) and.push(termFilter(term));
    if (filter.category) {
      const category = await this.prisma.category.findUnique({
        where: { id: filter.category },
        select: { id: true, children: { select: { id: true } } },
      });
      if (!category) throw new NotFoundException('Category not found');
      const ids = [category.id, ...category.children.map((c) => c.id)];
      // primary category, or a member of the collection (how the storefront lists it)
      and.push({
        OR: [{ categoryId: { in: ids } }, { collections: { some: { categoryId: { in: ids } } } }],
      });
    }
    if (filter.status) and.push({ isActive: filter.status === 'active' });
    const where: Prisma.ProductWhereInput = { AND: and };

    const [total, rows] = await Promise.all([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (filter.page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        select: rowSelect,
      }),
    ]);
    return {
      items: rows.map(toRow),
      page: filter.page,
      pageSize: PAGE_SIZE,
      total,
      totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    };
  }

  /** Topbar search: up to 20 products by name, SKU or brand. */
  async search(term: string): Promise<AdminProductRow[]> {
    const rows = await this.prisma.product.findMany({
      where: termFilter(term),
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: 20,
      select: rowSelect,
    });
    return rows.map(toRow);
  }

  /** Deletes the product (images, variants, memberships cascade) and its uploaded files. */
  async remove(id: string): Promise<{ name: string }> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      select: { name: true, images: { select: { path: true } } },
    });
    if (!product) throw new NotFoundException('Product not found');
    await this.prisma.product.delete({ where: { id } });
    await Promise.all(product.images.map((image) => this.uploads.delete(image.path)));
    this.logger.log('product deleted', { productId: id });
    return { name: product.name };
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { HOME_GRID_COLLECTION, HOME_GRID_PAGE_SIZE, HOME_GRID_TITLE } from '@ehans/shared';
import type {
  CategoryNode,
  HomeCatalog,
  ProductCard,
  ProductDetail,
  ProductListResponse,
} from '@ehans/shared';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import {
  categorySummarySelect,
  productCardInclude,
  productDetailInclude,
  toProductCard,
  toProductDetail,
} from './catalog.mapper.js';
import type { ListProductsQueryDto } from './dto/list-products.query.js';

const POPULAR_SIZE = 8;
const RELATED_SIZE = 8;

const ORDER_BY: Record<string, Prisma.ProductOrderByWithRelationInput[]> = {
  // `manual` without a category falls back to the featured order
  manual: [{ isFeatured: 'desc' }, { soldCount: 'desc' }, { createdAt: 'desc' }],
  featured: [{ isFeatured: 'desc' }, { soldCount: 'desc' }, { createdAt: 'desc' }],
  newest: [{ createdAt: 'desc' }],
  'price-asc': [{ price: 'asc' }],
  'price-desc': [{ price: 'desc' }],
  'best-selling': [{ soldCount: 'desc' }],
};

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  /** Top-level categories with their sub-categories and active product counts. */
  async categoryTree(): Promise<CategoryNode[]> {
    const categories = await this.prisma.category.findMany({
      where: { parentId: null, showInMenu: true },
      orderBy: [{ position: 'asc' }, { name: 'asc' }],
      include: {
        children: {
          where: { showInMenu: true },
          orderBy: { position: 'asc' },
          select: categorySummarySelect,
        },
      },
    });
    const ids = categories.flatMap((c) => [c.id, ...c.children.map((ch) => ch.id)]);
    const counts = await this.prisma.productCategory.groupBy({
      by: ['categoryId'],
      where: { categoryId: { in: ids }, product: { isActive: true } },
      _count: { _all: true },
    });
    const countBy = new Map(counts.map((c) => [c.categoryId, c._count._all]));
    return categories.map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      image: c.image,
      description: c.description,
      // own members; a group without its own members counts its children's
      productCount:
        countBy.get(c.id) ?? c.children.reduce((n, ch) => n + (countBy.get(ch.id) ?? 0), 0),
      children: c.children,
    }));
  }

  async home(): Promise<HomeCatalog> {
    const [categories, popular, trending] = await Promise.all([
      this.prisma.category.findMany({
        where: { homePosition: { not: null } },
        orderBy: { homePosition: 'asc' },
        select: categorySummarySelect,
      }),
      this.prisma.product.findMany({
        where: { isActive: true },
        orderBy: ORDER_BY['best-selling'],
        take: POPULAR_SIZE,
        include: productCardInclude,
      }),
      this.listProducts({
        category: HOME_GRID_COLLECTION,
        sort: 'manual',
        pageSize: HOME_GRID_PAGE_SIZE,
      }).catch((error: unknown) => {
        if (error instanceof NotFoundException) return null;
        throw error;
      }),
    ]);

    const gridCategory = trending
      ? await this.prisma.category.findUnique({
          where: { slug: HOME_GRID_COLLECTION },
          select: categorySummarySelect,
        })
      : null;

    return {
      categories,
      trending:
        trending && gridCategory
          ? {
              title: HOME_GRID_TITLE,
              category: gridCategory,
              items: trending.items,
              total: trending.total,
              pageSize: trending.pageSize,
            }
          : null,
      popular: popular.map(toProductCard),
    };
  }

  async listProducts(query: ListProductsQueryDto): Promise<ProductListResponse> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 24;
    const { where: base, categoryId } = await this.baseFilter(query);
    const where: Prisma.ProductWhereInput = {
      ...base,
      ...(query.minPrice !== undefined || query.maxPrice !== undefined
        ? { price: { gte: query.minPrice, lte: query.maxPrice } }
        : {}),
    };

    const skip = (page - 1) * pageSize;
    const manualCategoryId = query.sort === 'manual' ? categoryId : undefined;
    const pageItems = manualCategoryId
      ? // collection order: page through the collection's own memberships by position
        this.prisma.productCategory
          .findMany({
            where: { categoryId: manualCategoryId, product: where },
            orderBy: [{ position: 'asc' }, { productId: 'asc' }],
            skip,
            take: pageSize,
            include: { product: { include: productCardInclude } },
          })
          .then((rows) => rows.map((r) => r.product))
      : this.prisma.product.findMany({
          where,
          orderBy: ORDER_BY[query.sort ?? 'featured'],
          skip,
          take: pageSize,
          include: productCardInclude,
        });

    const [total, items, range] = await Promise.all([
      manualCategoryId
        ? this.prisma.productCategory.count({
            where: { categoryId: manualCategoryId, product: where },
          })
        : this.prisma.product.count({ where }),
      pageItems,
      // price range ignores the price filter so the slider bounds stay stable
      this.prisma.product.aggregate({ where: base, _min: { price: true }, _max: { price: true } }),
    ]);

    return {
      items: items.map(toProductCard),
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      priceRange: { min: range._min.price ?? 0, max: range._max.price ?? 0 },
    };
  }

  async search(q: string, limit = 8): Promise<ProductCard[]> {
    const { where } = await this.baseFilter({ q });
    const items = await this.prisma.product.findMany({
      where,
      orderBy: ORDER_BY['best-selling'],
      take: limit,
      include: productCardInclude,
    });
    return items.map(toProductCard);
  }

  async productBySlug(slug: string): Promise<ProductDetail> {
    const product = await this.prisma.product.findFirst({
      where: { slug, isActive: true },
      include: productDetailInclude,
    });
    if (!product) throw new NotFoundException('Product not found');

    const related = await this.prisma.product.findMany({
      where: { isActive: true, categoryId: product.categoryId, id: { not: product.id } },
      orderBy: ORDER_BY.featured,
      take: RELATED_SIZE,
      include: productCardInclude,
    });
    return toProductDetail(product, related.map(toProductCard));
  }

  /** Filters shared by list, search and the price-range aggregate. */
  private async baseFilter(
    query: Pick<ListProductsQueryDto, 'category' | 'q' | 'inStock'>,
  ): Promise<{ where: Prisma.ProductWhereInput; categoryId?: string }> {
    const and: Prisma.ProductWhereInput[] = [{ isActive: true }];
    let categoryId: string | undefined;

    if (query.category) {
      const category = await this.prisma.category.findUnique({
        where: { slug: query.category },
        select: { id: true, children: { select: { id: true } } },
      });
      if (!category) throw new NotFoundException('Category not found');
      categoryId = category.id;
      // collection membership (a group collection also lists its children's members)
      and.push({
        collections: {
          some: { categoryId: { in: [category.id, ...category.children.map((c) => c.id)] } },
        },
      });
    }

    const words = (query.q ?? '').trim().toLowerCase().split(/\s+/).filter(Boolean).slice(0, 6);
    for (const word of words) {
      // every typed word must match the name, a tag, or the category (same as the template search)
      and.push({
        OR: [
          { name: { contains: word, mode: 'insensitive' } },
          { tags: { has: word } },
          { category: { name: { contains: word, mode: 'insensitive' } } },
        ],
      });
    }

    if (query.inStock) and.push({ stock: { gt: 0 } });
    return { where: { AND: and }, categoryId };
  }
}

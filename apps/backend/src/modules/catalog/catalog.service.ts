import { Injectable, NotFoundException } from '@nestjs/common';
import type { CategoryNode, HomeCatalog, ProductCard, ProductDetail, ProductListResponse } from '@ehans/shared';
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

const HOME_SLIDER_SIZE = 8;
const RELATED_SIZE = 8;

const ORDER_BY: Record<string, Prisma.ProductOrderByWithRelationInput[]> = {
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
        children: { where: { showInMenu: true }, orderBy: { position: 'asc' }, select: categorySummarySelect },
      },
    });
    const counts = await this.prisma.product.groupBy({
      by: ['categoryId'],
      where: { isActive: true },
      _count: { _all: true },
    });
    const countBy = new Map(counts.map((c) => [c.categoryId, c._count._all]));
    return categories.map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      image: c.image,
      description: c.description,
      productCount: (countBy.get(c.id) ?? 0) + c.children.reduce((n, ch) => n + (countBy.get(ch.id) ?? 0), 0),
      children: c.children,
    }));
  }

  async home(): Promise<HomeCatalog> {
    const [categories, sliderCategories, popular] = await Promise.all([
      this.prisma.category.findMany({
        where: { parentId: null, showInMenu: true },
        orderBy: [{ position: 'asc' }, { name: 'asc' }],
        select: categorySummarySelect,
      }),
      this.prisma.category.findMany({
        where: { homePosition: { not: null } },
        orderBy: { homePosition: 'asc' },
        select: { ...categorySummarySelect, homeTitle: true, children: { select: { id: true } } },
      }),
      this.prisma.product.findMany({
        where: { isActive: true },
        orderBy: ORDER_BY['best-selling'],
        take: HOME_SLIDER_SIZE,
        include: productCardInclude,
      }),
    ]);

    const sliders = await Promise.all(
      sliderCategories.map(async (c) => {
        const products = await this.prisma.product.findMany({
          where: { isActive: true, categoryId: { in: [c.id, ...c.children.map((ch) => ch.id)] } },
          orderBy: ORDER_BY.featured,
          take: HOME_SLIDER_SIZE,
          include: productCardInclude,
        });
        return {
          title: c.homeTitle ?? c.name,
          category: { id: c.id, slug: c.slug, name: c.name, image: c.image },
          products: products.map(toProductCard),
        };
      }),
    );

    return { categories, sliders: sliders.filter((s) => s.products.length > 0), popular: popular.map(toProductCard) };
  }

  async listProducts(query: ListProductsQueryDto): Promise<ProductListResponse> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 24;
    const base = await this.baseWhere(query);
    const where: Prisma.ProductWhereInput = {
      ...base,
      ...(query.minPrice !== undefined || query.maxPrice !== undefined
        ? { price: { gte: query.minPrice, lte: query.maxPrice } }
        : {}),
    };

    const [total, items, range] = await Promise.all([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        orderBy: ORDER_BY[query.sort ?? 'featured'],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: productCardInclude,
      }),
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
    const where = await this.baseWhere({ q });
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
  private async baseWhere(query: Pick<ListProductsQueryDto, 'category' | 'q' | 'inStock'>): Promise<Prisma.ProductWhereInput> {
    const and: Prisma.ProductWhereInput[] = [{ isActive: true }];

    if (query.category) {
      const category = await this.prisma.category.findUnique({
        where: { slug: query.category },
        select: { id: true, children: { select: { id: true } } },
      });
      if (!category) throw new NotFoundException('Category not found');
      and.push({ categoryId: { in: [category.id, ...category.children.map((c) => c.id)] } });
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
    return { AND: and };
  }
}

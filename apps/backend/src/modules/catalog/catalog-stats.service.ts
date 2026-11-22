import { Injectable } from '@nestjs/common';
import { type DashboardMetrics, LOW_STOCK_THRESHOLD } from '@ehans/shared';
import { PrismaService } from '../../prisma/prisma.service.js';

/** Catalog figures for the admin dashboard and navigation badges. */
@Injectable()
export class CatalogStatsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Active products at or below the low-stock threshold, lowest first. */
  async lowStock(limit = 6): Promise<DashboardMetrics['lowStock']> {
    const products = await this.prisma.product.findMany({
      where: { isActive: true, stock: { lte: LOW_STOCK_THRESHOLD } },
      orderBy: [{ stock: 'asc' }, { name: 'asc' }],
      take: limit,
      select: {
        id: true,
        slug: true,
        name: true,
        stock: true,
        images: { orderBy: { position: 'asc' }, take: 1, select: { path: true } },
      },
    });
    return products.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      stock: p.stock,
      image: p.images[0]?.path ?? null,
    }));
  }

  lowStockCount(): Promise<number> {
    return this.prisma.product.count({
      where: { isActive: true, stock: { lte: LOW_STOCK_THRESHOLD } },
    });
  }

  pendingReviewCount(): Promise<number> {
    return this.prisma.review.count({ where: { isApproved: false } });
  }
}

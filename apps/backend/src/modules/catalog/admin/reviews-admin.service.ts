import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { AdminPage, AdminReview, ReviewStatusFilter } from '@ehans/shared';
import { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../../prisma/prisma.service.js';

const PAGE_SIZE = 20;

/** Admin Reviews screen (glowy ReviewController): approve, hide, delete. */
@Injectable()
export class ReviewsAdminService {
  private readonly logger = new Logger(ReviewsAdminService.name);

  constructor(private readonly prisma: PrismaService) {}

  async list(status: ReviewStatusFilter, page: number): Promise<AdminPage<AdminReview>> {
    const where = status === 'all' ? {} : { isApproved: status === 'approved' };
    const [total, rows] = await Promise.all([
      this.prisma.review.count({ where }),
      this.prisma.review.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        include: { product: { select: { id: true, name: true, slug: true } } },
      }),
    ]);
    return {
      items: rows.map((r) => ({
        id: r.id,
        product: r.product,
        name: r.name,
        email: r.email,
        rating: r.rating,
        body: r.body,
        isApproved: r.isApproved,
        createdAt: r.createdAt.toISOString(),
      })),
      page,
      pageSize: PAGE_SIZE,
      total,
      totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    };
  }

  async setApproved(id: string, isApproved: boolean): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const review = await tx.review
        .update({ where: { id }, data: { isApproved } })
        .catch(notFound);
      await this.syncRating(tx, review.productId);
    });
    this.logger.log(isApproved ? 'review approved' : 'review hidden', { reviewId: id });
  }

  async remove(id: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const review = await tx.review.delete({ where: { id } }).catch(notFound);
      await this.syncRating(tx, review.productId);
    });
    this.logger.log('review deleted', { reviewId: id });
  }

  /** Keeps the product's denormalized rating in step with its approved reviews. */
  private async syncRating(tx: Prisma.TransactionClient, productId: string): Promise<void> {
    const stats = await tx.review.aggregate({
      where: { productId, isApproved: true },
      _avg: { rating: true },
      _count: { _all: true },
    });
    await tx.product.update({
      where: { id: productId },
      data: {
        ratingAverage:
          stats._avg.rating === null ? null : new Prisma.Decimal(stats._avg.rating.toFixed(1)),
        ratingCount: stats._count._all,
      },
    });
  }
}

function notFound(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
    throw new NotFoundException('Review not found');
  }
  throw error;
}

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import { ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AdminPage, AdminReview } from '@ehans/shared';
import { AdminOnly } from '../../auth/admin.guard.js';
import { IdParamDto } from './dto/category.dto.js';
import { ListReviewsQueryDto, UpdateReviewDto } from './dto/review.dto.js';
import { ReviewsAdminService } from './reviews-admin.service.js';

@ApiTags('admin: catalog')
@AdminOnly('products')
@Controller('admin/reviews')
export class ReviewsAdminController {
  constructor(private readonly reviews: ReviewsAdminService) {}

  @Get()
  @ApiOperation({ summary: 'Product reviews (pending first by default), 20 per page' })
  @ApiOkResponse({ description: 'AdminPage<AdminReview>' })
  list(@Query() query: ListReviewsQueryDto): Promise<AdminPage<AdminReview>> {
    return this.reviews.list(query.status ?? 'pending', query.page ?? 1);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  @ApiOperation({ summary: 'Approve (publish) or hide a review' })
  async update(@Param() { id }: IdParamDto, @Body() body: UpdateReviewDto): Promise<void> {
    await this.reviews.setApproved(id, body.isApproved);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  async remove(@Param() { id }: IdParamDto): Promise<void> {
    await this.reviews.remove(id);
  }
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { ReviewStatusFilter } from '@ehans/shared';
import { Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export class ListReviewsQueryDto {
  @ApiPropertyOptional({ enum: ['pending', 'approved', 'all'], default: 'pending' })
  @IsOptional()
  @IsIn(['pending', 'approved', 'all'])
  status?: ReviewStatusFilter;

  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100_000)
  page?: number;
}

export class UpdateReviewDto {
  @ApiProperty({ description: 'true = published on the product page' })
  @IsBoolean()
  isApproved: boolean;
}

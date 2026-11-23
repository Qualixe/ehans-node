import { ApiPropertyOptional } from '@nestjs/swagger';
import type { ProductStatusFilter } from '@ehans/shared';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';

export class ListAdminProductsQueryDto {
  @ApiPropertyOptional({ description: 'Name, SKU or brand' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  @ApiPropertyOptional({ description: 'Category id (includes its sub-categories)' })
  @IsOptional()
  @IsUUID()
  category?: string;

  @ApiPropertyOptional({ enum: ['active', 'draft'] })
  @IsOptional()
  @IsIn(['active', 'draft'])
  status?: ProductStatusFilter;

  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100_000)
  page?: number;
}

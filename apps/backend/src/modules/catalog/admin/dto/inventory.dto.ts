import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { StockFilter } from '@ehans/shared';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';

export class InventoryQueryDto {
  @ApiPropertyOptional({ enum: ['low', 'out'] })
  @IsOptional()
  @IsIn(['low', 'out'])
  stock?: StockFilter;

  @ApiPropertyOptional({ description: 'Product name, variant title or SKU' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100_000)
  page?: number;
}

export class StockLineParamDto {
  @ApiProperty({ enum: ['variant', 'product'] })
  @IsIn(['variant', 'product'])
  kind: 'variant' | 'product';

  @ApiProperty()
  @IsUUID()
  id: string;
}

/** glowy: mode in:set,add; quantity integer 0..1,000,000. */
export class StockAdjustmentDto {
  @ApiProperty({ enum: ['set', 'add'] })
  @IsIn(['set', 'add'])
  mode: 'set' | 'add';

  @ApiProperty({ minimum: 0, maximum: 1_000_000 })
  @IsInt()
  @Min(0)
  @Max(1_000_000)
  quantity: number;
}

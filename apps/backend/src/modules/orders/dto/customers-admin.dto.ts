import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { CustomerSort } from '@ehans/shared';
import { Transform, Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min } from 'class-validator';

export class ListCustomersQueryDto {
  @ApiPropertyOptional({ description: 'Name, phone or email' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(100)
  q?: string;

  @ApiPropertyOptional({ enum: ['recent', 'spent'], default: 'recent' })
  @IsOptional()
  @IsIn(['recent', 'spent'])
  sort?: CustomerSort;

  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100_000)
  page?: number;
}

/** glowy: ->where('phone', '[0-9+]+') */
export class CustomerPhoneDto {
  @ApiProperty({ example: '01712345678' })
  @Matches(/^\+?\d{6,20}$/)
  phone: string;
}

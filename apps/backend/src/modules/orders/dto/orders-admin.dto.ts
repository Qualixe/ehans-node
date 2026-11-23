import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  type AdminOrderUpdate,
  ORDER_CHANNELS,
  ORDER_DATE_RANGES,
  ORDER_PAGE_SIZES,
  ORDER_STATUSES,
  type OrderChannelName,
  type OrderDateRange,
  type OrderStatusName,
} from '@ehans/shared';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
/** "" from a form field means "not set" */
const blankToNull = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() || null : value;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const ORDER_NUMBER = /^[A-Z]{2}\d{6}[A-Z0-9]{5}$/;

/** glowy Order::scopeAdminFilter + per_page. Unknown values are ignored there; here they 400. */
export class ListOrdersQueryDto {
  @ApiPropertyOptional({ enum: ORDER_STATUSES })
  @IsOptional()
  @IsIn(ORDER_STATUSES)
  status?: OrderStatusName;

  @ApiPropertyOptional({ enum: ORDER_CHANNELS })
  @IsOptional()
  @IsIn(ORDER_CHANNELS)
  channel?: OrderChannelName;

  @ApiPropertyOptional({ description: 'Order number, name, phone, email or exact IP' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(100)
  q?: string;

  @ApiPropertyOptional({ enum: Object.keys(ORDER_DATE_RANGES) })
  @IsOptional()
  @IsIn(Object.keys(ORDER_DATE_RANGES))
  range?: OrderDateRange;

  @ApiPropertyOptional({ example: '2026-11-01' })
  @IsOptional()
  @Matches(DATE)
  from?: string;

  @ApiPropertyOptional({ example: '2026-11-30' })
  @IsOptional()
  @Matches(DATE)
  to?: string;

  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100_000)
  page?: number;

  @ApiPropertyOptional({ enum: ORDER_PAGE_SIZES, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsIn(ORDER_PAGE_SIZES)
  perPage?: number;
}

export class OrderNumberDto {
  @ApiProperty({ example: 'EH261123ABCDE' })
  @Matches(ORDER_NUMBER)
  number: string;
}

export class OrderStatusDto {
  @ApiProperty({ enum: ORDER_STATUSES })
  @IsIn(ORDER_STATUSES)
  status: OrderStatusName;
}

export class OrderNoteDto {
  @ApiPropertyOptional({ maxLength: 2000, description: 'Internal note; empty clears it' })
  @IsOptional()
  @Transform(blankToNull)
  @IsString()
  @MaxLength(2000)
  adminNote: string | null;
}

export class UpdateOrderDto implements AdminOrderUpdate {
  @ApiProperty({ enum: ORDER_STATUSES })
  @IsIn(ORDER_STATUSES)
  status: OrderStatusName;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @Transform(blankToNull)
  @IsString()
  @MaxLength(100)
  courier: string | null;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @Transform(blankToNull)
  @IsString()
  @MaxLength(100)
  trackingNumber: string | null;

  @ApiPropertyOptional({ maxLength: 2000 })
  @IsOptional()
  @Transform(blankToNull)
  @IsString()
  @MaxLength(2000)
  adminNote: string | null;
}

export class BulkOrderStatusDto {
  @ApiProperty({ type: [String], maxItems: 200 })
  @IsArray()
  @ArrayMinSize(1, { message: 'Select at least one order.' })
  @ArrayMaxSize(200)
  @Matches(ORDER_NUMBER, { each: true })
  numbers: string[];

  @ApiProperty({ enum: ORDER_STATUSES })
  @IsIn(ORDER_STATUSES)
  status: OrderStatusName;
}

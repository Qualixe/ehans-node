import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  BD_MOBILE,
  ORDER_SOURCES,
  ORDER_STATUSES,
  type OrderStatusName,
  PANEL_DATE_RANGES,
  type PanelDateRange,
  type PanelOrderInput,
  type PanelTab,
  POS_MAX_QUANTITY,
} from '@ehans/shared';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
const blankToNull = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() || null : value;
const phone = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.replace(/[\s\-()]/g, '').replace(/^\+?88(?=01)/, '') : value;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const ORDER_NUMBER = /^[A-Z]{2}\d{6}[A-Z0-9]{5}$/;
const TABS = ['all', 'dup', 'blocked', ...ORDER_STATUSES];
const PHONE_MESSAGE = 'Mobile number should be 11 digits and start with 01.';

export class PanelListQueryDto {
  @ApiPropertyOptional({ enum: TABS })
  @IsOptional()
  @IsIn(TABS)
  tab?: PanelTab;

  @ApiPropertyOptional({ enum: Object.keys(PANEL_DATE_RANGES) })
  @IsOptional()
  @IsIn(Object.keys(PANEL_DATE_RANGES))
  date?: PanelDateRange;

  @ApiPropertyOptional()
  @IsOptional()
  @Matches(DATE)
  from?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Matches(DATE)
  to?: string;

  @ApiPropertyOptional({ description: "Staff id or 'none'" })
  @IsOptional()
  @Matches(/^(none|[0-9a-f-]{36})$/)
  assignee?: string;

  @ApiPropertyOptional({ description: "Courier id or 'none'" })
  @IsOptional()
  @Matches(/^[a-z]{2,20}$/)
  courier?: string;

  @ApiPropertyOptional({ description: "A source, 'manual' or 'recovered'" })
  @IsOptional()
  @IsIn(['manual', 'recovered', ...ORDER_SOURCES])
  source?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(100)
  q?: string;

  @ApiPropertyOptional({ minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100_000)
  page?: number;

  @ApiPropertyOptional({ enum: [20, 50, 100] })
  @IsOptional()
  @Type(() => Number)
  @IsIn([20, 50, 100])
  perPage?: number;
}

export class PanelOrderNumberDto {
  @ApiProperty()
  @Matches(ORDER_NUMBER)
  number: string;
}

export class PanelItemDto {
  @ApiProperty()
  @IsUUID()
  productId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  variantId?: string | null;

  @ApiProperty({ minimum: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10_000_000)
  unitPrice: number;

  @ApiProperty({ minimum: 1, maximum: POS_MAX_QUANTITY })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(POS_MAX_QUANTITY)
  quantity: number;
}

/** The order panel's order form (new, edit, POS, "Make order"). */
export class PanelOrderDto implements PanelOrderInput {
  @ApiProperty({ maxLength: 100 })
  @Transform(trim)
  @Matches(/^[\s\S]{1,100}$/, { message: 'Enter the customer name.' })
  customerName: string;

  @ApiProperty({ example: '01712345678' })
  @Transform(phone)
  @Matches(BD_MOBILE, { message: PHONE_MESSAGE })
  phone: string;

  @ApiPropertyOptional()
  @Transform(({ value }: { value: unknown }) => {
    const v = phone({ value });
    return typeof v === 'string' ? v || null : v;
  })
  @IsOptional()
  @Matches(BD_MOBILE, { message: 'The alternative number should be 11 digits and start with 01.' })
  altPhone?: string | null;

  @ApiProperty({ maxLength: 500 })
  @Transform(trim)
  @Matches(/^[\s\S]{1,500}$/, { message: 'Enter the full address.' })
  address: string;

  @ApiProperty({ description: 'District key' })
  @Matches(/^[a-z_-]{1,40}$/, { message: 'Please choose the district.' })
  district: string;

  @ApiProperty({ enum: ORDER_STATUSES })
  @IsIn(ORDER_STATUSES)
  status: OrderStatusName;

  @ApiPropertyOptional()
  @Transform(blankToNull)
  @IsOptional()
  @IsUUID()
  assignedToId?: string | null;

  @ApiProperty({ enum: ORDER_SOURCES })
  @IsIn(ORDER_SOURCES)
  source: string;

  @ApiProperty()
  @IsString()
  @MaxLength(30)
  payment: string;

  @ApiProperty({ type: [PanelItemDto] })
  @IsArray()
  @ArrayMinSize(1, { message: 'Add at least one product.' })
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => PanelItemDto)
  items: PanelItemDto[];

  @ApiProperty({ minimum: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100_000)
  delivery: number;

  @ApiProperty({ minimum: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10_000_000)
  discount: number;

  @ApiProperty({ minimum: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10_000_000)
  advance: number;

  @ApiPropertyOptional({ maxLength: 2000 })
  @Transform(blankToNull)
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string | null;

  @ApiPropertyOptional()
  @Transform(blankToNull)
  @IsOptional()
  @IsUUID()
  recoveredFromId?: string | null;
}

export class PanelStatusDto {
  @ApiProperty({ enum: ORDER_STATUSES })
  @IsIn(ORDER_STATUSES)
  status: OrderStatusName;
}

export class PanelNoteDto {
  @ApiProperty({ maxLength: 2000 })
  @Transform(trim)
  @Matches(/^[\s\S]{1,2000}$/, { message: 'Write a note first.' })
  body: string;
}

export class PanelBlockDto {
  @ApiProperty()
  @IsBoolean()
  phone: boolean;

  @ApiProperty()
  @IsBoolean()
  ip: boolean;

  @ApiPropertyOptional({ maxLength: 300 })
  @Transform(blankToNull)
  @IsOptional()
  @IsString()
  @MaxLength(300)
  reason?: string | null;

  @ApiProperty({ description: 'Also cancel this order' })
  @IsBoolean()
  cancel: boolean;
}

export class PanelCancelDuplicateDto {
  @ApiProperty({ description: 'The order that is kept' })
  @Matches(ORDER_NUMBER)
  kept: string;
}

export class PanelBulkDto {
  @ApiProperty({ enum: ['status', 'assign', 'delete'] })
  @IsIn(['status', 'assign', 'delete'])
  action: 'status' | 'assign' | 'delete';

  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMinSize(1, { message: 'Select at least one order.' })
  @ArrayMaxSize(200)
  @Matches(ORDER_NUMBER, { each: true })
  numbers: string[];

  @ApiPropertyOptional({ enum: ORDER_STATUSES })
  @IsOptional()
  @IsIn(ORDER_STATUSES)
  status?: OrderStatusName;

  @ApiPropertyOptional({ description: 'Staff id; empty = unassign' })
  @Transform(blankToNull)
  @IsOptional()
  @IsUUID()
  staffId?: string | null;
}

export class PanelHintQueryDto {
  @ApiProperty()
  @Transform(phone)
  @Matches(BD_MOBILE)
  phone: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Matches(ORDER_NUMBER)
  exclude?: string;
}

export class BlockContactDto {
  @ApiProperty({ enum: ['phone', 'ip'] })
  @IsIn(['phone', 'ip'])
  kind: 'phone' | 'ip';

  @ApiProperty()
  @Transform(trim)
  @Matches(/^[0-9a-fA-F.:+]{3,45}$/, { message: 'Enter a phone number or IP address.' })
  value: string;

  @ApiPropertyOptional({ maxLength: 300 })
  @Transform(blankToNull)
  @IsOptional()
  @IsString()
  @MaxLength(300)
  reason?: string | null;
}

export class PanelPathaoDto {
  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  cityId: number;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  zoneId: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  areaId?: number | null;

  @ApiPropertyOptional({ description: 'kg, default 0.5' })
  @IsOptional()
  @Type(() => Number)
  @Min(0.1)
  @Max(30)
  weightKg?: number;
}

export class PanelCourierDto {
  @ApiProperty({ enum: ['steadfast', 'pathao'] })
  @IsIn(['steadfast', 'pathao'])
  courier: string;

  @ApiPropertyOptional({ description: 'Cash to collect (default: total minus advance)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10_000_000)
  cod?: number;

  @ApiPropertyOptional({ maxLength: 250 })
  @Transform(blankToNull)
  @IsOptional()
  @IsString()
  @MaxLength(250)
  note?: string | null;

  @ApiPropertyOptional({ type: PanelPathaoDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PanelPathaoDto)
  pathao?: PanelPathaoDto;
}

export class PanelBulkCourierDto {
  @ApiProperty({
    enum: ['steadfast'],
    description: 'Bulk booking is Steadfast only (Pathao needs a zone per parcel)',
  })
  @IsIn(['steadfast'])
  courier: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @Matches(ORDER_NUMBER, { each: true })
  numbers: string[];
}

export class PathaoIdParamDto {
  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id: number;
}

export class PathaoCityQueryDto {
  @ApiProperty()
  @Transform(trim)
  @IsString()
  @MaxLength(60)
  district: string;
}

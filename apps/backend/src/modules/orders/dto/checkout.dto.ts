import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  BD_MOBILE,
  type CheckoutItemInput,
  type CheckoutMode,
  type CheckoutQuoteRequest,
  MAX_QUANTITY_PER_ITEM,
  type PlaceOrderRequest,
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
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class CheckoutItemDto implements CheckoutItemInput {
  @ApiProperty()
  @IsUUID()
  productId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  variantId?: string | null;

  @ApiProperty({ minimum: 1, maximum: MAX_QUANTITY_PER_ITEM })
  @IsInt()
  @Min(1)
  // lines of one product are merged before the per-item limit is checked
  @Max(MAX_QUANTITY_PER_ITEM, {
    message: `You can order at most ${MAX_QUANTITY_PER_ITEM} of one item at a time.`,
  })
  quantity: number;
}

export class CheckoutQuoteDto implements CheckoutQuoteRequest {
  @ApiProperty({ type: [CheckoutItemDto] })
  @IsArray()
  @ArrayMinSize(1, { message: 'Your bag is empty.' })
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => CheckoutItemDto)
  items: CheckoutItemDto[];

  @ApiPropertyOptional({ description: 'District key (sets the delivery charge)' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  district?: string | null;
}

/** glowy QuickCheckoutRequest / StoreCheckoutRequest (cash on delivery). */
export class PlaceOrderDto implements PlaceOrderRequest {
  @ApiProperty({ enum: ['buy_now', 'cart'] })
  @IsIn(['buy_now', 'cart'])
  mode: CheckoutMode;

  @ApiProperty({ type: [CheckoutItemDto] })
  @IsArray()
  @ArrayMinSize(1, { message: 'Your bag is empty.' })
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => CheckoutItemDto)
  items: CheckoutItemDto[];

  @ApiProperty({ maxLength: 100 })
  @Transform(trim)
  @IsString()
  @MinLength(1, { message: 'Please enter your name.' })
  @MaxLength(100)
  customerName: string;

  @ApiProperty({ example: '01712345678' })
  // stored as 01XXXXXXXXX whatever the shopper typed (+88 / spaces / dashes)
  @Transform(({ value }) =>
    typeof value === 'string' ? value.replace(/[\s-]/g, '').replace(/^\+?88(?=01)/, '') : value,
  )
  @IsString()
  @Matches(BD_MOBILE, { message: 'Please enter a valid Bangladeshi mobile number (01XXXXXXXXX).' })
  phone: string;

  @ApiProperty({ maxLength: 500 })
  @Transform(trim)
  @IsString()
  @MinLength(1, { message: 'Please enter your delivery address.' })
  @MaxLength(500)
  address: string;

  @ApiProperty({ description: 'District key' })
  @IsString()
  @MinLength(1, { message: 'Please choose your district.' })
  @MaxLength(40)
  district: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(500)
  note?: string | null;
}

export class OrderNumberParamDto {
  @ApiProperty({ example: 'EH261123ABCDE' })
  @IsString()
  @Matches(/^EH\d{6}[A-Z0-9]{5}$/)
  number: string;
}

export class OrderTokenQueryDto {
  @ApiProperty({ description: "The confirmation link's secret" })
  @IsString()
  @MaxLength(64)
  t: string;
}

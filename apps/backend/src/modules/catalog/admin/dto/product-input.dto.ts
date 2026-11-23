import { ApiProperty } from '@nestjs/swagger';
import type { AdminProductInput, AdminProductOption, AdminVariantInput } from '@ehans/shared';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

const MONEY_MAX = 10_000_000;

export class ProductOptionDto implements AdminProductOption {
  @IsString()
  @MinLength(1, { message: 'Each option needs a name.' })
  @MaxLength(60)
  name: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'Each option needs at least one value.' })
  @ArrayMaxSize(50)
  @IsString({ each: true })
  @MinLength(1, { each: true, message: 'Option values cannot be empty.' })
  @MaxLength(100, { each: true })
  values: string[];
}

export class ProductVariantDto implements AdminVariantInput {
  @IsOptional()
  @IsUUID()
  id?: string | null;

  @IsArray()
  @ArrayMaxSize(3)
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  options: string[];

  @IsInt({ message: 'Every variant needs a price.' })
  @Min(0)
  @Max(MONEY_MAX)
  price: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(MONEY_MAX)
  compareAtPrice: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(MONEY_MAX)
  costPerItem: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  sku: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  barcode: string | null;

  @IsInt({ message: 'Every variant needs a stock quantity.' })
  @Min(0)
  @Max(1_000_000)
  stock: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1_000_000)
  weightGrams: number | null;

  @IsOptional()
  @IsUUID()
  imageId: string | null;
}

/** glowy ProductRequest (beauty-shop fields left out). */
export class ProductInputDto implements AdminProductInput {
  @IsString()
  @MinLength(1, { message: 'The title field is required.' })
  @MaxLength(200)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(220)
  slug: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  sku: string | null;

  @IsUUID('all', { message: 'Choose a category.' })
  categoryId: string;

  @IsArray()
  @ArrayMaxSize(50)
  @IsUUID('all', { each: true })
  collectionIds: string[];

  @IsOptional()
  @IsString()
  @MaxLength(100)
  brand: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  productType: string | null;

  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  @MaxLength(40, { each: true })
  tags: string[];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  shortDescription: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(30_000)
  description: string | null;

  @IsBoolean()
  isActive: boolean;

  @IsBoolean()
  isFeatured: boolean;

  @ApiProperty({ description: 'Show the Bundle & Save tiers on the product page' })
  @IsBoolean()
  bundlesEnabled: boolean;

  @ApiProperty({ description: 'Show the variant dropdown on the product page' })
  @IsBoolean()
  variantPickerEnabled: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  metaTitle: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(320)
  metaDescription: string | null;

  @IsArray()
  @ArrayMaxSize(50)
  @IsUUID('all', { each: true })
  imageOrder: string[];

  @IsArray()
  @ArrayMaxSize(50)
  @IsUUID('all', { each: true })
  removeImages: string[];

  @IsArray()
  @ArrayMaxSize(3, { message: 'A product can have at most 3 options.' })
  @ValidateNested({ each: true })
  @Type(() => ProductOptionDto)
  options: ProductOptionDto[];

  @IsArray()
  @ArrayMinSize(1, { message: 'Add at least one variant.' })
  @ArrayMaxSize(100, { message: 'A product can have at most 100 variants.' })
  @ValidateNested({ each: true })
  @Type(() => ProductVariantDto)
  variants: ProductVariantDto[];

  @IsArray()
  @ArrayMaxSize(6, { message: 'Pick at most 6 “Buy it with” products.' })
  @IsUUID('all', { each: true })
  buyWithIds: string[];

  @IsArray()
  @ArrayMaxSize(6, { message: 'Pick at most 6 “Complete your …” products.' })
  @IsUUID('all', { each: true })
  upsellIds: string[];

  @IsOptional()
  @IsString()
  @MaxLength(120)
  buyWithTitle: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  upsellTitle: string | null;
}

/** Multipart body: the form as JSON in `data`, plus up to 20 `images` files. */
export class ProductFormBodyDto {
  @ApiProperty({ description: 'AdminProductInput as JSON' })
  @IsString()
  @MaxLength(200_000)
  data: string;
}

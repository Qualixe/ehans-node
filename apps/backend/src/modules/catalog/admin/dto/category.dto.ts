import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

// multipart fields arrive as strings: "" means "not set"
const blankToUndefined = ({ value }: { value: unknown }) =>
  typeof value === 'string' && value.trim() === '' ? undefined : value;
const toInt = ({ value }: { value: unknown }) =>
  value === undefined || value === null || value === '' ? undefined : Number(value);
const toBool = ({ value }: { value: unknown }) =>
  value === true || value === 'true' || value === '1';

/** glowy CategoryRequest (multipart: fields + optional `image` file). */
export class CategoryInputDto {
  @ApiProperty({ maxLength: 120 })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(1, { message: 'The name field is required.' })
  @MaxLength(120, { message: 'The name field must not be greater than 120 characters.' })
  name: string;

  @ApiPropertyOptional({ description: 'Defaults to a slug of the name' })
  @IsOptional()
  @Transform(blankToUndefined)
  @IsString()
  @MaxLength(140)
  slug?: string;

  @ApiPropertyOptional({ description: 'Top-level category id (none = a department)' })
  @IsOptional()
  @Transform(blankToUndefined)
  @IsUUID('all', { message: 'Choose a top-level category as the parent.' })
  parentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(blankToUndefined)
  @IsString()
  @MaxLength(120)
  homeTitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(blankToUndefined)
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ minimum: 0, maximum: 1000 })
  @IsOptional()
  @Transform(toInt)
  @IsInt()
  @Min(0)
  @Max(1000)
  position?: number;

  @ApiPropertyOptional({
    minimum: 1,
    maximum: 1000,
    description: 'Home tile order (empty = hidden)',
  })
  @IsOptional()
  @Transform(toInt)
  @IsInt()
  @Min(1)
  @Max(1000)
  homePosition?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(toBool)
  @IsBoolean()
  showInMenu?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(blankToUndefined)
  @IsString()
  @MaxLength(255)
  metaTitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(blankToUndefined)
  @IsString()
  @MaxLength(320)
  metaDescription?: string;
}

export class IdParamDto {
  @ApiProperty()
  @IsUUID()
  id: string;
}

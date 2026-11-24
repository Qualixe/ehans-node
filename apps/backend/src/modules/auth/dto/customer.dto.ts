import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  BD_MOBILE,
  CUSTOMER_PASSWORD_MIN,
  type CustomerLoginRequest,
  type CustomerPasswordUpdate,
  type CustomerProfileUpdate,
  type CustomerRegisterRequest,
} from '@ehans/shared';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

const phone = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.replace(/[\s\-()]/g, '') : value;
const blankToNull = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() || null : value;
const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
const PHONE_MESSAGE = 'Please enter a valid mobile number (01XXXXXXXXX).';
const PASSWORD_MESSAGE = `Password must be at least ${CUSTOMER_PASSWORD_MIN} characters.`;

export class CustomerLoginDto implements CustomerLoginRequest {
  @ApiProperty({ example: '01712345678' })
  @Transform(phone)
  @IsString({ message: PHONE_MESSAGE })
  @Matches(BD_MOBILE, { message: PHONE_MESSAGE })
  phone: string;

  @ApiProperty()
  @IsString({ message: 'Please enter your password.' })
  @MinLength(1, { message: 'Please enter your password.' })
  @MaxLength(200)
  password: string;

  @ApiPropertyOptional({ description: 'Keep me signed in (30 days)' })
  @IsOptional()
  @IsBoolean()
  remember?: boolean;
}

export class CustomerRegisterDto implements CustomerRegisterRequest {
  @ApiProperty({ maxLength: 100 })
  @Transform(trim)
  @IsString({ message: 'Please enter your name.' })
  @MinLength(1, { message: 'Please enter your name.' })
  @MaxLength(100, { message: 'Your name is too long.' })
  name: string;

  @ApiProperty({ example: '01712345678' })
  @Transform(phone)
  @IsString({ message: PHONE_MESSAGE })
  @Matches(BD_MOBILE, { message: PHONE_MESSAGE })
  phone: string;

  @ApiPropertyOptional()
  @Transform(blankToNull)
  @IsOptional()
  @IsEmail({}, { message: 'Please enter a valid email address.' })
  @MaxLength(120)
  email?: string | null;

  @ApiProperty({ minLength: CUSTOMER_PASSWORD_MIN })
  @IsString({ message: PASSWORD_MESSAGE })
  @MinLength(CUSTOMER_PASSWORD_MIN, { message: PASSWORD_MESSAGE })
  @MaxLength(200)
  password: string;
}

export class CustomerProfileDto implements CustomerProfileUpdate {
  @ApiProperty({ maxLength: 100 })
  @Transform(trim)
  @IsString({ message: 'Please enter your name.' })
  @MinLength(1, { message: 'Please enter your name.' })
  @MaxLength(100, { message: 'Your name is too long.' })
  name: string;

  @ApiProperty({ example: '01712345678' })
  @Transform(phone)
  @IsString({ message: PHONE_MESSAGE })
  @Matches(BD_MOBILE, { message: PHONE_MESSAGE })
  phone: string;

  @ApiPropertyOptional()
  @Transform(blankToNull)
  @IsOptional()
  @IsEmail({}, { message: 'Please enter a valid email address.' })
  @MaxLength(120)
  email?: string | null;

  @ApiPropertyOptional({ maxLength: 500 })
  @Transform(blankToNull)
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'The address is too long.' })
  address?: string | null;

  @ApiPropertyOptional({ description: 'District key' })
  @Transform(blankToNull)
  @IsOptional()
  @IsString()
  @MaxLength(40)
  district?: string | null;
}

export class CustomerPasswordDto implements CustomerPasswordUpdate {
  @ApiProperty()
  @IsString({ message: 'Please enter your current password.' })
  @MinLength(1, { message: 'Please enter your current password.' })
  @MaxLength(200)
  currentPassword: string;

  @ApiProperty({ minLength: CUSTOMER_PASSWORD_MIN })
  @IsString({ message: PASSWORD_MESSAGE })
  @MinLength(CUSTOMER_PASSWORD_MIN, { message: PASSWORD_MESSAGE })
  @MaxLength(200)
  password: string;
}

/** Staff set a customer's password (admin customer page). */
export class StaffSetPasswordDto {
  @ApiProperty({ minLength: CUSTOMER_PASSWORD_MIN })
  @IsString({ message: PASSWORD_MESSAGE })
  @MinLength(CUSTOMER_PASSWORD_MIN, { message: PASSWORD_MESSAGE })
  @MaxLength(200)
  password: string;
}

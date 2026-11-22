import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'owner@example.com' })
  @IsEmail({}, { message: 'Enter a valid email address.' })
  @MaxLength(254)
  email: string;

  @ApiProperty()
  @IsString()
  @MinLength(1, { message: 'Enter your password.' })
  @MaxLength(200)
  password: string;

  @ApiPropertyOptional({ description: 'Keep me signed in (30 days instead of 12 hours)' })
  @IsOptional()
  @IsBoolean()
  remember?: boolean;
}

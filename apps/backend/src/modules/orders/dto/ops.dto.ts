import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { SecuritySettings } from '@ehans/shared';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class SettleDto {
  @ApiProperty({ example: 'steadfast' })
  @IsIn(['steadfast', 'pathao', 'redx', 'paperfly'])
  courier: string;
}

export class FraudLookupQueryDto {
  @ApiProperty({ example: '01712345678' })
  @IsString()
  @MaxLength(20)
  phone: string;

  @ApiPropertyOptional({
    description: 'true = run the BD Courier check (else only the saved result)',
  })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true' || value === '1')
  @IsBoolean()
  run?: boolean;

  @ApiPropertyOptional({
    description: 'true = ask BD Courier again even if a recent result is saved',
  })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true' || value === '1')
  @IsBoolean()
  fresh?: boolean;
}

export class SecuritySettingsDto implements SecuritySettings {
  @ApiProperty({ minimum: 0, maximum: 100, description: '0 = off' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  autoHoldBelow: number;

  @ApiProperty({ minimum: 0, maximum: 50, description: '0 = no limit' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(50)
  maxPerDay: number;

  @ApiProperty({ minimum: 1, maximum: 720 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(720)
  dupWindowHours: number;

  @ApiProperty()
  @IsBoolean()
  autoCheck: boolean;
}

import { ApiPropertyOptional } from '@nestjs/swagger';
import { DASHBOARD_RANGES, type DashboardRange } from '@ehans/shared';
import { IsIn, IsOptional } from 'class-validator';

export class DashboardQueryDto {
  @ApiPropertyOptional({ enum: Object.keys(DASHBOARD_RANGES), default: '1y' })
  @IsOptional()
  @IsIn(Object.keys(DASHBOARD_RANGES))
  range?: DashboardRange;
}

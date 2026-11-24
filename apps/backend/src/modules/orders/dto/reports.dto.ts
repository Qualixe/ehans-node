import { ApiPropertyOptional } from '@nestjs/swagger';
import { REPORT_PERIODS, REPORT_TABS, type ReportPeriod, type ReportTab } from '@ehans/shared';
import { Type } from 'class-transformer';
import { IsIn, IsOptional } from 'class-validator';

export class ReportQueryDto {
  @ApiPropertyOptional({ enum: Object.keys(REPORT_TABS), default: 'daily' })
  @IsOptional()
  @IsIn(Object.keys(REPORT_TABS))
  tab?: ReportTab;

  @ApiPropertyOptional({ enum: REPORT_PERIODS, default: 30, description: 'Days back from today' })
  @IsOptional()
  @Type(() => Number)
  @IsIn(REPORT_PERIODS)
  days?: ReportPeriod;
}

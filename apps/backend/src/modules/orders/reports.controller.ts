import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { DashboardOverview, ReportPage } from '@ehans/shared';
import { AdminOnly } from '../auth/admin.guard.js';
import { ReportQueryDto } from './dto/reports.dto.js';
import { ReportsService } from './reports.service.js';

@ApiTags('admin: reports')
@Controller('admin/reports')
@AdminOnly('analytics')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get('dashboard')
  @ApiOperation({
    summary: 'Dashboard: KPIs, money, 7-day chart, alerts, status mix, teams, best sellers',
  })
  @ApiOkResponse({ description: 'DashboardOverview' })
  dashboard(): Promise<DashboardOverview> {
    return this.reports.dashboard();
  }

  @Get()
  @ApiOperation({
    summary: 'One report table (daily P&L, products, districts, sources, couriers, teams, status)',
  })
  @ApiOkResponse({ description: 'ReportPage' })
  report(@Query() q: ReportQueryDto): Promise<ReportPage> {
    return this.reports.report(q.tab ?? 'daily', q.days ?? 30);
  }
}

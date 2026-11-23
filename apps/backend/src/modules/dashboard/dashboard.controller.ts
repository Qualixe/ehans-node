import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type {
  AdminNavigation,
  AdminSearchResults,
  AdminUser,
  DashboardMetrics,
} from '@ehans/shared';
import { AdminOnly, CurrentAdmin } from '../auth/admin.guard.js';
import { DashboardService } from './dashboard.service.js';
import { DashboardQueryDto, SearchQueryDto } from './dto/dashboard.query.js';

@ApiTags('admin: dashboard')
@Controller('admin')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get('dashboard')
  @AdminOnly('analytics')
  @ApiOperation({ summary: 'Executive overview: KPIs, revenue chart, channels, top products' })
  @ApiOkResponse({ description: 'DashboardMetrics' })
  metrics(@Query() query: DashboardQueryDto): Promise<DashboardMetrics> {
    return this.dashboard.metrics(query.range ?? '1y');
  }

  @Get('search')
  @AdminOnly()
  @ApiOperation({ summary: 'Topbar search: products and orders the admin may see' })
  @ApiOkResponse({ description: 'AdminSearchResults' })
  search(
    @CurrentAdmin() admin: AdminUser,
    @Query() query: SearchQueryDto,
  ): Promise<AdminSearchResults> {
    return this.dashboard.search(admin, query.q ?? '');
  }

  @Get('navigation')
  @AdminOnly()
  @ApiOperation({ summary: 'Sidebar badge counts and the notification feed' })
  @ApiOkResponse({ description: 'AdminNavigation' })
  navigation(@CurrentAdmin() admin: AdminUser): Promise<AdminNavigation> {
    return this.dashboard.navigation(admin);
  }
}

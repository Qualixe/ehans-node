import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiPropertyOptional,
  ApiTags,
} from '@nestjs/swagger';
import {
  type AdminUser,
  type IncompletePage,
  type IncompleteRow,
  type IncompleteState,
  PANEL_DATE_RANGES,
  type PanelDateRange,
} from '@ehans/shared';
import { IsIn, IsOptional, Matches } from 'class-validator';
import { AdminOnly, CurrentAdmin } from '../auth/admin.guard.js';
import { IncompleteService } from './incomplete.service.js';

class IncompleteListQueryDto {
  @ApiPropertyOptional({ enum: ['all', 'new', 'called', 'recovered'] })
  @IsOptional()
  @IsIn(['all', 'new', 'called', 'recovered'])
  state?: IncompleteState | 'all';

  @ApiPropertyOptional({ enum: Object.keys(PANEL_DATE_RANGES) })
  @IsOptional()
  @IsIn(Object.keys(PANEL_DATE_RANGES))
  date?: PanelDateRange;

  @ApiPropertyOptional()
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  from?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  to?: string;
}

/** Order panel "Incomplete orders" (section "orders"). */
@ApiTags('admin: order panel')
@AdminOnly('orders')
@Controller('admin/incomplete')
export class IncompleteAdminController {
  constructor(private readonly incomplete: IncompleteService) {}

  @Get()
  @ApiOperation({ summary: 'Incomplete checkouts with counts and KPIs' })
  @ApiOkResponse({ description: 'IncompletePage' })
  list(@Query() { state, ...range }: IncompleteListQueryDto): Promise<IncompletePage> {
    return this.incomplete.list(state ?? 'all', range);
  }

  @Get(':id')
  @ApiOperation({ summary: 'One incomplete checkout (to make an order from it)' })
  get(@Param('id', ParseUUIDPipe) id: string): Promise<IncompleteRow> {
    return this.incomplete.get(id);
  }

  @Post(':id/called')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  async called(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentAdmin() admin: AdminUser,
  ): Promise<void> {
    await this.incomplete.markCalled(id, admin);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentAdmin() admin: AdminUser,
  ): Promise<void> {
    await this.incomplete.remove(id, admin);
  }
}

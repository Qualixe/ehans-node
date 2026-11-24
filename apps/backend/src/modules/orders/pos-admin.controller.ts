import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { PosCatalog } from '@ehans/shared';
import { AdminOnly } from '../auth/admin.guard.js';
import { PosAdminService } from './pos-admin.service.js';

/** POS product grid (section "pos"). Manual orders are created through the order panel. */
@ApiTags('admin: pos')
@AdminOnly('pos')
@Controller('admin/pos')
export class PosAdminController {
  constructor(private readonly pos: PosAdminService) {}

  @Get('catalog')
  @ApiOperation({ summary: 'Products (with sellable variants) and departments for the POS grid' })
  @ApiOkResponse({ description: 'PosCatalog' })
  catalog(): Promise<PosCatalog> {
    return this.pos.catalogue();
  }
}

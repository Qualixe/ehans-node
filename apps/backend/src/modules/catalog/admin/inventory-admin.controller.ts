import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { InventoryPage } from '@ehans/shared';
import { AdminOnly } from '../../auth/admin.guard.js';
import { InventoryQueryDto, StockAdjustmentDto, StockLineParamDto } from './dto/inventory.dto.js';
import { InventoryAdminService } from './inventory-admin.service.js';

@ApiTags('admin: catalog')
@AdminOnly('inventory')
@Controller('admin/inventory')
export class InventoryAdminController {
  constructor(private readonly inventory: InventoryAdminService) {}

  @Get()
  @ApiOperation({ summary: 'Stock lines (lowest first), 30 per page, with totals' })
  @ApiOkResponse({ description: 'InventoryPage' })
  list(@Query() query: InventoryQueryDto): Promise<InventoryPage> {
    return this.inventory.list({ stock: query.stock, q: query.q, page: query.page ?? 1 });
  }

  @Patch(':kind/:id')
  @ApiOperation({ summary: 'Add to or set the stock of a variant or a product without variants' })
  @ApiOkResponse({ description: '{ name, stock }' })
  adjust(
    @Param() { kind, id }: StockLineParamDto,
    @Body() body: StockAdjustmentDto,
  ): Promise<{ name: string; stock: number }> {
    return this.inventory.adjust(kind, id, body);
  }
}

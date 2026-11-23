import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { AdminBulkStatusResult, AdminOrderDetail, AdminOrdersPage } from '@ehans/shared';
import { AdminOnly } from '../auth/admin.guard.js';
import {
  BulkOrderStatusDto,
  ListOrdersQueryDto,
  OrderNoteDto,
  OrderNumberDto,
  OrderStatusDto,
  UpdateOrderDto,
} from './dto/orders-admin.dto.js';
import { OrdersAdminService } from './orders-admin.service.js';

/** glowy admin orders routes (section "orders": GET needs view, writes need manage). */
@ApiTags('admin: orders')
@AdminOnly('orders')
@Controller('admin/orders')
export class OrdersAdminController {
  constructor(private readonly orders: OrdersAdminService) {}

  @Get()
  @ApiOperation({ summary: 'Orders list: status / channel / search / date filters, newest first' })
  @ApiOkResponse({ description: 'AdminOrdersPage' })
  list(@Query() { page, perPage, ...filters }: ListOrdersQueryDto): Promise<AdminOrdersPage> {
    return this.orders.list(filters, page ?? 1, perPage ?? 20);
  }

  // before :number so "bulk-status" isn't taken for an order number
  @Patch('bulk-status')
  @ApiOperation({ summary: 'Change the status of several orders (unreopenable ones are skipped)' })
  @ApiOkResponse({ description: 'AdminBulkStatusResult' })
  bulkStatus(@Body() body: BulkOrderStatusDto): Promise<AdminBulkStatusResult> {
    return this.orders.bulkStatus(body.numbers, body.status);
  }

  @Get(':number')
  @ApiOperation({ summary: 'One order with items, customer and fulfilment details' })
  @ApiOkResponse({ description: 'AdminOrderDetail' })
  detail(@Param() { number }: OrderNumberDto): Promise<AdminOrderDetail> {
    return this.orders.detail(number);
  }

  @Put(':number')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  @ApiConflictResponse({ description: 'Reopening needs stock that is no longer there' })
  @ApiOperation({ summary: 'Fulfilment form: status, courier, tracking number, internal note' })
  async update(@Param() { number }: OrderNumberDto, @Body() body: UpdateOrderDto): Promise<void> {
    await this.orders.update(number, body);
  }

  @Patch(':number/status')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  @ApiConflictResponse({ description: 'Reopening needs stock that is no longer there' })
  @ApiOperation({ summary: 'Quick status change (cancel/return puts the items back in stock)' })
  async status(@Param() { number }: OrderNumberDto, @Body() body: OrderStatusDto): Promise<void> {
    await this.orders.setStatus(number, body.status);
  }

  @Patch(':number/note')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  @ApiOperation({ summary: 'Internal note (only staff see it)' })
  async note(@Param() { number }: OrderNumberDto, @Body() body: OrderNoteDto): Promise<void> {
    await this.orders.setNote(number, body.adminNote ?? null);
  }
}

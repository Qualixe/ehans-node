import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
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
import type { AdminOrderDetail, AdminUser, FraudCheckDto } from '@ehans/shared';
import { AdminOnly, CurrentAdmin } from '../auth/admin.guard.js';
import { FraudCheckQueryDto, OrderNumberDto, UpdateOrderDto } from './dto/orders-admin.dto.js';
import { OrdersAdminService } from './orders-admin.service.js';

/** The order page and fraud check (section "orders"); the list is the order panel. */
@ApiTags('admin: orders')
@AdminOnly('orders')
@Controller('admin/orders')
export class OrdersAdminController {
  constructor(private readonly orders: OrdersAdminService) {}

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
  @ApiOperation({ summary: 'Fulfilment form: status, courier, tracking number, note' })
  async update(
    @Param() { number }: OrderNumberDto,
    @Body() body: UpdateOrderDto,
    @CurrentAdmin() admin: AdminUser,
  ): Promise<void> {
    await this.orders.update(number, body, admin);
  }

  @Post(':number/fraud-check')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "BD Courier delivery history for the order's phone (cached; ?fresh=true re-checks)",
  })
  @ApiOkResponse({ description: 'FraudCheckDto' })
  fraudCheck(
    @Param() { number }: OrderNumberDto,
    @Query() { fresh }: FraudCheckQueryDto,
  ): Promise<FraudCheckDto> {
    return this.orders.fraudCheck(number, fresh ?? false);
  }
}

import { Controller, Get, Header, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type {
  AdminPage,
  CustomerOrderRow,
  CustomerProfile,
  OrderConfirmation,
} from '@ehans/shared';
import { CurrentCustomer, CustomerGuard } from '../auth/customer.guard.js';
import { AccountOrdersService } from './account-orders.service.js';
import { OrderNumberParamDto } from './dto/checkout.dto.js';
import { AccountOrdersQueryDto } from './dto/account-orders.dto.js';

/** "My orders" for the signed-in storefront customer. */
@ApiTags('account')
@ApiBearerAuth()
@UseGuards(CustomerGuard)
@Controller('account/orders')
export class AccountOrdersController {
  constructor(private readonly orders: AccountOrdersService) {}

  @Get()
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ summary: "The signed-in customer's orders, newest first" })
  @ApiOkResponse({ description: 'AdminPage<CustomerOrderRow>' })
  list(
    @CurrentCustomer() customer: CustomerProfile,
    @Query() { page }: AccountOrdersQueryDto,
  ): Promise<AdminPage<CustomerOrderRow>> {
    return this.orders.list(customer.id, page ?? 1);
  }

  @Get(':number')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ summary: "One of the signed-in customer's orders" })
  @ApiOkResponse({ description: 'OrderConfirmation' })
  detail(
    @CurrentCustomer() customer: CustomerProfile,
    @Param() { number }: OrderNumberParamDto,
  ): Promise<OrderConfirmation> {
    return this.orders.detail(customer.id, number);
  }
}

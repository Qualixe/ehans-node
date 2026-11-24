import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Put,
  Query,
} from '@nestjs/common';
import { ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AdminCustomerDetail, AdminCustomerRow, AdminPage, AdminUser } from '@ehans/shared';
import { AdminOnly, CurrentAdmin } from '../auth/admin.guard.js';
import { StaffSetPasswordDto } from '../auth/dto/customer.dto.js';
import { CustomerPhoneDto, ListCustomersQueryDto } from './dto/customers-admin.dto.js';
import { CustomersAdminService } from './customers-admin.service.js';

/** glowy admin customers (section "customers"): customers are grouped by phone number. */
@ApiTags('admin: customers')
@AdminOnly('customers')
@Controller('admin/customers')
export class CustomersAdminController {
  constructor(private readonly customers: CustomersAdminService) {}

  @Get()
  @ApiOperation({
    summary: 'Customers (one per phone number), most recent order or top spenders first',
  })
  @ApiOkResponse({ description: 'AdminPage<AdminCustomerRow>' })
  list(@Query() query: ListCustomersQueryDto): Promise<AdminPage<AdminCustomerRow>> {
    return this.customers.list(query.q, query.sort ?? 'recent', query.page ?? 1);
  }

  @Put('accounts/:userId/password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  @ApiOperation({ summary: "Set a customer account's password (they forgot it); signs them out" })
  async setPassword(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() body: StaffSetPasswordDto,
    @CurrentAdmin() admin: AdminUser,
  ): Promise<void> {
    await this.customers.setPassword(userId, body.password, admin.id);
  }

  @Get(':phone')
  @ApiOperation({ summary: 'One customer: totals, latest address and order history' })
  @ApiOkResponse({ description: 'AdminCustomerDetail' })
  detail(@Param() { phone }: CustomerPhoneDto): Promise<AdminCustomerDetail> {
    return this.customers.detail(phone);
  }
}

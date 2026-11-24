import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags, ApiTooManyRequestsResponse } from '@nestjs/swagger';
import type { CheckoutQuote, OrderConfirmation, PlacedOrder } from '@ehans/shared';
import type { Request } from 'express';
import { bearerToken } from '../auth/admin.guard.js';
import { CustomerAuthService } from '../auth/customer-auth.service.js';
import { CheckoutService } from './checkout.service.js';
import { IncompleteService } from './incomplete.service.js';
import {
  CheckoutQuoteDto,
  IncompleteCaptureDto,
  OrderNumberParamDto,
  OrderTokenQueryDto,
  PlaceOrderDto,
} from './dto/checkout.dto.js';

@ApiTags('checkout')
@Controller()
export class CheckoutController {
  constructor(
    private readonly checkout: CheckoutService,
    private readonly accounts: CustomerAuthService,
    private readonly incomplete: IncompleteService,
  ) {}

  @Post('checkout/quote')
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    summary: 'Price a buy-now item or a cart (and the delivery charge for a district)',
  })
  @ApiOkResponse({ description: 'CheckoutQuote' })
  quote(@Body() body: CheckoutQuoteDto): Promise<CheckoutQuote> {
    return this.checkout.quote(body.items, body.district);
  }

  @Post('checkout/incomplete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: "Save the shopper's half-filled order form (order panel 'Incomplete orders')",
  })
  async captureIncomplete(@Body() body: IncompleteCaptureDto, @Req() req: Request): Promise<void> {
    await this.incomplete.capture(body, req.ip);
  }

  @Post('orders')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ summary: 'Place a cash-on-delivery order (buy now or cart)' })
  @ApiOkResponse({ description: 'PlacedOrder: { number, token } for the confirmation link' })
  @ApiTooManyRequestsResponse({ description: 'More than 10 orders a minute from one network' })
  async place(@Body() body: PlaceOrderDto, @Req() req: Request): Promise<PlacedOrder> {
    // optional: a signed-in customer's order shows up under "My orders"
    const customer = await this.accounts.authenticate(bearerToken(req));
    return this.checkout.place(body, req.ip, customer?.id ?? null);
  }

  @Get('orders/:number')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ summary: "The customer's order confirmation (needs the link's token)" })
  @ApiOkResponse({ description: 'OrderConfirmation' })
  confirmation(
    @Param() { number }: OrderNumberParamDto,
    @Query() { t }: OrderTokenQueryDto,
  ): Promise<OrderConfirmation> {
    return this.checkout.confirmation(number, t);
  }
}

import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { CustomerProfile, CustomerSession } from '@ehans/shared';
import type { Request } from 'express';
import { bearerToken } from './admin.guard.js';
import { CustomerAuthService } from './customer-auth.service.js';
import { CurrentCustomer, CustomerGuard, type CustomerRequest } from './customer.guard.js';
import {
  CustomerLoginDto,
  CustomerPasswordDto,
  CustomerProfileDto,
  CustomerRegisterDto,
} from './dto/customer.dto.js';

const meta = (req: Request) => ({ ipAddress: req.ip, userAgent: req.headers['user-agent'] });

/** Storefront customer accounts (glowy /account routes). */
@ApiTags('account')
@Controller('account')
export class AccountController {
  constructor(private readonly accounts: CustomerAuthService) {}

  @Post('register')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ summary: 'Create a customer account (mobile number + password); signs in' })
  @ApiOkResponse({ description: 'CustomerSession' })
  @ApiTooManyRequestsResponse({ description: 'More than 5 sign-ups a minute from one network' })
  register(@Body() body: CustomerRegisterDto, @Req() req: Request): Promise<CustomerSession> {
    return this.accounts.register(body, meta(req));
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ summary: 'Customer sign-in with mobile number + password' })
  @ApiOkResponse({ description: 'CustomerSession' })
  @ApiUnauthorizedResponse({ description: 'Wrong mobile number or password' })
  @ApiTooManyRequestsResponse({ description: 'Too many attempts for this number' })
  login(@Body() body: CustomerLoginDto, @Req() req: Request): Promise<CustomerSession> {
    return this.accounts.login(body, meta(req));
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Sign out (revokes this session)' })
  @ApiNoContentResponse()
  async logout(@Req() req: Request): Promise<void> {
    await this.accounts.logout(bearerToken(req));
  }

  @Get('me')
  @UseGuards(CustomerGuard)
  @ApiBearerAuth()
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ summary: 'The signed-in customer' })
  @ApiOkResponse({ description: 'CustomerProfile' })
  me(@CurrentCustomer() customer: CustomerProfile): CustomerProfile {
    return customer;
  }

  @Put('profile')
  @UseGuards(CustomerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update name, mobile, email and default delivery address' })
  @ApiOkResponse({ description: 'CustomerProfile' })
  profile(
    @CurrentCustomer() customer: CustomerProfile,
    @Body() body: CustomerProfileDto,
  ): Promise<CustomerProfile> {
    return this.accounts.updateProfile(customer.id, body);
  }

  @Put('password')
  @UseGuards(CustomerGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Change password (needs the current one; signs out other devices)' })
  @ApiNoContentResponse()
  async password(
    @CurrentCustomer() customer: CustomerProfile,
    @Body() body: CustomerPasswordDto,
    @Req() req: CustomerRequest,
  ): Promise<void> {
    await this.accounts.changePassword(customer.id, body, req.customerToken);
  }
}

import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import {
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { AdminLoginResponse, AdminUser } from '@ehans/shared';
import type { Request } from 'express';
import { AdminOnly, type AdminRequest, CurrentAdmin } from './admin.guard.js';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';

@ApiTags('admin: auth')
@Controller('admin/auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin sign-in; returns an opaque session token' })
  @ApiOkResponse({ description: 'AdminLoginResponse' })
  @ApiUnauthorizedResponse({ description: 'Wrong email or password' })
  @ApiTooManyRequestsResponse({ description: 'Too many attempts for this email' })
  login(@Body() body: LoginDto, @Req() req: Request): Promise<AdminLoginResponse> {
    return this.auth.login({
      email: body.email,
      password: body.password,
      remember: body.remember,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  @Get('me')
  @AdminOnly()
  @ApiOperation({ summary: 'The signed-in admin' })
  @ApiOkResponse({ description: 'AdminUser' })
  me(@CurrentAdmin() admin: AdminUser): AdminUser {
    return admin;
  }

  @Post('logout')
  @AdminOnly()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke the current session' })
  @ApiNoContentResponse()
  async logout(@Req() req: AdminRequest): Promise<void> {
    await this.auth.logout(req.adminToken ?? '');
  }
}

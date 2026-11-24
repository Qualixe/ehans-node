import { Module } from '@nestjs/common';
import { AccountController } from './account.controller.js';
import { AdminGuard } from './admin.guard.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { CustomerAuthService } from './customer-auth.service.js';
import { CustomerGuard } from './customer.guard.js';

/**
 * Users and sessions: staff (admin sign-in, @AdminOnly()) and storefront customer accounts
 * (/account, CustomerGuard). Other modules use the exported services and guards.
 */
@Module({
  controllers: [AuthController, AccountController],
  providers: [AuthService, AdminGuard, CustomerAuthService, CustomerGuard],
  exports: [AuthService, AdminGuard, CustomerAuthService, CustomerGuard],
})
export class AuthModule {}

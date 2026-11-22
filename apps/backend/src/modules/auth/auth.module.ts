import { Module } from '@nestjs/common';
import { AdminGuard } from './admin.guard.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';

/** Admin users and sessions. Other modules protect their admin routes with @AdminOnly(). */
@Module({
  controllers: [AuthController],
  providers: [AuthService, AdminGuard],
  exports: [AuthService, AdminGuard],
})
export class AuthModule {}

import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { CatalogModule } from '../catalog/catalog.module.js';
import { OrdersModule } from '../orders/orders.module.js';
import { DashboardController } from './dashboard.controller.js';
import { DashboardService } from './dashboard.service.js';

@Module({
  imports: [AuthModule, OrdersModule, CatalogModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}

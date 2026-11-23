import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { CatalogModule } from '../catalog/catalog.module.js';
import { FraudModule } from '../fraud/fraud.module.js';
import { CheckoutController } from './checkout.controller.js';
import { CheckoutService } from './checkout.service.js';
import { OrderStatsService } from './order-stats.service.js';
import { OrdersAdminController } from './orders-admin.controller.js';
import { OrdersAdminService } from './orders-admin.service.js';

/**
 * Orders (glowy's order model): storefront checkout (buy now + cart, cash on delivery), the admin
 * order screens (list, detail, status with stock moves, notes, bulk) and the dashboard figures.
 * POS and couriers come next.
 */
@Module({
  imports: [AuthModule, CatalogModule, FraudModule],
  controllers: [CheckoutController, OrdersAdminController],
  providers: [OrderStatsService, CheckoutService, OrdersAdminService],
  exports: [OrderStatsService],
})
export class OrdersModule {}

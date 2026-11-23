import { Module } from '@nestjs/common';
import { CatalogModule } from '../catalog/catalog.module.js';
import { CheckoutController } from './checkout.controller.js';
import { CheckoutService } from './checkout.service.js';
import { OrderStatsService } from './order-stats.service.js';

/**
 * Orders (glowy's order model): storefront checkout (buy now + cart, cash on delivery) and the
 * dashboard figures. Admin order screens, POS and couriers come next.
 */
@Module({
  imports: [CatalogModule],
  controllers: [CheckoutController],
  providers: [OrderStatsService, CheckoutService],
  exports: [OrderStatsService],
})
export class OrdersModule {}

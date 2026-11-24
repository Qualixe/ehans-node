import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { CatalogModule } from '../catalog/catalog.module.js';
import { CouriersModule } from '../couriers/couriers.module.js';
import { FraudModule } from '../fraud/fraud.module.js';
import { SettingsModule } from '../settings/settings.module.js';
import { AccountOrdersController } from './account-orders.controller.js';
import { AccountOrdersService } from './account-orders.service.js';
import { CheckoutController } from './checkout.controller.js';
import { CheckoutService } from './checkout.service.js';
import { CustomersAdminController } from './customers-admin.controller.js';
import { CustomersAdminService } from './customers-admin.service.js';
import { OrderStatsService } from './order-stats.service.js';
import { IncompleteAdminController } from './incomplete-admin.controller.js';
import { IncompleteService } from './incomplete.service.js';
import { OpsController } from './ops.controller.js';
import { OpsService } from './ops.service.js';
import { OrderCourierService } from './order-courier.service.js';
import { OrderPanelController } from './order-panel.controller.js';
import { OrderPanelService } from './order-panel.service.js';
import { OrdersAdminController } from './orders-admin.controller.js';
import { OrdersAdminService } from './orders-admin.service.js';
import { PosAdminController } from './pos-admin.controller.js';
import { PosAdminService } from './pos-admin.service.js';
import { ReportsController } from './reports.controller.js';
import { ReportsService } from './reports.service.js';

/**
 * Orders (glowy's order model): storefront checkout (buy now + cart, cash on delivery), the admin
 * order screens (list, detail, status with stock moves, notes, bulk), customers (grouped by phone) and the dashboard figures.
 * POS (in-store and phone sales). Couriers come next.
 */
@Module({
  imports: [AuthModule, CatalogModule, FraudModule, CouriersModule, SettingsModule],
  controllers: [
    CheckoutController,
    AccountOrdersController,
    OrdersAdminController,
    OrderPanelController,
    IncompleteAdminController,
    OpsController,
    CustomersAdminController,
    PosAdminController,
    ReportsController,
  ],
  providers: [
    OrderStatsService,
    CheckoutService,
    OrdersAdminService,
    OrderPanelService,
    OrderCourierService,
    IncompleteService,
    OpsService,
    CustomersAdminService,
    PosAdminService,
    AccountOrdersService,
    ReportsService,
  ],
  exports: [OrderStatsService],
})
export class OrdersModule {}

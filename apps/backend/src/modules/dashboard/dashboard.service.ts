import { Injectable } from '@nestjs/common';
import {
  type AdminNavigation,
  type AdminUser,
  type DashboardMetrics,
  type DashboardRange,
  canView,
} from '@ehans/shared';
import { STORE_SETTINGS } from '../../config/store-settings.js';
import { CatalogStatsService } from '../catalog/catalog-stats.service.js';
import { OrderStatsService } from '../orders/order-stats.service.js';

/** Admin overview (glowy DashboardController + DashboardMetrics) and navigation badges. */
@Injectable()
export class DashboardService {
  constructor(
    private readonly orders: OrderStatsService,
    private readonly catalog: CatalogStatsService,
  ) {}

  async metrics(range: DashboardRange): Promise<DashboardMetrics> {
    const [orders, lowStock] = await Promise.all([
      this.orders.dashboard(range),
      this.catalog.lowStock(),
    ]);
    return {
      ...orders,
      storeStatus: STORE_SETTINGS.status,
      aov: { ...orders.aov, target: STORE_SETTINGS.aovTarget },
      lowStock,
    };
  }

  /** Only counts what this admin may see, so badges never leak data from other sections. */
  async navigation(admin: AdminUser): Promise<AdminNavigation> {
    const orders = canView(admin, 'orders');
    const products = canView(admin, 'products');
    const [pendingOrders, lowStock, pendingReviews, notifications] = await Promise.all([
      orders ? this.orders.pendingCount() : 0,
      products || canView(admin, 'inventory') ? this.catalog.lowStockCount() : 0,
      products ? this.catalog.pendingReviewCount() : 0,
      orders ? this.orders.pendingNotifications() : [],
    ]);
    return {
      // comments and contact messages arrive with the Content module
      counts: { pendingOrders, lowStock, pendingReviews, pendingComments: 0, unreadMessages: 0 },
      notifications,
    };
  }
}

import { Injectable } from '@nestjs/common';
import {
  type AdminNavigation,
  type AdminSearchResults,
  type AdminUser,
  type DashboardMetrics,
  type DashboardRange,
  canView,
} from '@ehans/shared';
import { STORE_SETTINGS } from '../../config/store-settings.js';
import { ProductsAdminService } from '../catalog/admin/products-admin.service.js';
import { CatalogStatsService } from '../catalog/catalog-stats.service.js';
import { OrderStatsService } from '../orders/order-stats.service.js';

/** Admin overview (glowy DashboardController + DashboardMetrics) and navigation badges. */
@Injectable()
export class DashboardService {
  constructor(
    private readonly orders: OrderStatsService,
    private readonly catalog: CatalogStatsService,
    private readonly products: ProductsAdminService,
  ) {}

  /** glowy SearchController: products and orders, each only when the admin may open it. */
  async search(admin: AdminUser, raw: string): Promise<AdminSearchResults> {
    const term = raw.trim().slice(0, 100);
    if (!term) return { term, products: [], orders: [] };
    const [products, orders] = await Promise.all([
      canView(admin, 'products') ? this.products.search(term) : [],
      canView(admin, 'orders') ? this.orders.search(term) : [],
    ]);
    return { term, products, orders };
  }

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

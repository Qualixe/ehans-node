import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { UploadsModule } from '../uploads/uploads.module.js';
import { CategoriesAdminController } from './admin/categories-admin.controller.js';
import { CategoriesAdminService } from './admin/categories-admin.service.js';
import { InventoryAdminController } from './admin/inventory-admin.controller.js';
import { InventoryAdminService } from './admin/inventory-admin.service.js';
import { ProductFormService } from './admin/product-form.service.js';
import { ProductsAdminController } from './admin/products-admin.controller.js';
import { ProductsAdminService } from './admin/products-admin.service.js';
import { ReviewsAdminController } from './admin/reviews-admin.controller.js';
import { ReviewsAdminService } from './admin/reviews-admin.service.js';
import { CatalogController } from './catalog.controller.js';
import { CatalogCheckoutService } from './catalog-checkout.service.js';
import { CatalogService } from './catalog.service.js';
import { CatalogStatsService } from './catalog-stats.service.js';

/**
 * The catalog: storefront reads (categories, product lists, product detail, search),
 * the admin catalog screens (products, categories, reviews, inventory) and dashboard figures.
 */
@Module({
  imports: [AuthModule, UploadsModule],
  controllers: [
    CatalogController,
    CategoriesAdminController,
    ReviewsAdminController,
    InventoryAdminController,
    ProductsAdminController,
  ],
  providers: [
    CatalogService,
    CatalogStatsService,
    CategoriesAdminService,
    ReviewsAdminService,
    InventoryAdminService,
    ProductsAdminService,
    ProductFormService,
    CatalogCheckoutService,
  ],
  exports: [CatalogService, CatalogStatsService, ProductsAdminService, CatalogCheckoutService],
})
export class CatalogModule {}

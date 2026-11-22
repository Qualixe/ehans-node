import { Module } from '@nestjs/common';
import { CatalogController } from './catalog.controller.js';
import { CatalogService } from './catalog.service.js';
import { CatalogStatsService } from './catalog-stats.service.js';

/** Storefront catalog (categories, product lists, product detail, search) and catalog figures for the admin. */
@Module({
  controllers: [CatalogController],
  providers: [CatalogService, CatalogStatsService],
  exports: [CatalogService, CatalogStatsService],
})
export class CatalogModule {}

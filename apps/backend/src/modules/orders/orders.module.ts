import { Module } from '@nestjs/common';
import { OrderStatsService } from './order-stats.service.js';

/**
 * Orders (glowy's order model). This slice only reads them for the admin dashboard;
 * checkout, POS and the admin order screens come in the next slice.
 */
@Module({
  providers: [OrderStatsService],
  exports: [OrderStatsService],
})
export class OrdersModule {}

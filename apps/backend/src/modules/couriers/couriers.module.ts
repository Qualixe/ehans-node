import { Module } from '@nestjs/common';
import { CourierService } from './courier.service.js';

/** Courier merchant APIs (Steadfast, Pathao). Used by the orders module to book parcels. */
@Module({
  providers: [CourierService],
  exports: [CourierService],
})
export class CouriersModule {}

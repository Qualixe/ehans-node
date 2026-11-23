import { Module } from '@nestjs/common';
import { FraudService } from './fraud.service.js';

/** BD Courier fraud check (customer delivery history per phone), used by the admin orders. */
@Module({
  providers: [FraudService],
  exports: [FraudService],
})
export class FraudModule {}

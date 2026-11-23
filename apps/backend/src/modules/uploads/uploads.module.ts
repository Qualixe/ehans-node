import { Module } from '@nestjs/common';
import { UploadsService } from './uploads.service.js';

/** Stores admin image uploads; files are served at /api/v1/uploads/* (see configure-app.ts). */
@Module({
  providers: [UploadsService],
  exports: [UploadsService],
})
export class UploadsModule {}

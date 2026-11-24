import { Module } from '@nestjs/common';
import { SettingsService } from './settings.service.js';

/** Store-wide admin settings (security rules today; store details and more later). */
@Module({
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}

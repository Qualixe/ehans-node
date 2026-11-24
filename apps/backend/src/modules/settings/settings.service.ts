import { Injectable } from '@nestjs/common';
import { DEFAULT_SECURITY, type SecuritySettings } from '@ehans/shared';
import type { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';

const CACHE_MS = 30_000;

/** Store-wide settings saved from the admin (app_settings, one JSON value per key). */
@Injectable()
export class SettingsService {
  private cache = new Map<string, { value: unknown; at: number }>();

  constructor(private readonly prisma: PrismaService) {}

  async get<T extends object>(key: string, defaults: T): Promise<T> {
    const hit = this.cache.get(key);
    if (hit && Date.now() - hit.at < CACHE_MS) return hit.value as T;
    const row = await this.prisma.appSetting.findUnique({ where: { key } });
    const value = {
      ...defaults,
      ...(row?.value && typeof row.value === 'object' ? (row.value as object) : {}),
    } as T;
    this.cache.set(key, { value, at: Date.now() });
    return value;
  }

  async set<T extends object>(key: string, value: T): Promise<T> {
    await this.prisma.appSetting.upsert({
      where: { key },
      create: { key, value: value as Prisma.InputJsonValue },
      update: { value: value as Prisma.InputJsonValue },
    });
    this.cache.set(key, { value, at: Date.now() });
    return value;
  }

  /** Order protection rules (Fraud & security). */
  security(): Promise<SecuritySettings> {
    return this.get('security', DEFAULT_SECURITY);
  }

  setSecurity(value: SecuritySettings): Promise<SecuritySettings> {
    return this.set('security', value);
  }
}

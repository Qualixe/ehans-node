import { DEFAULT_SECURITY } from '@ehans/shared';
import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../prisma/prisma.service.js';
import { SettingsService } from './settings.service.js';

const make = (value: unknown) => {
  const findUnique = vi
    .fn()
    .mockResolvedValue(value === undefined ? null : { key: 'security', value });
  const upsert = vi.fn().mockResolvedValue({});
  const prisma = { appSetting: { findUnique, upsert } } as unknown as PrismaService;
  return { service: new SettingsService(prisma), findUnique, upsert };
};

describe('SettingsService', () => {
  it('falls back to the defaults when nothing is saved', async () => {
    const { service } = make(undefined);
    await expect(service.security()).resolves.toEqual(DEFAULT_SECURITY);
  });

  it('merges saved values over the defaults (new keys keep their default)', async () => {
    const { service } = make({ maxPerDay: 3 });
    await expect(service.security()).resolves.toEqual({ ...DEFAULT_SECURITY, maxPerDay: 3 });
  });

  it('caches reads and updates the cache on save', async () => {
    const { service, findUnique, upsert } = make({ autoHoldBelow: 40 });
    await service.security();
    await service.security();
    expect(findUnique).toHaveBeenCalledTimes(1);
    const next = { ...DEFAULT_SECURITY, autoHoldBelow: 60 };
    await service.setSecurity(next);
    expect(upsert).toHaveBeenCalledOnce();
    await expect(service.security()).resolves.toEqual(next);
    expect(findUnique).toHaveBeenCalledTimes(1);
  });
});

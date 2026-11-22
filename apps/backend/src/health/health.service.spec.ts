import { Logger } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { Env } from '../config/env.schema.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import { HealthService } from './health.service.js';

function createService(ping: () => Promise<void>) {
  const prisma = { ping } as unknown as PrismaService;
  const config = { get: () => '1.2.3' } as unknown as ConfigService<Env, true>;
  return new HealthService(prisma, config);
}

describe('HealthService', () => {
  beforeAll(() => {
    vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  });

  it('reports liveness without touching the database', () => {
    const ping = vi.fn();
    const result = createService(ping).liveness();
    expect(result).toMatchObject({ status: 'ok', service: 'ehans-api', version: '1.2.3' });
    expect(ping).not.toHaveBeenCalled();
  });

  it('is ready when the database responds', async () => {
    const result = await createService(() => Promise.resolve()).readiness();
    expect(result.status).toBe('ok');
    expect(result.checks?.database?.status).toBe('ok');
  });

  it('is not ready when the database fails', async () => {
    const result = await createService(() => Promise.reject(new Error('ECONNREFUSED'))).readiness();
    expect(result.status).toBe('error');
    expect(result.checks?.database).toEqual({ status: 'error', message: 'database unreachable' });
  });
});

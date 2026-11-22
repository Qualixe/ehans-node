import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { HealthCheckResponse } from '@ehans/shared';
import type { Env } from '../config/env.schema.js';
import { PrismaService } from '../prisma/prisma.service.js';

const SERVICE_NAME = 'ehans-api';
const DB_CHECK_TIMEOUT_MS = 2000;

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  /** Liveness: the process is up and serving HTTP. Never touches dependencies. */
  liveness(): HealthCheckResponse {
    return this.base('ok');
  }

  /** Readiness: the process can serve real traffic (database reachable). */
  async readiness(): Promise<HealthCheckResponse> {
    const startedAt = performance.now();
    let timer: NodeJS.Timeout | undefined;
    try {
      await Promise.race([
        this.prisma.ping(),
        new Promise((_, reject) => {
          timer = setTimeout(
            () => reject(new Error('database check timed out')),
            DB_CHECK_TIMEOUT_MS,
          );
        }),
      ]);
      const latencyMs = Math.round((performance.now() - startedAt) * 10) / 10;
      return { ...this.base('ok'), checks: { database: { status: 'ok', latencyMs } } };
    } catch (error) {
      this.logger.warn('readiness check failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      return {
        ...this.base('error'),
        checks: { database: { status: 'error', message: 'database unreachable' } },
      };
    } finally {
      clearTimeout(timer);
    }
  }

  private base(status: HealthCheckResponse['status']): HealthCheckResponse {
    return {
      status,
      service: SERVICE_NAME,
      version: this.config.get('APP_VERSION', { infer: true }),
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }
}

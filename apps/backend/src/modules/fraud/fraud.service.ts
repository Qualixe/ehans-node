import { Injectable, Logger, UnprocessableEntityException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { FraudCheckDto, FraudCourierRow } from '@ehans/shared';
import type { Env } from '../../config/env.schema.js';
import type { FraudCheck } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { normalizePhone, type ParsedCheck, parseBdCourier } from './bd-courier.js';

const TIMEOUT_MS = 20_000;

/**
 * Customer delivery history ("fraud check") from BD Courier (glowy App\Support\BdCourier).
 * BD Courier aggregates a phone number's parcels across Pathao, Steadfast, RedX, Paperfly …
 * Results are saved per phone and reused for BDCOURIER_CACHE_HOURS to save API credit.
 */
@Injectable()
export class FraudService {
  private readonly logger = new Logger(FraudService.name);
  private readonly apiKey: string | undefined;
  private readonly endpoint: string;
  private readonly cacheMs: number;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.apiKey = config.get('BDCOURIER_API_KEY', { infer: true });
    this.endpoint = config.get('BDCOURIER_ENDPOINT', { infer: true });
    this.cacheMs = config.get('BDCOURIER_CACHE_HOURS', { infer: true }) * 3600_000;
  }

  get enabled(): boolean {
    return Boolean(this.apiKey);
  }

  /** Saved results for these phones (no API calls), keyed by normalized phone. */
  async saved(phones: string[]): Promise<Record<string, FraudCheckDto>> {
    const rows = await this.prisma.fraudCheck.findMany({
      where: { phone: { in: [...new Set(phones.map(normalizePhone))] } },
    });
    return Object.fromEntries(rows.map((r) => [r.phone, toDto(r)]));
  }

  /** Numbers looked up most recently (Fraud checker "Recent"). */
  async recentPhones(limit = 6): Promise<string[]> {
    const rows = await this.prisma.fraudCheck.findMany({
      orderBy: { checkedAt: 'desc' },
      take: limit,
      select: { phone: true },
    });
    return rows.map((r) => r.phone);
  }

  async savedOne(phone: string): Promise<FraudCheckDto | null> {
    const row = await this.prisma.fraudCheck.findUnique({
      where: { phone: normalizePhone(phone) },
    });
    return row ? toDto(row) : null;
  }

  /** The saved result, refreshed from BD Courier when missing, older than the cache, or `fresh`. */
  async check(rawPhone: string, fresh = false): Promise<FraudCheckDto> {
    const phone = normalizePhone(rawPhone);
    const cached = await this.prisma.fraudCheck.findUnique({ where: { phone } });
    if (cached && !fresh && Date.now() - cached.checkedAt.getTime() < this.cacheMs) {
      return toDto(cached);
    }
    const parsed = await this.fetch(phone);
    const data = { ...parsed, couriers: parsed.couriers as object[], checkedAt: new Date() };
    const row = await this.prisma.fraudCheck.upsert({
      where: { phone },
      create: { phone, ...data },
      update: data,
    });
    return toDto(row);
  }

  private async fetch(phone: string): Promise<ParsedCheck> {
    if (!this.apiKey) {
      throw new UnprocessableEntityException(
        'Add your BD Courier API key (BDCOURIER_API_KEY) to enable fraud checks.',
      );
    }
    let response: Response;
    try {
      response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch {
      this.logger.warn('bd courier unreachable');
      throw new UnprocessableEntityException('Could not reach BD Courier. Please try again.');
    }
    const json: unknown = await response.json().catch(() => null);
    const body = (typeof json === 'object' && json !== null ? json : {}) as Record<string, unknown>;
    if (!response.ok || body.status === 'error') {
      this.logger.warn('bd courier rejected the request', { status: response.status });
      const message = [body.message, body.error].find((m) => typeof m === 'string' && m);
      throw new UnprocessableEntityException(
        (message as string | undefined) ??
          `BD Courier rejected the request (HTTP ${response.status}).`,
      );
    }
    return parseBdCourier(json);
  }
}

function toDto(r: FraudCheck): FraudCheckDto {
  return {
    phone: r.phone,
    totalParcels: r.totalParcels,
    successParcels: r.successParcels,
    cancelledParcels: r.cancelledParcels,
    successRatio: r.successRatio,
    couriers: Array.isArray(r.couriers) ? (r.couriers as unknown as FraudCourierRow[]) : [],
    checkedAt: r.checkedAt.toISOString(),
  };
}

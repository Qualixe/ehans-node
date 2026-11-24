import { Injectable, Logger, UnprocessableEntityException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../config/env.schema.js';

export interface ParcelRequest {
  /** Our order number (merchant invoice) */
  invoice: string;
  name: string;
  phone: string;
  address: string;
  /** Cash the courier collects */
  cod: number;
  itemDescription: string;
  quantity: number;
  note?: string | null;
  /** Pathao only */
  pathao?: { cityId: number; zoneId: number; areaId?: number | null; weightKg?: number };
}

export interface ParcelBooking {
  consignmentId: string;
  trackingCode: string | null;
  status: string;
  fee: number | null;
}

export interface CourierOption {
  id: string;
  name: string;
  ready: boolean;
}

const TIMEOUT_MS = 12_000;
const PATHAO_LIVE = 'https://api-hermes.pathao.com';
const PATHAO_SANDBOX = 'https://courier-api-sandbox.pathao.com';
const STEADFAST = 'https://portal.packzy.com/api/v1';

/**
 * Courier merchant APIs (glowy App\Support\Couriers): Steadfast (Packzy) and Pathao (Aladdin).
 * Keys come from the server environment; a courier without keys shows as "not set up".
 * This module only talks to the couriers; the orders module stores the consignment.
 */
@Injectable()
export class CourierService {
  private readonly logger = new Logger(CourierService.name);
  private pathaoToken: { value: string; expiresAt: number } | null = null;
  private readonly cache = new Map<string, { value: unknown; expiresAt: number }>();

  constructor(private readonly config: ConfigService<Env, true>) {}

  available(): CourierOption[] {
    return [
      { id: 'steadfast', name: 'Steadfast', ready: this.steadfastReady() },
      { id: 'pathao', name: 'Pathao', ready: this.pathaoReady() },
    ];
  }

  async book(courier: string, parcel: ParcelRequest): Promise<ParcelBooking> {
    if (courier === 'steadfast') return this.steadfastBook(parcel);
    if (courier === 'pathao') return this.pathaoBook(parcel);
    throw new UnprocessableEntityException([`Booking with ${courier} isn't supported.`]);
  }

  /** Live courier status, e.g. "in_review", "delivered", "cancelled". */
  async status(courier: string, consignmentId: string): Promise<string> {
    if (courier === 'steadfast') {
      const json = await this.steadfast(
        'GET',
        `/status_by_cid/${encodeURIComponent(consignmentId)}`,
      );
      return str(json.delivery_status ?? 'unknown');
    }
    if (courier === 'pathao') {
      const data = this.data(
        await this.pathao('GET', `/aladdin/api/v1/orders/${encodeURIComponent(consignmentId)}`),
      );
      return slug(str(data.order_status_slug ?? data.order_status ?? 'unknown'));
    }
    throw new UnprocessableEntityException([`Tracking ${courier} isn't supported.`]);
  }

  /** The courier status that should move our order ("delivered" → Delivered). */
  static orderStatusFor(
    courier: string,
    status: string,
  ): 'delivered' | 'partial' | 'returned' | null {
    if (courier === 'steadfast') {
      if (status === 'delivered') return 'delivered';
      if (status === 'partial_delivered') return 'partial';
      if (status === 'cancelled') return 'returned';
      return null;
    }
    if (['delivered'].includes(status)) return 'delivered';
    if (['partial_delivery', 'partial_delivered'].includes(status)) return 'partial';
    if (['return', 'returned', 'paid_return'].includes(status)) return 'returned';
    return null;
  }

  static trackingUrl(
    courier: string,
    consignmentId: string | null,
    trackingCode: string | null,
    phone: string,
  ): string | null {
    if (courier === 'steadfast' && trackingCode) {
      return `https://steadfast.com.bd/t/${encodeURIComponent(trackingCode)}`;
    }
    if (courier === 'pathao' && consignmentId) {
      return `https://merchant.pathao.com/tracking?consignment_id=${encodeURIComponent(consignmentId)}&phone=${encodeURIComponent(phone)}`;
    }
    return null;
  }

  // ---------------------------------------------------------------- Pathao address lists

  pathaoCities(): Promise<{ id: number; name: string }[]> {
    return this.cached('cities', () =>
      this.pathaoList('/aladdin/api/v1/countries/1/city-list', 'city'),
    );
  }

  pathaoZones(cityId: number): Promise<{ id: number; name: string }[]> {
    return this.cached(`zones.${cityId}`, () =>
      this.pathaoList(`/aladdin/api/v1/cities/${cityId}/zone-list`, 'zone'),
    );
  }

  pathaoAreas(zoneId: number): Promise<{ id: number; name: string }[]> {
    return this.cached(`areas.${zoneId}`, () =>
      this.pathaoList(`/aladdin/api/v1/zones/${zoneId}/area-list`, 'area'),
    );
  }

  /** Pathao city for one of our districts (glowy guessCityId). */
  async pathaoCityFor(district: string): Promise<number | null> {
    const needle = district.trim().toLowerCase();
    if (!needle || !this.pathaoReady()) return null;
    const cities = await this.pathaoCities();
    const hit = cities.find(
      (c) => c.name.toLowerCase() === needle || c.name.toLowerCase().startsWith(needle),
    );
    return hit?.id ?? null;
  }

  // ---------------------------------------------------------------- Steadfast

  private steadfastReady(): boolean {
    return Boolean(this.env('STEADFAST_API_KEY') && this.env('STEADFAST_SECRET_KEY'));
  }

  private async steadfastBook(p: ParcelRequest): Promise<ParcelBooking> {
    const json = await this.steadfast('POST', '/create_order', {
      invoice: p.invoice,
      recipient_name: p.name.slice(0, 97),
      recipient_phone: p.phone,
      recipient_address: p.address.slice(0, 247),
      cod_amount: p.cod,
      item_description: p.itemDescription.slice(0, 250),
      total_lot: p.quantity,
      delivery_type: 0,
      ...(p.note ? { note: p.note.slice(0, 250) } : {}),
    });
    const c = (json.consignment ?? {}) as Record<string, unknown>;
    if (!c.consignment_id) {
      throw new UnprocessableEntityException([
        `Steadfast: ${str(json.message ?? 'the parcel was not created.')}`,
      ]);
    }
    return {
      consignmentId: str(c.consignment_id),
      trackingCode: c.tracking_code ? str(c.tracking_code) : null,
      status: str(c.status ?? 'in_review'),
      fee: null,
    };
  }

  private async steadfast(
    method: 'GET' | 'POST',
    path: string,
    body?: object,
  ): Promise<Record<string, unknown>> {
    if (!this.steadfastReady()) {
      throw new UnprocessableEntityException([
        'Steadfast is not set up (add STEADFAST_API_KEY and STEADFAST_SECRET_KEY).',
      ]);
    }
    const res = await this.http('Steadfast', STEADFAST + path, {
      method,
      headers: {
        'Api-Key': this.env('STEADFAST_API_KEY')!,
        'Secret-Key': this.env('STEADFAST_SECRET_KEY')!,
      },
      body,
    });
    // Steadfast also reports failures in the body ("status": 400)
    if (!res.ok || (res.json.status !== undefined && Number(res.json.status) !== 200)) {
      throw this.failure('Steadfast', res);
    }
    return res.json;
  }

  // ---------------------------------------------------------------- Pathao

  private pathaoReady(): boolean {
    return [
      'PATHAO_CLIENT_ID',
      'PATHAO_CLIENT_SECRET',
      'PATHAO_USERNAME',
      'PATHAO_PASSWORD',
      'PATHAO_STORE_ID',
    ].every((k) => Boolean(this.env(k as keyof Env)));
  }

  private pathaoBase(): string {
    return this.config.get('PATHAO_SANDBOX', { infer: true }) ? PATHAO_SANDBOX : PATHAO_LIVE;
  }

  private async pathaoBook(p: ParcelRequest): Promise<ParcelBooking> {
    if (!p.pathao) throw new UnprocessableEntityException(['Choose the Pathao city and zone.']);
    const data = this.data(
      await this.pathao('POST', '/aladdin/api/v1/orders', {
        store_id: Number(this.env('PATHAO_STORE_ID')),
        merchant_order_id: p.invoice,
        recipient_name: p.name.slice(0, 97),
        recipient_phone: p.phone,
        recipient_address: p.address.slice(0, 217),
        recipient_city: p.pathao.cityId,
        recipient_zone: p.pathao.zoneId,
        ...(p.pathao.areaId ? { recipient_area: p.pathao.areaId } : {}),
        delivery_type: 48,
        item_type: 2,
        item_quantity: Math.max(1, p.quantity),
        item_weight: p.pathao.weightKg ?? 0.5,
        item_description: p.itemDescription.slice(0, 250),
        amount_to_collect: p.cod,
        ...(p.note ? { special_instruction: p.note.slice(0, 250) } : {}),
      }),
    );
    if (!data.consignment_id)
      throw new UnprocessableEntityException(['Pathao: the parcel was not created.']);
    return {
      consignmentId: str(data.consignment_id),
      trackingCode: str(data.consignment_id),
      status: slug(str(data.order_status ?? 'Pending')),
      fee: data.delivery_fee !== undefined ? Math.round(Number(data.delivery_fee)) : null,
    };
  }

  private async pathaoAccessToken(): Promise<string> {
    if (this.pathaoToken && this.pathaoToken.expiresAt > Date.now()) return this.pathaoToken.value;
    const res = await this.http('Pathao', `${this.pathaoBase()}/aladdin/api/v1/issue-token`, {
      method: 'POST',
      body: {
        client_id: this.env('PATHAO_CLIENT_ID'),
        client_secret: this.env('PATHAO_CLIENT_SECRET'),
        username: this.env('PATHAO_USERNAME'),
        password: this.env('PATHAO_PASSWORD'),
        grant_type: 'password',
      },
    });
    const token = str(res.json.access_token ?? '');
    if (!res.ok || !token) throw this.failure('Pathao', res);
    const lifetime = Math.max(60, Number(res.json.expires_in ?? 3600) - 300);
    this.pathaoToken = { value: token, expiresAt: Date.now() + lifetime * 1000 };
    return token;
  }

  private async pathao(
    method: 'GET' | 'POST',
    path: string,
    body?: object,
    retried = false,
  ): Promise<Record<string, unknown>> {
    if (!this.pathaoReady()) {
      throw new UnprocessableEntityException(['Pathao is not set up (add the PATHAO_* keys).']);
    }
    const res = await this.http('Pathao', this.pathaoBase() + path, {
      method,
      headers: { Authorization: `Bearer ${await this.pathaoAccessToken()}` },
      body,
    });
    // a revoked token: get a fresh one once
    if (res.status === 401 && !retried) {
      this.pathaoToken = null;
      return this.pathao(method, path, body, true);
    }
    if (!res.ok) throw this.failure('Pathao', res);
    return res.json;
  }

  private async pathaoList(path: string, kind: string): Promise<{ id: number; name: string }[]> {
    const data = this.data(await this.pathao('GET', path));
    const list = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];
    return (list as Record<string, unknown>[]).map((row) => ({
      id: Number(row[`${kind}_id`] ?? row.id),
      name: str(row[`${kind}_name`] ?? row.name ?? ''),
    }));
  }

  private data(json: Record<string, unknown>): Record<string, unknown> {
    return (typeof json.data === 'object' && json.data !== null ? json.data : json) as Record<
      string,
      unknown
    >;
  }

  // ---------------------------------------------------------------- shared

  private async http(
    courier: string,
    url: string,
    init: { method: 'GET' | 'POST'; headers?: Record<string, string>; body?: object },
  ): Promise<{ ok: boolean; status: number; json: Record<string, unknown> }> {
    let res: Response;
    try {
      res = await fetch(url, {
        method: init.method,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          ...init.headers,
        },
        body: init.body ? JSON.stringify(init.body) : undefined,
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch {
      this.logger.warn('courier unreachable', { courier });
      throw new UnprocessableEntityException([
        `${courier}: could not reach the server. Please try again.`,
      ]);
    }
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    return { ok: res.ok, status: res.status, json: typeof json === 'object' && json ? json : {} };
  }

  private failure(courier: string, res: { status: number; json: Record<string, unknown> }) {
    this.logger.warn('courier rejected the request', { courier, status: res.status });
    const errors = res.json.errors;
    const first =
      errors && typeof errors === 'object'
        ? Object.values(errors as Record<string, unknown>)
            .flat()
            .find((v) => typeof v === 'string')
        : undefined;
    const message =
      first ??
      res.json.message ??
      res.json.error ??
      `the request was rejected (HTTP ${res.status})`;
    return new UnprocessableEntityException([`${courier}: ${str(message)}`]);
  }

  private async cached<T>(key: string, load: () => Promise<T>): Promise<T> {
    const hit = this.cache.get(key);
    if (hit && hit.expiresAt > Date.now()) return hit.value as T;
    const value = await load();
    this.cache.set(key, { value, expiresAt: Date.now() + 24 * 3600_000 });
    return value;
  }

  private env(key: keyof Env): string | undefined {
    const v = this.config.get(key, { infer: true }) as unknown;
    return typeof v === 'string' && v ? v : undefined;
  }
}

/** Text from an untyped JSON field (numbers too); anything else becomes the fallback. */
const str = (v: unknown, fallback = ''): string =>
  typeof v === 'string' ? v : typeof v === 'number' ? `${v}` : fallback;

const slug = (s: string) =>
  s
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');

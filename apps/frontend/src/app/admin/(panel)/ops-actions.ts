'use server';

import type { FraudLookup, SecuritySettings } from '@ehans/shared';
import { errorMessages } from '@/lib/admin/form-errors';
import { refreshStorefront } from '@/lib/admin/refresh-storefront';
import { adminApi } from '@/lib/admin/session';

type Result<T> = { ok: true; data: T } | { ok: false; error: string };
const run = async <T>(fn: () => Promise<T>, fallback: string): Promise<Result<T>> => {
  try {
    return { ok: true, data: await fn() };
  } catch (error) {
    return { ok: false, error: [...new Set(errorMessages(error))].join(' ') || fallback };
  }
};

export async function settlePayout(courier: string) {
  return run(
    () =>
      adminApi<{ parcels: number }>('/ops/shipments/settle', {
        method: 'POST',
        body: JSON.stringify({ courier }),
      }),
    'Could not mark the payout.',
  );
}

export async function shipmentStatus(number: string, status: 'delivered' | 'returned') {
  return run(async () => {
    await adminApi(`/order-panel/orders/${number}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    refreshStorefront();
  }, 'Could not change the status.');
}

export async function fraudLookup(phone: string, run_ = true, fresh = false) {
  const q = new URLSearchParams({ phone, run: String(run_), fresh: String(fresh) });
  return run(
    () => adminApi<FraudLookup>(`/ops/fraud/lookup?${q.toString()}`, { method: 'POST' }),
    'The check failed.',
  );
}

export async function blockValue(kind: 'phone' | 'ip', value: string, reason: string) {
  return run(
    () =>
      adminApi<void>('/order-panel/blocked', {
        method: 'POST',
        body: JSON.stringify({ kind, value, reason: reason || null }),
      }),
    'Could not block.',
  );
}

export async function unblockValue(id: string) {
  return run(
    () => adminApi<void>(`/order-panel/blocked/${id}`, { method: 'DELETE' }),
    'Could not unblock.',
  );
}

export async function saveSecurity(settings: SecuritySettings) {
  return run(
    () =>
      adminApi<SecuritySettings>('/ops/security', {
        method: 'PUT',
        body: JSON.stringify(settings),
      }),
    'The rules could not be saved.',
  );
}

export async function runSecurityRules() {
  return run(
    () => adminApi<{ held: number }>('/ops/security/run', { method: 'POST' }),
    'Could not run the rules.',
  );
}

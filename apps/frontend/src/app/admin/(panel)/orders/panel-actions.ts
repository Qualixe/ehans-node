'use server';

import type {
  CustomerHint,
  IncompleteRow,
  OrderStatusName,
  PanelOrderDetail,
  PanelOrderInput,
  PosCatalog,
} from '@ehans/shared';
import { errorMessages } from '@/lib/admin/form-errors';
import { refreshStorefront } from '@/lib/admin/refresh-storefront';
import { adminApi } from '@/lib/admin/session';

export type Result<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

const run = async <T>(
  fn: () => Promise<T>,
  fallback: string,
  stockMoved = false,
): Promise<Result<T>> => {
  try {
    const data = await fn();
    if (stockMoved) refreshStorefront();
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: [...new Set(errorMessages(error))].join(' ') || fallback };
  }
};
const json = (body: unknown) => ({ body: JSON.stringify(body) });

export async function getPanelOrder(number: string) {
  return run(
    () => adminApi<PanelOrderDetail>(`/order-panel/orders/${number}`),
    'The order could not be loaded.',
  );
}

export async function savePanelOrder(number: string | null, input: PanelOrderInput) {
  return run(
    () =>
      number
        ? adminApi<void>(`/order-panel/orders/${number}`, { method: 'PUT', ...json(input) }).then(
            () => ({ number }),
          )
        : adminApi<{ number: string }>('/order-panel/orders', { method: 'POST', ...json(input) }),
    'The order could not be saved.',
    true,
  );
}

export async function setPanelStatus(number: string, status: OrderStatusName) {
  return run(
    () =>
      adminApi<void>(`/order-panel/orders/${number}/status`, {
        method: 'PATCH',
        ...json({ status }),
      }),
    'The status could not be changed.',
    true,
  );
}

export async function addPanelNote(number: string, body: string) {
  return run(
    () =>
      adminApi<void>(`/order-panel/orders/${number}/notes`, { method: 'POST', ...json({ body }) }),
    'The note could not be saved.',
  );
}

export async function panelBulk(
  action: 'status' | 'assign' | 'delete',
  numbers: string[],
  extra: { status?: OrderStatusName; staffId?: string | null } = {},
) {
  return run(
    () =>
      adminApi<{ updated: number; skipped: string[] }>('/order-panel/bulk', {
        method: 'POST',
        ...json({ action, numbers, ...extra }),
      }),
    'The orders could not be updated.',
    action !== 'assign',
  );
}

export async function blockFromOrder(
  number: string,
  input: { phone: boolean; ip: boolean; reason: string; cancel: boolean },
) {
  return run(
    () =>
      adminApi<{ added: number }>(`/order-panel/orders/${number}/block`, {
        method: 'POST',
        ...json(input),
      }),
    'The customer could not be blocked.',
    input.cancel,
  );
}

export async function keepDuplicate(number: string) {
  return run(
    () => adminApi<{ cancelled: number }>(`/order-panel/orders/${number}/keep`, { method: 'POST' }),
    'The duplicates could not be cancelled.',
    true,
  );
}

export async function cancelDuplicate(number: string, kept: string) {
  return run(
    () =>
      adminApi<void>(`/order-panel/orders/${number}/cancel-duplicate`, {
        method: 'POST',
        ...json({ kept }),
      }),
    'The order could not be cancelled.',
    true,
  );
}

export async function customerHint(phone: string, exclude?: string) {
  const q = new URLSearchParams({ phone, ...(exclude ? { exclude } : {}) });
  return run(() => adminApi<CustomerHint>(`/order-panel/hint?${q.toString()}`), '');
}

export async function panelProducts() {
  return run(() => adminApi<PosCatalog>('/pos/catalog'), 'Products could not be loaded.');
}

export async function bookCourier(
  number: string,
  input: {
    courier: string;
    cod?: number;
    note?: string | null;
    pathao?: { cityId: number; zoneId: number; areaId?: number | null };
  },
) {
  return run(
    () =>
      adminApi<{ consignmentId: string; trackingCode: string | null }>(
        `/order-panel/orders/${number}/courier`,
        {
          method: 'POST',
          ...json(input),
        },
      ),
    'The parcel could not be booked.',
  );
}

export async function bookCourierBulk(numbers: string[]) {
  return run(
    () =>
      adminApi<{ booked: string[]; failed: { number: string; reason: string }[] }>(
        '/order-panel/courier/bulk',
        {
          method: 'POST',
          ...json({ courier: 'steadfast', numbers }),
        },
      ),
    'The parcels could not be booked.',
  );
}

export async function syncCourier(number: string) {
  return run(
    () =>
      adminApi<{ courierStatus: string }>(`/order-panel/orders/${number}/courier/sync`, {
        method: 'POST',
      }),
    'The courier status could not be checked.',
    true,
  );
}

export async function pathaoOptions(kind: 'cities' | 'zones' | 'areas' | 'cityFor', arg = '') {
  const path =
    kind === 'cities'
      ? '/order-panel/pathao/cities'
      : kind === 'zones'
        ? `/order-panel/pathao/cities/${encodeURIComponent(arg)}/zones`
        : kind === 'areas'
          ? `/order-panel/pathao/zones/${encodeURIComponent(arg)}/areas`
          : `/order-panel/pathao/city-for?district=${encodeURIComponent(arg)}`;
  return run(() => adminApi<unknown>(path), 'Pathao could not be reached.');
}

// ---------------------------------------------------------------- incomplete orders

export async function incompleteCalled(id: string) {
  return run(
    () => adminApi<void>(`/incomplete/${id}/called`, { method: 'POST' }),
    'Could not update.',
  );
}

export async function incompleteDelete(id: string) {
  return run(() => adminApi<void>(`/incomplete/${id}`, { method: 'DELETE' }), 'Could not delete.');
}

export async function incompleteGet(id: string) {
  return run(() => adminApi<IncompleteRow>(`/incomplete/${id}`), 'Could not load.');
}

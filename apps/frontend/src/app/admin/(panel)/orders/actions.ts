'use server';

import type { AdminBulkStatusResult, OrderStatusName } from '@ehans/shared';
import { redirect } from 'next/navigation';
import { flash } from '@/lib/admin/flash';
import { errorMessages } from '@/lib/admin/form-errors';
import { refreshStorefront } from '@/lib/admin/refresh-storefront';
import { adminApi } from '@/lib/admin/session';

export type ActionResult = { ok: true } | { ok: false; error: string };

const label = (s: OrderStatusName) => s.charAt(0).toUpperCase() + s.slice(1);
const fail = (error: unknown, fallback: string): ActionResult => ({
  ok: false,
  error: errorMessages(error)[0] ?? fallback,
});

/** Status popup on the list (glowy OrderStatusController). Cancel/return restocks the items. */
export async function setOrderStatus(
  number: string,
  status: OrderStatusName,
): Promise<ActionResult> {
  try {
    await adminApi(`/orders/${number}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  } catch (error) {
    return fail(error, 'The status could not be changed.');
  }
  refreshStorefront(); // stock may have moved
  await flash(`Order ${number} marked as ${label(status)}.`);
  return { ok: true };
}

/** Inline internal note (glowy OrderNoteController). */
export async function saveOrderNote(number: string, note: string): Promise<ActionResult> {
  try {
    await adminApi(`/orders/${number}/note`, {
      method: 'PATCH',
      body: JSON.stringify({ adminNote: note }),
    });
    return { ok: true };
  } catch (error) {
    return fail(error, 'The note could not be saved.');
  }
}

/** Bulk bar: change the status of the selected orders (glowy OrderBulkStatusController). */
export async function bulkOrderStatus(
  numbers: string[],
  status: OrderStatusName,
): Promise<ActionResult> {
  let result: AdminBulkStatusResult;
  try {
    result = await adminApi<AdminBulkStatusResult>('/orders/bulk-status', {
      method: 'PATCH',
      body: JSON.stringify({ numbers, status }),
    });
  } catch (error) {
    return fail(error, 'The orders could not be updated.');
  }
  refreshStorefront();
  const skipped = result.skipped.length
    ? ` Skipped (not enough stock): ${result.skipped.join(', ')}.`
    : '';
  await flash(
    `${result.updated} ${result.updated === 1 ? 'order' : 'orders'} marked as ${label(status)}.${skipped}`,
    result.skipped.length && !result.updated ? 'error' : 'ok',
  );
  return { ok: true };
}

/** The order page's fulfilment form (glowy OrderController@update). */
export async function updateOrder(number: string, form: FormData): Promise<void> {
  const text = (name: string) => String(form.get(name) ?? '').trim() || null;
  try {
    await adminApi(`/orders/${number}`, {
      method: 'PUT',
      body: JSON.stringify({
        status: String(form.get('status')),
        courier: text('courier'),
        trackingNumber: text('trackingNumber'),
        adminNote: text('adminNote'),
      }),
    });
    refreshStorefront();
    await flash(`Order ${number} updated.`);
  } catch (error) {
    await flash(errorMessages(error)[0] ?? 'The order could not be updated.', 'error');
  }
  redirect(`/admin/orders/${number}`);
}

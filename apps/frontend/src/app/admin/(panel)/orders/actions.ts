'use server';

import type { FraudCheckDto } from '@ehans/shared';
import { redirect } from 'next/navigation';
import { flash } from '@/lib/admin/flash';
import { errorMessages } from '@/lib/admin/form-errors';
import { refreshStorefront } from '@/lib/admin/refresh-storefront';
import { adminApi } from '@/lib/admin/session';

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

/** BD Courier delivery history for the order's phone (glowy FraudCheckController). */
export async function runFraudCheck(
  number: string,
  fresh: boolean,
): Promise<{ ok: true; check: FraudCheckDto } | { ok: false; error: string }> {
  try {
    const check = await adminApi<FraudCheckDto>(
      `/orders/${number}/fraud-check${fresh ? '?fresh=true' : ''}`,
      { method: 'POST' },
    );
    return { ok: true, check };
  } catch (error) {
    return { ok: false, error: errorMessages(error)[0] ?? 'The fraud check failed.' };
  }
}

'use server';

import { redirect } from 'next/navigation';
import { flash } from '@/lib/admin/flash';
import { errorMessages } from '@/lib/admin/form-errors';
import { refreshStorefront } from '@/lib/admin/refresh-storefront';
import { adminApi } from '@/lib/admin/session';

/** glowy InventoryController@update: "Add" or "Set to", then back to the same list. */
export async function adjustStock(
  kind: 'variant' | 'product',
  id: string,
  returnTo: string,
  form: FormData,
): Promise<void> {
  const mode = form.get('mode') === 'set' ? 'set' : 'add';
  const quantity = Number(form.get('quantity'));
  try {
    const result = await adminApi<{ name: string; stock: number }>(`/inventory/${kind}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ mode, quantity: Number.isInteger(quantity) ? quantity : -1 }),
    });
    refreshStorefront();
    await flash(`Stock for “${result.name}” is now ${result.stock}.`);
  } catch (error) {
    const message = errorMessages(error)[0] ?? 'The stock could not be updated.';
    await flash(
      /quantity/i.test(message)
        ? 'The quantity must be a whole number from 0 to 1,000,000.'
        : message,
      'error',
    );
  }
  redirect(returnTo.startsWith('/admin/inventory') ? returnTo : '/admin/inventory');
}

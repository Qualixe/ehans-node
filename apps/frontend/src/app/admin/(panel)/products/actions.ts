'use server';

import { redirect } from 'next/navigation';
import { flash } from '@/lib/admin/flash';
import { errorMessages } from '@/lib/admin/form-errors';
import { refreshStorefront } from '@/lib/admin/refresh-storefront';
import { adminApi } from '@/lib/admin/session';

export async function deleteProduct(id: string, returnTo: string): Promise<void> {
  try {
    const { name } = await adminApi<{ name: string }>(`/products/${id}`, { method: 'DELETE' });
    refreshStorefront();
    await flash(`“${name}” deleted.`);
  } catch (error) {
    await flash(errorMessages(error)[0] ?? 'The product could not be deleted.', 'error');
  }
  redirect(returnTo.startsWith('/admin/products') ? returnTo : '/admin/products');
}

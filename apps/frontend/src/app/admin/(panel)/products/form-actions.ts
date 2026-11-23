'use server';

import type { AdminCrossSellItem, AdminPage, AdminProductRow } from '@ehans/shared';
import { redirect } from 'next/navigation';
import { flash } from '@/lib/admin/flash';
import { errorMessages } from '@/lib/admin/form-errors';
import { refreshStorefront } from '@/lib/admin/refresh-storefront';
import { adminApi } from '@/lib/admin/session';

export interface ProductFormState {
  errors?: string[];
}

/**
 * Create (id null) or update a product: `data` (the form as JSON) and `images` (new files) go
 * straight to the API, which validates everything again.
 */
export async function saveProduct(
  id: string | null,
  _prev: ProductFormState,
  form: FormData,
): Promise<ProductFormState> {
  const body = new FormData();
  body.set('data', String(form.get('data') ?? ''));
  for (const file of form.getAll('images')) {
    if (file instanceof File && file.size > 0) body.append('images', file, file.name);
  }
  let savedId: string;
  try {
    ({ id: savedId } = await adminApi<{ id: string }>(id ? `/products/${id}` : '/products', {
      method: id ? 'PUT' : 'POST',
      body,
    }));
  } catch (error) {
    return { errors: errorMessages(error) };
  }
  refreshStorefront();
  await flash(id ? 'Product saved.' : 'Product created.');
  redirect(`/admin/products/${savedId}/edit`);
}

/** Product search for the cross-sell pickers (name, SKU or brand; up to 20). */
export async function findCrossSellProducts(q: string): Promise<AdminCrossSellItem[]> {
  const term = q.trim().slice(0, 100);
  if (!term) return [];
  const page = await adminApi<AdminPage<AdminProductRow>>(
    `/products?q=${encodeURIComponent(term)}`,
  );
  return page.items.map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    image: p.image,
    isActive: p.isActive,
  }));
}

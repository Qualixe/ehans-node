'use server';

import type { AdminCategory } from '@ehans/shared';
import { redirect } from 'next/navigation';
import { flash } from '@/lib/admin/flash';
import { errorMessages } from '@/lib/admin/form-errors';
import { refreshStorefront } from '@/lib/admin/refresh-storefront';
import { adminApi } from '@/lib/admin/session';

export interface CategoryFormState {
  errors?: string[];
}

/** Create (id null) or update a category; the API re-checks the session and permissions. */
export async function saveCategory(
  id: string | null,
  _prev: CategoryFormState,
  form: FormData,
): Promise<CategoryFormState> {
  const body = new FormData();
  for (const key of [
    'name',
    'slug',
    'parentId',
    'position',
    'description',
    'metaTitle',
    'metaDescription',
    'homeTitle',
    'homePosition',
  ]) {
    body.set(key, String(form.get(key) ?? ''));
  }
  body.set('showInMenu', form.get('showInMenu') === '1' ? '1' : '0');
  const image = form.get('image');
  if (image instanceof File && image.size > 0) body.set('image', image, image.name);

  try {
    await adminApi<AdminCategory>(id ? `/categories/${id}` : '/categories', {
      method: id ? 'PUT' : 'POST',
      body,
    });
  } catch (error) {
    return { errors: errorMessages(error) };
  }
  refreshStorefront();
  await flash(id ? 'Category saved.' : 'Category created.');
  redirect('/admin/categories');
}

export async function deleteCategory(id: string): Promise<void> {
  try {
    await adminApi(`/categories/${id}`, { method: 'DELETE' });
    refreshStorefront();
    await flash('Category deleted.');
  } catch (error) {
    await flash(errorMessages(error)[0] ?? 'The category could not be deleted.', 'error');
  }
  redirect('/admin/categories');
}

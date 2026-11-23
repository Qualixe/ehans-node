'use server';

import { redirect } from 'next/navigation';
import { flash } from '@/lib/admin/flash';
import { errorMessages } from '@/lib/admin/form-errors';
import { refreshStorefront } from '@/lib/admin/refresh-storefront';
import { adminApi } from '@/lib/admin/session';

/** Back to the list the admin was on (glowy: back()). */
const back = (returnTo: string) =>
  returnTo.startsWith('/admin/reviews') ? returnTo : '/admin/reviews';

export async function setReviewApproved(
  id: string,
  approve: boolean,
  returnTo: string,
): Promise<void> {
  try {
    await adminApi(`/reviews/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ isApproved: approve }),
    });
    refreshStorefront();
    await flash(approve ? 'Review approved and published.' : 'Review hidden.');
  } catch (error) {
    await flash(errorMessages(error)[0] ?? 'The review could not be updated.', 'error');
  }
  redirect(back(returnTo));
}

export async function deleteReview(id: string, returnTo: string): Promise<void> {
  try {
    await adminApi(`/reviews/${id}`, { method: 'DELETE' });
    refreshStorefront();
    await flash('Review deleted.');
  } catch (error) {
    await flash(errorMessages(error)[0] ?? 'The review could not be deleted.', 'error');
  }
  redirect(back(returnTo));
}

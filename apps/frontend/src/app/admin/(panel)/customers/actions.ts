'use server';

import { CUSTOMER_PASSWORD_MIN } from '@ehans/shared';
import { redirect } from 'next/navigation';
import { flash } from '@/lib/admin/flash';
import { errorMessages } from '@/lib/admin/form-errors';
import { adminApi } from '@/lib/admin/session';

/** glowy CustomerPasswordController: staff set a new password and tell the customer by phone. */
export async function setCustomerPassword(
  userId: string,
  phone: string,
  form: FormData,
): Promise<void> {
  const password = String(form.get('password') ?? '');
  const back = `/admin/customers/${encodeURIComponent(phone)}`;
  if (password.length < CUSTOMER_PASSWORD_MIN) {
    await flash(`The password must be at least ${CUSTOMER_PASSWORD_MIN} characters.`, 'error');
    redirect(back);
  }
  if (password !== String(form.get('password_confirmation') ?? '')) {
    await flash('The two passwords do not match.', 'error');
    redirect(back);
  }
  try {
    await adminApi(`/customers/accounts/${userId}/password`, {
      method: 'PUT',
      body: JSON.stringify({ password }),
    });
    await flash('New password set. The customer has been signed out everywhere.');
  } catch (error) {
    await flash(errorMessages(error)[0] ?? 'The password could not be changed.', 'error');
  }
  redirect(back);
}

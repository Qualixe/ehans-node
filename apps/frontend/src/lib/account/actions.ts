'use server';

import { CUSTOMER_PASSWORD_MIN, type CustomerProfile, type CustomerSession } from '@ehans/shared';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { ApiError, apiFetch } from '../api-client';
import { getServerEnv } from '../env';
import { accountApi, CUSTOMER_COOKIE, getCustomer, getCustomerToken, safeNext } from './session';

export interface FormState {
  values: Record<string, string>;
  errors: string[];
  /** A success message (profile / password saved). */
  saved?: string;
}

const text = (form: FormData, name: string) => String(form.get(name) ?? '').trim();
const messages = (error: unknown, fallback: string): string[] => {
  if (error instanceof ApiError) {
    const m = error.body?.message ?? error.message;
    return [...new Set(Array.isArray(m) ? m : [m])];
  }
  return [fallback];
};

/** The visitor's IP and browser, so the API's per-network limits and session list are right. */
async function clientHeaders(): Promise<Record<string, string>> {
  const h = await headers();
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip');
  return {
    ...(ip ? { 'X-Forwarded-For': ip } : {}),
    'User-Agent': h.get('user-agent') ?? 'ehans-storefront',
  };
}

async function keepSession(session: CustomerSession, remember: boolean): Promise<void> {
  (await cookies()).set(CUSTOMER_COOKIE, session.token, {
    httpOnly: true,
    secure: getServerEnv().NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    // "Keep me signed in": persistent; otherwise it ends with the browser session
    ...(remember ? { expires: new Date(session.expiresAt) } : {}),
  });
}

/** glowy AccountAuthController@store */
export async function signIn(_prev: FormState, form: FormData): Promise<FormState> {
  const values = { phone: text(form, 'phone') };
  const remember = form.get('remember') === '1';
  const errors: string[] = [];
  if (!values.phone) errors.push('Please enter your mobile number.');
  if (!String(form.get('password') ?? '')) errors.push('Please enter your password.');
  if (errors.length) return { values, errors };

  let session: CustomerSession;
  try {
    session = await apiFetch<CustomerSession>('/account/login', {
      method: 'POST',
      body: JSON.stringify({
        phone: values.phone,
        password: String(form.get('password')),
        remember,
      }),
      headers: await clientHeaders(),
      cache: 'no-store',
    });
  } catch (error) {
    return {
      values,
      errors: messages(error, 'Sign-in is unavailable right now. Please try again.'),
    };
  }
  await keepSession(session, remember);
  redirect(safeNext(form.get('next')));
}

/** glowy AccountRegisterController@store (with its "fax" honeypot for bots). */
export async function register(_prev: FormState, form: FormData): Promise<FormState> {
  const values = {
    name: text(form, 'name'),
    phone: text(form, 'phone'),
    email: text(form, 'email'),
  };
  const password = String(form.get('password') ?? '');
  const errors: string[] = [];
  if (text(form, 'fax')) return { values, errors: ['Please try again.'] };
  if (!values.name) errors.push('Please enter your name.');
  if (!values.phone) errors.push('Please enter your mobile number.');
  if (password.length < CUSTOMER_PASSWORD_MIN)
    errors.push(`Password must be at least ${CUSTOMER_PASSWORD_MIN} characters.`);
  else if (password !== String(form.get('password_confirmation') ?? ''))
    errors.push('The two passwords do not match.');
  if (errors.length) return { values, errors };

  let session: CustomerSession;
  try {
    session = await apiFetch<CustomerSession>('/account/register', {
      method: 'POST',
      body: JSON.stringify({ ...values, email: values.email || null, password }),
      headers: await clientHeaders(),
      cache: 'no-store',
    });
  } catch (error) {
    return {
      values,
      errors: messages(error, 'Sign-up is unavailable right now. Please try again.'),
    };
  }
  await keepSession(session, true);
  redirect(safeNext(form.get('next')));
}

/** Sign out: revoke the session, drop the cookie, back to the home page. */
export async function signOut(): Promise<void> {
  const token = await getCustomerToken();
  if (token) {
    await apiFetch('/account/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    }).catch(() => undefined);
  }
  (await cookies()).delete({ name: CUSTOMER_COOKIE, path: '/' });
  redirect('/');
}

/** glowy AccountProfileController@update */
export async function updateProfile(_prev: FormState, form: FormData): Promise<FormState> {
  const values = {
    name: text(form, 'name'),
    phone: text(form, 'phone'),
    email: text(form, 'email'),
    address: text(form, 'address'),
    district: text(form, 'district'),
  };
  try {
    const saved = await accountApi<CustomerProfile>('/profile', {
      method: 'PUT',
      body: JSON.stringify({
        ...values,
        email: values.email || null,
        address: values.address || null,
        district: values.district || null,
      }),
    });
    return {
      values: {
        name: saved.name,
        phone: saved.phone,
        email: saved.email ?? '',
        address: saved.address ?? '',
        district: saved.district ?? '',
      },
      errors: [],
      saved: 'Your details have been saved.',
    };
  } catch (error) {
    if (error instanceof ApiError && error.status === 401)
      redirect('/account/login?next=/account/profile');
    return { values, errors: messages(error, 'Your details could not be saved.') };
  }
}

/** glowy AccountProfileController@password */
export async function changePassword(_prev: FormState, form: FormData): Promise<FormState> {
  const current = String(form.get('current_password') ?? '');
  const password = String(form.get('password') ?? '');
  const errors: string[] = [];
  if (!current) errors.push('Please enter your current password.');
  if (password.length < CUSTOMER_PASSWORD_MIN)
    errors.push(`Password must be at least ${CUSTOMER_PASSWORD_MIN} characters.`);
  else if (password !== String(form.get('password_confirmation') ?? ''))
    errors.push('The two new passwords do not match.');
  if (errors.length) return { values: {}, errors };
  try {
    await accountApi('/password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword: current, password }),
    });
    return { values: {}, errors: [], saved: 'Your password has been updated.' };
  } catch (error) {
    if (error instanceof ApiError && error.status === 401)
      redirect('/account/login?next=/account/profile');
    return { values: {}, errors: messages(error, 'Your password could not be changed.') };
  }
}

/** Checkout prefill: the signed-in customer's saved details (null for guests). */
export async function myCheckoutDetails(): Promise<{
  name: string;
  phone: string;
  address: string;
  district: string;
} | null> {
  const customer = await getCustomer();
  return customer
    ? {
        name: customer.name,
        phone: customer.phone,
        address: customer.address ?? '',
        district: customer.district ?? '',
      }
    : null;
}

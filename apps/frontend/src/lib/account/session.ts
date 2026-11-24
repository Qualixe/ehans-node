import 'server-only';
import type { CustomerProfile } from '@ehans/shared';
import { cookies } from 'next/headers';
import { cache } from 'react';
import { ApiError, apiFetch } from '../api-client';

/** httpOnly cookie holding the storefront customer's session token (never readable by JS). */
export const CUSTOMER_COOKIE = 'ehans_customer';

export async function getCustomerToken(): Promise<string | null> {
  return (await cookies()).get(CUSTOMER_COOKIE)?.value ?? null;
}

/** Calls `/api/v1/account/*` as the signed-in customer (server-side only). */
export async function accountApi<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getCustomerToken();
  return apiFetch<T>(`/account${path}`, {
    ...init,
    cache: 'no-store',
    headers: { ...init.headers, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
}

/** The signed-in customer, or null (no cookie, or the session expired / was revoked). */
export const getCustomer = cache(async (): Promise<CustomerProfile | null> => {
  if (!(await getCustomerToken())) return null;
  try {
    return await accountApi<CustomerProfile>('/me');
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
});

/** Only same-site paths are followed after sign-in (no open redirects). */
export const safeNext = (next: unknown, fallback = '/account'): string =>
  typeof next === 'string' && next.startsWith('/') && !next.startsWith('//') ? next : fallback;

import 'server-only';
import type { AdminUser } from '@ehans/shared';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { ApiError, apiFetch } from '../api-client';

/** httpOnly cookie holding the admin session token (set by the sign-in server action). */
export const ADMIN_COOKIE = 'ehans_admin';

export async function getAdminToken(): Promise<string | null> {
  return (await cookies()).get(ADMIN_COOKIE)?.value ?? null;
}

/**
 * Calls the admin API (`/api/v1/admin/*`) as the signed-in admin. Runs on the server only, so
 * the session token never reaches browser JavaScript. No session or an expired one → sign-in page.
 */
export async function adminApi<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getAdminToken();
  if (!token) redirect('/admin/login');
  let expired = false;
  try {
    return await apiFetch<T>(`/admin${path}`, {
      ...init,
      cache: 'no-store',
      headers: { ...init.headers, Authorization: `Bearer ${token}` },
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) expired = true;
    else throw error;
  }
  // outside the try: redirect() works by throwing
  if (expired) redirect('/admin/login?expired=1');
  throw new Error('unreachable');
}

/** The signed-in admin, read once per request. */
export const getCurrentAdmin = cache((): Promise<AdminUser> => adminApi<AdminUser>('/auth/me'));

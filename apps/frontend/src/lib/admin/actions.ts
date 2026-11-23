'use server';

import type { AdminLoginResponse } from '@ehans/shared';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { ApiError, apiFetch } from '../api-client';
import { getServerEnv } from '../env';
import { adminHomePath } from './menu';
import { ADMIN_COOKIE, getAdminToken } from './session';

export interface LoginState {
  email: string;
  remember: boolean;
  errors: { email?: string; password?: string };
}

/** Admin sign-in (glowy AuthController@store): checks the credentials, then stores the session. */
export async function signIn(_prev: LoginState, form: FormData): Promise<LoginState> {
  const email = String(form.get('email') ?? '').trim();
  const password = String(form.get('password') ?? '');
  const remember = form.get('remember') === '1';
  const state: LoginState = { email, remember, errors: {} };

  if (!email) state.errors.email = 'The email field is required.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    state.errors.email = 'The email field must be a valid email address.';
  if (!password) state.errors.password = 'The password field is required.';
  if (state.errors.email || state.errors.password) return state;

  let session: AdminLoginResponse;
  try {
    session = await apiFetch<AdminLoginResponse>('/admin/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, remember }),
      headers: { 'User-Agent': (await headers()).get('user-agent') ?? 'next-admin' },
      cache: 'no-store',
    });
  } catch (error) {
    if (error instanceof ApiError && [400, 401, 429].includes(error.status)) {
      // same wording as Laravel: the message goes under the email field
      return { ...state, errors: { email: error.message } };
    }
    return { ...state, errors: { email: 'Sign-in is unavailable right now. Please try again.' } };
  }

  (await cookies()).set(ADMIN_COOKIE, session.token, {
    httpOnly: true,
    secure: getServerEnv().NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/admin',
    // "Keep me signed in": a persistent cookie; otherwise it ends with the browser session
    ...(remember ? { expires: new Date(session.expiresAt) } : {}),
  });
  redirect(adminHomePath(session.user));
}

/** Sign out: revoke the session on the API, drop the cookie, back to the sign-in page. */
export async function signOut(): Promise<void> {
  const token = await getAdminToken();
  if (token) {
    await apiFetch('/admin/auth/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    }).catch(() => undefined);
  }
  (await cookies()).delete({ name: ADMIN_COOKIE, path: '/admin' });
  redirect('/admin/login');
}

import type { AdminUser } from '@ehans/shared';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { ApiError, apiFetch } from '@/lib/api-client';
import { adminHomePath } from '@/lib/admin/menu';
import { getAdminToken } from '@/lib/admin/session';
import { HOME_HERO_SLIDES, STORE_LOGO } from '@/lib/home-media';
import { LoginForm } from './login-form';

export const metadata: Metadata = { title: 'Sign in' };

/** Already signed in → straight to the admin (glowy's guest middleware). */
async function SignedInRedirect() {
  const token = await getAdminToken();
  if (!token) return null;
  let user: AdminUser | null = null;
  try {
    user = await apiFetch<AdminUser>('/admin/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
  } catch (error) {
    if (!(error instanceof ApiError)) throw error; // expired/revoked session: show the form
  }
  if (user) redirect(adminHomePath(user));
  return null;
}

async function Form({ searchParams }: { searchParams: PageProps<'/admin/login'>['searchParams'] }) {
  const expired = (await searchParams).expired === '1';
  return (
    <LoginForm notice={expired ? 'Your session has ended. Please sign in again.' : undefined} />
  );
}

/** Admin sign-in: storefront look (glowy admin.css .auth-* card). */
export default function AdminLoginPage({ searchParams }: PageProps<'/admin/login'>) {
  return (
    <main className="auth-page">
      <div className="auth-bg" aria-hidden="true">
        <img src={HOME_HERO_SLIDES[0].desktop} alt="" />
      </div>
      <div className="auth-panel">
        <div>
          <div className="auth-card">
            <Link href="/" className="auth-logo" aria-label="Ehans Mart home">
              <img src={STORE_LOGO} alt="Ehans Mart" width={300} height={71} />
            </Link>
            <h1 className="auth-title">Welcome back</h1>
            <p className="auth-subtitle">Sign in to manage orders, products and your store.</p>
            <Suspense fallback={<LoginForm />}>
              <SignedInRedirect />
              <Form searchParams={searchParams} />
            </Suspense>
          </div>
          <div style={{ textAlign: 'center' }}>
            <Link href="/" className="auth-back">
              ← Back to store
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

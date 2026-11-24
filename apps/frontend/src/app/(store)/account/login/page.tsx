import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { LoginForm } from '@/components/store/account/account-forms';
import { getCustomer, safeNext } from '@/lib/account/session';

export const metadata: Metadata = { title: 'Sign in', robots: { index: false } };

async function Content({ searchParams }: Pick<PageProps<'/account/login'>, 'searchParams'>) {
  const next = safeNext((await searchParams).next);
  // already signed in: straight on
  if (await getCustomer()) redirect(next);
  return <LoginForm next={next} />;
}

/** glowy account/login */
export default function LoginPage({ searchParams }: PageProps<'/account/login'>) {
  return (
    <section className="account-section">
      <div className="container">
        <Suspense fallback={null}>
          <Content searchParams={searchParams} />
        </Suspense>
      </div>
    </section>
  );
}

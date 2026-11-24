import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { RegisterForm } from '@/components/store/account/account-forms';
import { getCustomer, safeNext } from '@/lib/account/session';

export const metadata: Metadata = { title: 'Create account', robots: { index: false } };

async function Content({ searchParams }: Pick<PageProps<'/account/register'>, 'searchParams'>) {
  const next = safeNext((await searchParams).next);
  if (await getCustomer()) redirect(next);
  return <RegisterForm next={next} />;
}

/** glowy account/register */
export default function RegisterPage({ searchParams }: PageProps<'/account/register'>) {
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

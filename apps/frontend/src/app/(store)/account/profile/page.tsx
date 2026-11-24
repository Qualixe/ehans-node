import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { PasswordForm, ProfileForm } from '@/components/store/account/account-forms';
import { AccountNav } from '@/components/store/account/account-nav';
import { getCustomer } from '@/lib/account/session';

export const metadata: Metadata = { title: 'Profile', robots: { index: false } };

async function Content() {
  const customer = await getCustomer();
  if (!customer) redirect('/account/login?next=/account/profile');
  return (
    <div className="account-layout">
      <AccountNav customer={customer} current="profile" />
      <div style={{ display: 'grid', gap: 24 }}>
        <ProfileForm
          initial={{
            name: customer.name,
            phone: customer.phone,
            email: customer.email ?? '',
            address: customer.address ?? '',
            district: customer.district ?? '',
          }}
        />
        <PasswordForm />
      </div>
    </div>
  );
}

/** glowy account/profile */
export default function ProfilePage() {
  return (
    <section className="account-section">
      <div className="container">
        <Suspense fallback={null}>
          <Content />
        </Suspense>
      </div>
    </section>
  );
}

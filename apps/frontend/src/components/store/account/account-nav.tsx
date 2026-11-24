import type { CustomerProfile } from '@ehans/shared';
import Link from 'next/link';
import { signOut } from '@/lib/account/actions';
import { QcIcon } from '../checkout/qc-icons';

/** glowy account/partials/nav */
export function AccountNav({
  customer,
  current,
}: {
  customer: CustomerProfile;
  current: 'orders' | 'profile';
}) {
  return (
    <aside className="account-nav">
      <div className="account-nav-user">
        <span className="account-avatar" aria-hidden="true">
          {customer.name.charAt(0).toUpperCase()}
        </span>
        <div>
          <p>{customer.name}</p>
          <small>{customer.phone}</small>
        </div>
      </div>
      <nav aria-label="Account" className="account-nav-links">
        <Link href="/account" aria-current={current === 'orders' ? 'page' : undefined}>
          <QcIcon name="bag" /> My orders
        </Link>
        <Link href="/account/profile" aria-current={current === 'profile' ? 'page' : undefined}>
          <QcIcon name="user" /> Profile &amp; address
        </Link>
        <form action={signOut}>
          <button type="submit">
            <QcIcon name="logout" /> Sign out
          </button>
        </form>
      </nav>
    </aside>
  );
}

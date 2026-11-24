import { canView, type DashboardOverview } from '@ehans/shared';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AdminIcon } from '@/components/admin/icon';
import { DashboardView } from '@/components/admin/panel/reports-view';
import { adminHomePath } from '@/lib/admin/menu';
import { adminApi, getCurrentAdmin } from '@/lib/admin/session';

export const metadata: Metadata = { title: 'Dashboard' };

/** Dashboard (order-panel demo): KPIs, money, 7-day orders, alerts, status mix, teams, best sellers. */
export default async function DashboardPage() {
  const user = await getCurrentAdmin();
  // staff without sales figures land on the first section they can use (glowy DashboardController)
  if (!canView(user, 'analytics')) {
    const home = adminHomePath(user);
    if (home !== '/admin') redirect(home);
    return <NoAccess name={user.name} />;
  }
  const data = await adminApi<DashboardOverview>('/reports/dashboard');
  return <DashboardView d={data} ordersHref={canView(user, 'orders')} />;
}

function NoAccess({ name }: { name: string }) {
  return (
    <div className="admin-card mx-auto max-w-xl p-10 text-center">
      <span className="mx-auto grid size-14 place-items-center rounded-full bg-amber-500/10 text-amber-400">
        <AdminIcon name="shield" className="size-7" />
      </span>
      <h1 className="mt-4 text-xl font-bold text-fg">Welcome, {name}</h1>
      <p className="mt-2 text-sm text-slate-400">
        Your account doesn&apos;t have access to any section yet. Ask the store owner to give you
        permissions under <em>Settings → Staff &amp; permissions</em>.
      </p>
      <Link href="/admin/modules/account" className="admin-btn-secondary mt-6">
        My account
      </Link>
    </div>
  );
}

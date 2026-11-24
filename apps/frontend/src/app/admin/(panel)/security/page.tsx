import { canManage, type SecurityOverview } from '@ehans/shared';
import type { Metadata } from 'next';
import { SecurityScreen } from '@/components/admin/panel/ops-pages';
import { adminApi, getCurrentAdmin } from '@/lib/admin/session';

export const metadata: Metadata = { title: 'Fraud & security' };

/** Order protection rules and admin sign-in history. */
export default async function SecurityRoute() {
  const [user, data] = await Promise.all([
    getCurrentAdmin(),
    adminApi<SecurityOverview>('/ops/security'),
  ]);
  return <SecurityScreen data={data} manage={canManage(user, 'orders')} />;
}

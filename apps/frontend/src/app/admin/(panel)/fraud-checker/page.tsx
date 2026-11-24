import { canManage, type FraudCheckerPage } from '@ehans/shared';
import type { Metadata } from 'next';
import { FraudCheckerScreen } from '@/components/admin/panel/ops-pages';
import { adminApi, getCurrentAdmin } from '@/lib/admin/session';

export const metadata: Metadata = { title: 'Fraud checker' };

/** Look up any number's courier history (BD Courier), plus orders waiting to confirm. */
export default async function FraudCheckerRoute() {
  const [user, page] = await Promise.all([
    getCurrentAdmin(),
    adminApi<FraudCheckerPage>('/ops/fraud'),
  ]);
  return <FraudCheckerScreen page={page} manage={canManage(user, 'orders')} />;
}

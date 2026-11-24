import { canManage, type PanelStaff, type PosCatalog } from '@ehans/shared';
import type { Metadata } from 'next';
import { ManualOrders } from '@/components/admin/panel/manual-orders';
import { adminApi, getCurrentAdmin } from '@/lib/admin/session';

export const metadata: Metadata = { title: 'Manual orders' };

/** POS · Manual orders: tap products, take the customer, place a confirmed order. */
export default async function PosPage() {
  const [user, catalog, summary, staff] = await Promise.all([
    getCurrentAdmin(),
    adminApi<PosCatalog>('/pos/catalog'),
    adminApi<{ range: string; orders: number; value: number }[]>('/order-panel/manual-summary'),
    adminApi<PanelStaff[]>('/order-panel/staff'),
  ]);
  return (
    <ManualOrders
      catalog={catalog}
      summary={summary}
      staff={staff}
      me={staff.some((s) => s.id === user.id) ? user.id : ''}
      manage={canManage(user, 'pos') && canManage(user, 'orders')}
    />
  );
}

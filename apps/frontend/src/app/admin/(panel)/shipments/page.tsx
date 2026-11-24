import { canManage, type ShipmentsPage } from '@ehans/shared';
import type { Metadata } from 'next';
import { ShipmentsScreen } from '@/components/admin/panel/ops-pages';
import { adminApi, getCurrentAdmin } from '@/lib/admin/session';

export const metadata: Metadata = { title: 'Courier & COD' };

/** Parcels with couriers, COD in transit and courier payouts to receive. */
export default async function ShipmentsRoute() {
  const [user, data] = await Promise.all([
    getCurrentAdmin(),
    adminApi<ShipmentsPage>('/ops/shipments'),
  ]);
  return <ShipmentsScreen data={data} manage={canManage(user, 'orders')} />;
}

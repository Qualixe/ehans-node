import {
  canManage,
  type IncompletePage,
  type IncompleteState,
  PANEL_DATE_RANGES,
  type PanelDateRange,
  type PanelStaff,
} from '@ehans/shared';
import type { Metadata } from 'next';
import { IncompletePanel } from '@/components/admin/panel/incomplete-panel';
import { adminApi, getCurrentAdmin } from '@/lib/admin/session';

export const metadata: Metadata = { title: 'Incomplete orders' };

const day = (v: unknown) =>
  typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined;

/** Order panel "Incomplete orders": checkouts started but not placed. */
export default async function IncompleteOrdersPage({
  searchParams,
}: PageProps<'/admin/orders/incomplete'>) {
  const sp = await searchParams;
  const state =
    (['all', 'new', 'called', 'recovered'] as const).find((s) => s === sp.state) ?? 'all';
  const date =
    (Object.keys(PANEL_DATE_RANGES) as PanelDateRange[]).find((d) => d === sp.date) ?? 'all';
  const from = day(sp.from);
  const to = day(sp.to);
  const q = new URLSearchParams({ state, date, ...(from ? { from } : {}), ...(to ? { to } : {}) });
  const [user, data, staff] = await Promise.all([
    getCurrentAdmin(),
    adminApi<IncompletePage>(`/incomplete?${q.toString()}`),
    adminApi<PanelStaff[]>('/order-panel/staff'),
  ]);
  return (
    <IncompletePanel
      data={data}
      state={state as IncompleteState | 'all'}
      date={date}
      from={from}
      to={to}
      staff={staff}
      manage={canManage(user, 'orders')}
    />
  );
}

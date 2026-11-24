import {
  canManage,
  ORDER_SOURCES,
  ORDER_STATUSES,
  PANEL_DATE_RANGES,
  type PanelDateRange,
  type PanelFilters,
  type PanelOrdersPage,
  type PanelTab,
} from '@ehans/shared';
import type { Metadata } from 'next';
import { ReadOnlyNotice } from '@/components/admin/feedback';
import { OrdersPanel } from '@/components/admin/panel/orders-panel';
import { adminApi, getCurrentAdmin } from '@/lib/admin/session';

export const metadata: Metadata = { title: 'Orders' };

const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : undefined);
const oneOf = <T extends string>(list: readonly string[], v: unknown) =>
  typeof v === 'string' && list.includes(v) ? (v as T) : undefined;
const date = (v: unknown) =>
  typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined;

/** The order panel: KPIs, status tabs, filters, orders with confirm / courier / fraud / notes. */
export default async function OrdersPage({ searchParams }: PageProps<'/admin/orders'>) {
  const sp = await searchParams;
  const filters: PanelFilters = {
    tab: oneOf<PanelTab>(['all', 'dup', 'blocked', ...ORDER_STATUSES], sp.tab),
    date: oneOf<PanelDateRange>(Object.keys(PANEL_DATE_RANGES), sp.date),
    from: date(sp.from),
    to: date(sp.to),
    assignee:
      typeof sp.assignee === 'string' && /^(none|[0-9a-f-]{36})$/.test(sp.assignee)
        ? sp.assignee
        : undefined,
    courier:
      typeof sp.courier === 'string' && /^[a-z]{2,20}$/.test(sp.courier) ? sp.courier : undefined,
    source: oneOf(['manual', 'recovered', ...ORDER_SOURCES], sp.source),
    q: str(sp.q)?.slice(0, 100),
  };
  const perPage = [20, 50, 100].includes(Number(sp.perPage)) ? Number(sp.perPage) : 50;
  const page = Math.max(1, Number(sp.page) || 1);
  const api = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) if (v) api.set(k, v);
  api.set('perPage', String(perPage));
  if (page > 1) api.set('page', String(page));

  const [user, data] = await Promise.all([
    getCurrentAdmin(),
    adminApi<PanelOrdersPage>(`/order-panel/orders?${api.toString()}`),
  ]);
  const manage = canManage(user, 'orders');
  return (
    <>
      {manage ? null : <ReadOnlyNotice />}
      <OrdersPanel data={data} filters={filters} manage={manage} perPage={perPage} />
    </>
  );
}

import {
  REPORT_PERIODS,
  REPORT_TABS,
  type ReportPage,
  type ReportPeriod,
  type ReportTab,
} from '@ehans/shared';
import type { Metadata } from 'next';
import { ReportsView } from '@/components/admin/panel/reports-view';
import { adminApi } from '@/lib/admin/session';

export const metadata: Metadata = { title: 'Reports' };

/** Reports (order-panel demo): daily P&L, products, districts, sources, couriers, teams, status. */
export default async function ReportsRoute({ searchParams }: PageProps<'/admin/reports'>) {
  const sp = await searchParams;
  const tab: ReportTab =
    typeof sp.tab === 'string' && sp.tab in REPORT_TABS ? (sp.tab as ReportTab) : 'daily';
  const n = Number(sp.days);
  const days: ReportPeriod = (REPORT_PERIODS as readonly number[]).includes(n)
    ? (n as ReportPeriod)
    : 30;
  const report = await adminApi<ReportPage>(`/reports?tab=${tab}&days=${days}`);
  return <ReportsView r={report} />;
}

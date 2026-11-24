import type { TeamPage } from '@ehans/shared';
import type { Metadata } from 'next';
import { TeamScreen } from '@/components/admin/panel/ops-pages';
import { adminApi } from '@/lib/admin/session';

export const metadata: Metadata = { title: 'Team activity' };

/** Who confirmed, cancelled, sent and noted what over the last 30 days. */
export default async function TeamRoute() {
  return <TeamScreen data={await adminApi<TeamPage>('/ops/team')} />;
}

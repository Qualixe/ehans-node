import { type BlockedContactDto, canManage } from '@ehans/shared';
import type { Metadata } from 'next';
import { BlockListScreen } from '@/components/admin/panel/ops-pages';
import { adminApi, getCurrentAdmin } from '@/lib/admin/session';

export const metadata: Metadata = { title: 'Block list' };

/** Blocked phone numbers and IPs (refused at checkout, flagged in orders). */
export default async function BlockListRoute() {
  const [user, list] = await Promise.all([
    getCurrentAdmin(),
    adminApi<BlockedContactDto[]>('/order-panel/blocked'),
  ]);
  return <BlockListScreen list={list} manage={canManage(user, 'orders')} />;
}

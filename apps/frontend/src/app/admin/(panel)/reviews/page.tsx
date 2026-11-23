import {
  type AdminPage,
  type AdminReview,
  type ReviewStatusFilter,
  canManage,
} from '@ehans/shared';
import type { Metadata } from 'next';
import Link from 'next/link';
import { DeleteButton, ReadOnlyNotice } from '@/components/admin/feedback';
import { Pagination } from '@/components/admin/pagination';
import { PageHeader } from '@/components/admin/ui';
import { timeAgo } from '@/lib/admin/format';
import { adminApi, getCurrentAdmin } from '@/lib/admin/session';
import { deleteReview, setReviewApproved } from './actions';

export const metadata: Metadata = { title: 'Reviews' };

const TABS: [ReviewStatusFilter, string][] = [
  ['pending', 'Pending'],
  ['approved', 'Approved'],
  ['all', 'All'],
];

/** glowy admin/reviews/index: approve reviews before they appear on product pages. */
export default async function ReviewsPage({ searchParams }: PageProps<'/admin/reviews'>) {
  const sp = await searchParams;
  const status = TABS.some(([v]) => v === sp.status)
    ? (sp.status as ReviewStatusFilter)
    : 'pending';
  const page = Math.max(1, Number(sp.page) || 1);
  const [user, reviews] = await Promise.all([
    getCurrentAdmin(),
    adminApi<AdminPage<AdminReview>>(`/reviews?status=${status}&page=${page}`),
  ]);
  const manage = canManage(user, 'products');
  const returnTo = `/admin/reviews?status=${status}${page > 1 ? `&page=${page}` : ''}`;

  return (
    <>
      {manage ? null : <ReadOnlyNotice />}
      <PageHeader
        title="Product reviews"
        description="Approve reviews before they appear on product pages."
      />

      <div className="mb-4 flex gap-2">
        {TABS.map(([value, label]) => (
          <Link
            key={value}
            href={`/admin/reviews?status=${value}`}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium ring-1 ${status === value ? 'bg-blue-600 text-white ring-blue-600' : 'text-slate-300 ring-ink-600 hover:bg-ink-800'}`}
          >
            {label}
          </Link>
        ))}
      </div>

      <div className="admin-card divide-y divide-ink-700 overflow-hidden">
        {reviews.items.length ? (
          reviews.items.map((r) => (
            <article key={r.id} className="flex flex-wrap items-start gap-4 p-5">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-amber-400">
                    {'★'.repeat(r.rating)}
                    <span className="text-ink-500">{'★'.repeat(5 - r.rating)}</span>
                  </span>
                  <strong className="text-slate-100">{r.name}</strong>
                  {r.email ? <span className="text-xs text-slate-500">{r.email}</span> : null}
                  <span className="text-xs text-slate-500">· {timeAgo(r.createdAt)}</span>
                </div>
                <p className="mt-2 text-sm text-slate-300">{r.body}</p>
                <p className="mt-2 text-xs text-slate-500">
                  On{' '}
                  <a
                    href={`/products/${r.product.slug}`}
                    target="_blank"
                    rel="noopener"
                    className="admin-link"
                  >
                    {r.product.name}
                  </a>
                </p>
              </div>
              {manage ? (
                <div className="flex items-center gap-2">
                  <form action={setReviewApproved.bind(null, r.id, !r.isApproved, returnTo)}>
                    <button
                      type="submit"
                      className={r.isApproved ? 'admin-btn-secondary' : 'admin-btn-primary'}
                    >
                      {r.isApproved ? 'Hide' : 'Approve'}
                    </button>
                  </form>
                  <DeleteButton
                    action={deleteReview.bind(null, r.id, returnTo)}
                    iconOnly
                    confirm="Delete this review?"
                  />
                </div>
              ) : null}
            </article>
          ))
        ) : (
          <p className="p-12 text-center text-slate-500">No reviews here.</p>
        )}
        <Pagination {...reviews} basePath="/admin/reviews" query={{ status }} />
      </div>
    </>
  );
}

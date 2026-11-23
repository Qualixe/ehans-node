import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { AdminIcon } from '@/components/admin/icon';
import { COMING_SOON } from '@/lib/admin/menu';

export function generateStaticParams() {
  return Object.keys(COMING_SOON).map((module) => ({ module }));
}

async function ModuleName({ params }: { params: PageProps<'/admin/modules/[module]'>['params'] }) {
  const name = COMING_SOON[(await params).module];
  if (!name) notFound();
  return <>{name}</>;
}

/** glowy admin/coming-soon: menu entries whose module is not ported yet. */
export default function ComingSoonPage({ params }: PageProps<'/admin/modules/[module]'>) {
  return (
    <div className="admin-card mx-auto mt-10 max-w-xl p-10 text-center">
      <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20">
        <AdminIcon name="sparkles" className="size-7" />
      </span>
      <h1 className="mt-5 text-2xl font-extrabold text-fg">
        <Suspense fallback="This module">
          <ModuleName params={params} />
        </Suspense>{' '}
        is coming soon
      </h1>
      <p className="mt-2 text-sm leading-6 text-slate-400">
        This module is being ported from the previous admin and will be switched on in a later
        release. Nothing here is saved or sent yet.
      </p>
      <Link href="/admin" className="admin-btn-secondary mt-6">
        Back to dashboard
      </Link>
    </div>
  );
}

import type { AdminNavigation } from '@ehans/shared';
import { Suspense } from 'react';
import { AdminShell } from '@/components/admin/admin-shell';
import { adminApi, getCurrentAdmin } from '@/lib/admin/session';
import { readFlash } from '@/lib/admin/flash';
import { buildMenu, visibleMenu } from '@/lib/admin/menu';

// Every admin screen reads the session (and redirects without one), so the panel can't have a
// prerendered instant shell; opt out of instant-navigation validation (Next 16 auth guide).
export const instant = false;

/** Signed-in chrome: the session is read at request time, so it streams in behind Suspense. */
async function Chrome({ children }: { children: React.ReactNode }) {
  const [user, navigation, flash] = await Promise.all([
    getCurrentAdmin(),
    adminApi<AdminNavigation>('/navigation'),
    readFlash(),
  ]);
  return (
    <AdminShell
      user={user}
      navigation={navigation}
      flash={flash}
      menu={visibleMenu(buildMenu(navigation.counts), user)}
    >
      {children}
    </AdminShell>
  );
}

/** Static shell shown while the session and menu load (same geometry as the real chrome). */
function ShellFallback() {
  return (
    <div className="min-h-full" aria-busy="true">
      <aside className="admin-sidebar fixed inset-y-0 left-0 z-50 hidden w-64 border-r border-ink-700 bg-ink-900 lg:block">
        <div className="h-[68px] border-b border-ink-700"></div>
      </aside>
      <div className="admin-main lg:pl-64">
        <header className="sticky top-0 z-30 h-[68px] border-b border-ink-700 bg-ink-950/85"></header>
        <main className="is-loading px-4 py-6 sm:px-6 lg:px-8 lg:py-8"></main>
      </div>
    </div>
  );
}

export default function PanelLayout({ children }: LayoutProps<'/admin'>) {
  return (
    <Suspense fallback={<ShellFallback />}>
      <Chrome>{children}</Chrome>
    </Suspense>
  );
}

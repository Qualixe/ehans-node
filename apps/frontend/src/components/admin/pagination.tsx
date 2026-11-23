import Link from 'next/link';

/** Laravel's UrlWindow (onEachSide = 3): every page when few, else first 2 … window … last 2. */
export function pageWindow(current: number, last: number): (number | '...')[] {
  const onEachSide = 3;
  if (last < onEachSide * 2 + 8) return Array.from({ length: last }, (_, i) => i + 1);
  const range = (from: number, to: number) =>
    Array.from({ length: to - from + 1 }, (_, i) => from + i);
  const window = onEachSide + 4;
  if (current <= window) return [...range(1, window + onEachSide), '...', last - 1, last];
  if (current > last - window)
    return [1, 2, '...', ...range(last - (window + (onEachSide - 1)), last)];
  return [1, 2, '...', ...range(current - onEachSide, current + onEachSide), '...', last - 1, last];
}

/** glowy vendor/pagination/admin.blade.php. Keeps the other query parameters on every link. */
export function Pagination({
  page,
  pageSize,
  total,
  totalPages,
  basePath,
  query = {},
}: {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  basePath: string;
  query?: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;
  const href = (p: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) if (value) params.set(key, value);
    if (p > 1) params.set('page', String(p));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };
  const first = (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);
  const link = 'rounded-lg px-3 py-1.5 text-slate-300 hover:bg-ink-800 hover:text-fg';

  return (
    <nav
      className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-600 px-4 py-3 text-sm"
      aria-label="Pagination"
    >
      <p className="text-slate-400">
        Showing <span className="font-semibold text-slate-200">{first}</span>–
        <span className="font-semibold text-slate-200">{last}</span> of{' '}
        <span className="font-semibold text-slate-200">{total}</span>
      </p>
      <div className="flex items-center gap-1">
        {page <= 1 ? (
          <span className="rounded-lg px-3 py-1.5 text-slate-600">Prev</span>
        ) : (
          <Link href={href(page - 1)} rel="prev" className={link}>
            Prev
          </Link>
        )}
        {pageWindow(page, totalPages).map((p, i) =>
          p === '...' ? (
            <span key={`gap-${i}`} className="px-2 text-slate-600">
              ...
            </span>
          ) : p === page ? (
            <span
              key={p}
              className="rounded-lg bg-blue-600 px-3 py-1.5 font-semibold text-white"
              aria-current="page"
            >
              {p}
            </span>
          ) : (
            <Link key={p} href={href(p)} className={link}>
              {p}
            </Link>
          ),
        )}
        {page >= totalPages ? (
          <span className="rounded-lg px-3 py-1.5 text-slate-600">Next</span>
        ) : (
          <Link href={href(page + 1)} rel="next" className={link}>
            Next
          </Link>
        )}
      </div>
    </nav>
  );
}

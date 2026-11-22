'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

type Phase = 'idle' | 'loading' | 'done';

/**
 * Thin brand-coloured bar at the top of the page: starts when an internal link is
 * clicked, completes when the new URL has rendered. Must sit inside <Suspense>.
 */
export function RouteProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const url = `${pathname}?${searchParams.toString()}`;
  const [phase, setPhase] = useState<Phase>('idle');
  const lastUrl = useRef(url);
  const timer = useRef<number | undefined>(undefined);

  // start on clicks to same-origin links that change the URL
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
        return;
      const a = (e.target as Element | null)?.closest?.('a');
      if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
      const href = a.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:'))
        return;
      const next = new URL(a.href, window.location.href);
      if (next.origin !== window.location.origin) return;
      if (next.pathname === window.location.pathname && next.search === window.location.search)
        return;
      window.clearTimeout(timer.current);
      setPhase('loading');
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  // finish when the new URL is on screen
  useEffect(() => {
    if (url === lastUrl.current) return;
    lastUrl.current = url;
    setPhase('done');
    timer.current = window.setTimeout(() => setPhase('idle'), 600);
    return () => window.clearTimeout(timer.current);
  }, [url]);

  return (
    <div className={`route-progress${phase === 'idle' ? '' : ` is-${phase}`}`} aria-hidden="true">
      <div className="route-progress-bar" />
    </div>
  );
}

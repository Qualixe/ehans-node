'use client';

import { useSyncExternalStore } from 'react';

const noopSubscribe = () => () => undefined;

/** False during SSR/hydration, true afterwards (safe gate for portals to document.body). */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

/** Live `matchMedia` result; `false` on the server. */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(query);
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** Current year in the browser; `fallback` (the template's hard-coded year) on the server. */
export function useCurrentYear(fallback: number): number {
  return useSyncExternalStore(
    noopSubscribe,
    () => new Date().getFullYear(),
    () => fallback,
  );
}

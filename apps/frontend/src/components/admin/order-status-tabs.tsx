'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { AdminIcon } from './icon';

export interface StatusTab {
  key: string;
  label: string;
  icon: string;
  count: number;
  href: string;
  active: boolean;
}

/**
 * Underlined status tabs (icon, label, count) for the orders list. The strip scrolls sideways
 * on narrow screens; arrow buttons appear when there is more to see.
 */
export function OrderStatusTabs({ tabs }: { tabs: StatusTab[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ left: false, right: false });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () =>
      setEdges({
        left: el.scrollLeft > 4,
        right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4,
      });
    update();
    // keep the active tab in view
    el.querySelector<HTMLElement>('[aria-current="page"]')?.scrollIntoView({
      block: 'nearest',
      inline: 'nearest',
    });
    el.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      el.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  const scroll = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * 240, behavior: 'smooth' });
  const arrow =
    'absolute top-1/2 z-10 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-ink-900 text-slate-300 shadow-md ring-1 ring-ink-600 hover:text-fg';

  return (
    <div className="relative border-b border-ink-600">
      {edges.left ? (
        <button
          type="button"
          className={`${arrow} left-1`}
          aria-label="Scroll tabs left"
          onClick={() => scroll(-1)}
        >
          <svg
            className="size-4 rotate-180"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M7.21 14.77a.75.75 0 01.02-1.06L11.17 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" />
          </svg>
        </button>
      ) : null}
      <div
        ref={ref}
        className="flex gap-1 overflow-x-auto px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <nav className="flex gap-1" aria-label="Order status">
          {tabs.map((t) => (
            <Link
              key={t.key}
              href={t.href}
              aria-current={t.active ? 'page' : undefined}
              className={`-mb-px flex shrink-0 items-center gap-2 border-b-2 px-3.5 py-3 text-sm font-medium whitespace-nowrap transition ${
                t.active
                  ? 'border-blue-600 text-fg'
                  : 'border-transparent text-slate-400 hover:border-ink-500 hover:text-fg'
              }`}
            >
              <AdminIcon
                name={t.icon}
                className={`size-4 ${t.active ? 'text-blue-500' : 'text-slate-500'}`}
              />
              {t.label}
              <span
                className={`min-w-6 rounded-full px-2 py-0.5 text-center text-xs font-semibold ${
                  t.active ? 'bg-blue-600/15 text-blue-500' : 'bg-ink-700 text-slate-400'
                }`}
              >
                {t.count}
              </span>
            </Link>
          ))}
        </nav>
      </div>
      {edges.right ? (
        <button
          type="button"
          className={`${arrow} right-1`}
          aria-label="Scroll tabs right"
          onClick={() => scroll(1)}
        >
          <svg className="size-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path d="M7.21 14.77a.75.75 0 01.02-1.06L11.17 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" />
          </svg>
        </button>
      ) : null}
    </div>
  );
}

'use client';

import type { AdminCrossSellItem } from '@ehans/shared';
import { useEffect, useRef, useState, useTransition } from 'react';
import { money } from '@/lib/admin/format';
import { AdminIcon } from './icon';

const MAX = 6;

/**
 * Picks the products shown in one product-page section ("Buy it with" or "Complete your …"):
 * search the catalog, add, reorder, remove.
 */
export function CrossSellPicker({
  label,
  value,
  onChange,
  search,
  excludeId,
  disabled = false,
}: {
  label: string;
  value: AdminCrossSellItem[];
  onChange: (next: AdminCrossSellItem[]) => void;
  search: (q: string) => Promise<AdminCrossSellItem[]>;
  excludeId?: string;
  disabled?: boolean;
}) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<AdminCrossSellItem[]>([]);
  const [searched, setSearched] = useState('');
  const [pending, startTransition] = useTransition();
  const timer = useRef<number | undefined>(undefined);

  // debounced search while typing
  useEffect(() => {
    window.clearTimeout(timer.current);
    const term = q.trim();
    if (!term) return;
    timer.current = window.setTimeout(() => {
      startTransition(async () => {
        const found = await search(term);
        setResults(found);
        setSearched(term);
      });
    }, 300);
    return () => window.clearTimeout(timer.current);
  }, [q, search]);

  const picked = new Set(value.map((v) => v.id));
  const available = q.trim() ? results.filter((r) => !picked.has(r.id) && r.id !== excludeId) : [];
  const full = value.length >= MAX;
  const move = (from: number, to: number) => {
    const next = [...value];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item!);
    onChange(next);
  };

  return (
    <div>
      <p className="mb-1.5 text-sm text-slate-300">
        {label}{' '}
        <span className="text-xs text-slate-500">
          ({value.length}/{MAX})
        </span>
      </p>
      {value.length ? (
        <ul className="mb-2 divide-y divide-ink-700 rounded-xl border border-ink-600">
          {value.map((item, index) => (
            <li key={item.id} className="flex items-center gap-3 px-3 py-2">
              {item.image ? (
                <img src={item.image} alt="" className="size-9 shrink-0 rounded-lg object-cover" />
              ) : (
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-ink-800 text-slate-500">
                  <AdminIcon name="image" className="size-4" />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-slate-100">{item.name}</p>
                <p className="text-xs text-slate-500">
                  {money(item.price)}
                  {item.isActive ? '' : ' · hidden from the store'}
                </p>
              </div>
              <button
                type="button"
                className="grid size-7 place-items-center rounded-lg text-slate-400 hover:bg-ink-700 hover:text-fg disabled:opacity-30"
                title="Move up"
                disabled={disabled || index === 0}
                onClick={() => move(index, index - 1)}
              >
                <AdminIcon name="arrow-up" className="size-3.5" />
              </button>
              <button
                type="button"
                className="grid size-7 place-items-center rounded-lg text-slate-400 hover:bg-ink-700 hover:text-fg disabled:opacity-30"
                title="Move down"
                disabled={disabled || index === value.length - 1}
                onClick={() => move(index, index + 1)}
              >
                <AdminIcon name="arrow-down" className="size-3.5" />
              </button>
              <button
                type="button"
                className="grid size-7 place-items-center rounded-lg text-slate-400 hover:bg-rose-500/10 hover:text-rose-400"
                title="Remove"
                disabled={disabled}
                onClick={() => onChange(value.filter((v) => v.id !== item.id))}
              >
                <AdminIcon name="x" className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="relative">
        <AdminIcon
          name="search"
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-500"
        />
        <input
          type="search"
          className="admin-input pl-9"
          placeholder={full ? `Up to ${MAX} products` : 'Search products to add…'}
          value={q}
          disabled={disabled || full}
          onChange={(e) => setQ(e.target.value)}
          aria-label={`Search products for ${label}`}
        />
      </div>
      {q.trim() ? (
        <ul className="mt-1 max-h-60 divide-y divide-ink-700 overflow-y-auto rounded-xl border border-ink-600 bg-ink-850">
          {available.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-ink-800"
                disabled={disabled || full}
                onClick={() => {
                  onChange([...value, item]);
                  setQ('');
                  setResults([]);
                }}
              >
                {item.image ? (
                  <img
                    src={item.image}
                    alt=""
                    className="size-8 shrink-0 rounded-lg object-cover"
                  />
                ) : null}
                <span className="min-w-0 flex-1 truncate text-sm text-slate-200">{item.name}</span>
                <span className="text-xs text-slate-400">{money(item.price)}</span>
              </button>
            </li>
          ))}
          {!available.length ? (
            <li className="px-3 py-3 text-center text-xs text-slate-500">
              {pending || searched !== q.trim() ? 'Searching…' : 'No matching products.'}
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}

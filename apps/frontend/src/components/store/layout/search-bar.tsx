'use client';

import type { ProductCard } from '@ehans/shared';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Fragment, type KeyboardEvent, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { getPublicEnv } from '@/lib/env';
import { formatPrice, productUrl } from '@/lib/format';
import { POPULAR_SEARCHES, SEARCH_CATEGORIES } from '@/lib/store-nav';
import { cartActions } from '../providers/cart-store';
import { useStoreUi } from '../providers/store-ui';
import { useIsClient } from '../hooks';
import { CloseIcon } from '../icons';

const RECENT_KEY = 'ehans-mart-recent-search';
const MAX_RESULTS = 6;

function getRecent(): string[] {
  try {
    const v: unknown = JSON.parse(window.localStorage.getItem(RECENT_KEY) ?? '[]');
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function saveRecent(term: string): void {
  const t = term.trim();
  if (t.length < 2) return;
  const list = [t, ...getRecent().filter((x) => x.toLowerCase() !== t.toLowerCase())].slice(0, 6);
  try {
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

const TagIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M7.3 12.7a5.3 5.3 0 1 0 0-10.7 5.3 5.3 0 0 0 0 10.7ZM14 14l-2.9-2.9"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);
const ClockIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <circle cx="8" cy="8" r="6.2" stroke="currentColor" strokeWidth="1.4" />
    <path d="M8 4.8V8l2.2 1.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);
const CartIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="9" cy="20" r="1" />
    <circle cx="18" cy="20" r="1" />
    <path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 1.9-1.4L21 8H6" />
  </svg>
);

function Highlight({ text, query }: { text: string; query: string }) {
  const words = query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (!words.length) return <>{text}</>;
  const parts = text.split(new RegExp(`(${words.join('|')})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        words.some((w) => new RegExp(`^${w}$`, 'i').test(part)) ? (
          <mark key={i}>{part}</mark>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}

type Results = { query: string; items: ProductCard[]; total: number } | null;

export function SearchBar() {
  const { panel, closePanel, searchQuery } = useStoreUi();
  const open = panel === 'search';
  const router = useRouter();
  const mounted = useIsClient();
  const [query, setQueryState] = useState('');
  const [fetched, setFetched] = useState<Results>(null);
  const [recent, setRecent] = useState<string[]>([]);
  const [focusIndex, setFocusIndex] = useState(-1);
  const [addedId, setAddedId] = useState<string | null>(null);
  const [wasOpen, setWasOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const setQuery = (value: string) => {
    setQueryState(value);
    setFocusIndex(-1);
  };

  // opening: refresh recent searches and apply a query passed by openSearch(query)
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setRecent(getRecent());
      setQuery(searchQuery);
    }
  }

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 150);
    return () => window.clearTimeout(t);
  }, [open]);

  // while the next response is in flight keep showing the previous results (no flicker)
  const results = query.trim() ? fetched : null;

  // debounced search against the catalog API
  useEffect(() => {
    const q = query.trim();
    if (!q) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const base = getPublicEnv().NEXT_PUBLIC_API_URL.replace(/\/$/, '');
        const res = await fetch(`${base}/catalog/search?q=${encodeURIComponent(q)}&limit=20`, {
          signal: controller.signal,
        });
        const items = res.ok ? ((await res.json()) as ProductCard[]) : [];
        setFetched({ query: q, items: items.slice(0, MAX_RESULTS), total: items.length });
      } catch (e) {
        if ((e as Error).name !== 'AbortError') setFetched({ query: q, items: [], total: 0 });
      }
    }, 120);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query]);

  const fill = (term: string) => {
    setQuery(term);
    inputRef.current?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const items = results?.items ?? [];
    if (!items.length || (e.key !== 'ArrowDown' && e.key !== 'ArrowUp')) return;
    e.preventDefault();
    setFocusIndex((i) => (i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length);
  };

  const view = !query.trim()
    ? 'default'
    : results && results.items.length
      ? 'results'
      : results
        ? 'empty'
        : 'default';

  const content = (
    <div className={`search-bar-wrap${open ? ' active' : ''}`}>
      <button className="search-bar-window-cls-btn" onClick={closePanel}></button>
      <div className="search-bar">
        <div className="search-bar-top">
          <form
            className="search-form"
            onSubmit={(e) => {
              e.preventDefault();
              const items = results?.items ?? [];
              if (!items.length) return;
              saveRecent(query);
              router.push(productUrl(items[Math.max(focusIndex, 0)]!.slug));
            }}
          >
            <div className="search-field">
              <span className="icon">
                <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path
                    d="M7.33333 12.6667C10.2789 12.6667 12.6667 10.2789 12.6667 7.33333C12.6667 4.38781 10.2789 2 7.33333 2C4.38781 2 2 4.38781 2 7.33333C2 10.2789 4.38781 12.6667 7.33333 12.6667Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  ></path>
                  <path
                    d="M14 14L11.1 11.1"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  ></path>
                </svg>
              </span>{' '}
              <input
                ref={inputRef}
                type="search"
                className="search-input"
                placeholder="Search products..."
                autoComplete="off"
                aria-label="search products"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
              />{' '}
              <button
                className="search-input-clear"
                type="button"
                aria-label="clear search"
                hidden={!query}
                onClick={() => fill('')}
              >
                <svg width="10" height="10" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                  <path
                    d="M3 15L15 3M15 15L3 3"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  ></path>
                </svg>
              </button>
            </div>
          </form>
          <button className="search-bar-close" onClick={closePanel}>
            <CloseIcon size={16} />
          </button>
        </div>
        <div className="search-bar-btm">
          <div className="search-default" hidden={view !== 'default'}>
            <div className="search-block search-recent" hidden={recent.length === 0}>
              <div className="search-block-head">
                <p className="search-block-title">recent searches</p>
                <button
                  className="search-recent-clear"
                  type="button"
                  onClick={() => {
                    try {
                      window.localStorage.removeItem(RECENT_KEY);
                    } catch {
                      /* ignore */
                    }
                    setRecent([]);
                  }}
                >
                  clear
                </button>
              </div>
              <div className="search-tags search-recent-tags">
                {recent.map((t) => (
                  <button key={t} type="button" onClick={() => fill(t)}>
                    <ClockIcon />
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="search-block">
              <p className="search-block-title">popular searches</p>
              <div className="search-tags search-popular-tags">
                {POPULAR_SEARCHES.map((t) => (
                  <button key={t} type="button" onClick={() => fill(t)}>
                    <TagIcon />
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="search-block">
              <p className="search-block-title">shop by category</p>
              <div className="search-categories">
                {SEARCH_CATEGORIES.map((c) => (
                  <Link key={c.href} href={c.href} className="search-category">
                    <div className="search-category-img">
                      {c.image ? <img src={c.image} alt="" loading="lazy" /> : null}
                    </div>
                    <div className="search-category-content">
                      <p className="title">{c.label}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
          <div className="search-results" hidden={view !== 'results'}>
            <p className="search-results-count">
              <strong>{results?.total ?? 0}</strong> product{(results?.total ?? 0) > 1 ? 's' : ''}{' '}
              found for “{results?.query}”
            </p>
            <div className="search-result-items" role="listbox">
              {(results?.items ?? []).map((p, i) => (
                <Link
                  key={p.id}
                  href={productUrl(p.slug)}
                  className={`search-result-item${i === focusIndex ? ' focused' : ''}`}
                  role="option"
                  aria-selected={i === focusIndex}
                  onClick={() => saveRecent(query)}
                >
                  <div className="search-result-img">
                    {p.image ? <img src={p.image.url} alt={p.name} loading="lazy" /> : null}
                  </div>
                  <div className="search-result-content">
                    <p className="search-result-category">{p.category.name}</p>
                    <p className="search-result-title">
                      <Highlight text={p.name} query={query} />
                    </p>
                    <div className="search-result-price">
                      <span className="curr">{formatPrice(p.price)}</span>
                      {p.discountPercent ? (
                        <>
                          <span className="prev">{formatPrice(p.compareAtPrice ?? 0)}</span>
                          <span className="off">-{p.discountPercent}%</span>
                        </>
                      ) : null}
                    </div>
                  </div>
                  <button
                    className={`search-result-add${addedId === p.id ? ' added' : ''}`}
                    type="button"
                    aria-label="add to cart"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      saveRecent(query);
                      cartActions.add({
                        id: p.id,
                        productId: p.id,
                        title: p.name,
                        img: p.image?.url ?? '',
                        price: p.price,
                        url: productUrl(p.slug),
                      });
                      setAddedId(p.id);
                      window.setTimeout(() => setAddedId(null), 1200);
                    }}
                  >
                    <CartIcon />
                  </button>
                </Link>
              ))}
            </div>
            <Link
              href={`/collections?q=${encodeURIComponent(query.trim())}`}
              className="btn search-view-all"
              onClick={() => saveRecent(query)}
            >
              view all results
            </Link>
          </div>
          <div className="search-empty" hidden={view !== 'empty'}>
            <p className="search-empty-title">No products found</p>
            <p className="search-empty-text">
              Try a different word, or browse a popular search below.
            </p>
            <div className="search-tags search-empty-tags">
              {POPULAR_SEARCHES.map((t) => (
                <button key={t} type="button" onClick={() => fill(t)}>
                  <TagIcon />
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // the header uses transform, so fixed popups must live on <body> (as the template does)
  return mounted ? createPortal(content, document.body) : null;
}

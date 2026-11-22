'use client';

import type { CategorySummary, ProductCard as ProductCardData } from '@ehans/shared';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { collectionUrl } from '@/lib/format';
import { ProductCard } from '../product-card';

type Sort = 'featured' | 'price-asc' | 'price-desc' | 'title-asc';
type GroupKey = 'availability' | 'category';
interface FilterState {
  availability: string[];
  category: string[];
  min: number;
  max: number;
}

const availabilityOf = (p: ProductCardData) => (p.inStock ? 'in-stock' : 'out-of-stock');

function Accordion({
  title,
  counter,
  children,
}: {
  title: string;
  counter: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [height, setHeight] = useState<string>('0px');
  const contentRef = useRef<HTMLDivElement>(null);
  return (
    <div className={`filter-accordion-item${open ? ' active' : ''}`}>
      <button
        className="filter-accordion-btn"
        type="button"
        aria-expanded={open}
        onClick={() => {
          const el = contentRef.current;
          const full = `${el?.scrollHeight ?? 0}px`;
          setHeight(full);
          if (open) requestAnimationFrame(() => setHeight('0px'));
          setOpen(!open);
        }}
      >
        <span className="filter-accordion-title">
          {title} <span className="filter-accordion-counter">{counter ? `(${counter})` : ''}</span>
        </span>
      </button>
      <div
        className="filter-accordion-content"
        ref={contentRef}
        style={{ height }}
        onTransitionEnd={() => {
          if (open) setHeight('auto');
        }}
      >
        <div className="filter-accordion-content-inner">{children}</div>
      </div>
    </div>
  );
}

/**
 * Template collection page body: filter sidebar (availability / price / category with
 * live counts), sort select and product grid. Filtering runs in the browser over the
 * collection's products, exactly like the template.
 */
export function CollectionView({
  products,
  categoryOptions,
  promo,
}: {
  products: ProductCardData[];
  /** Sub-categories (or top categories) offered in the Category filter. */
  categoryOptions: (CategorySummary & { memberIds: string[] })[];
  promo: CategorySummary | null;
}) {
  const prices = products.map((p) => p.price);
  const priceMin = prices.length ? Math.floor(Math.min(...prices) / 10) * 10 : 0;
  const priceMax = prices.length ? Math.ceil(Math.max(...prices) / 10) * 10 : 0;

  const [state, setState] = useState<FilterState>({
    availability: [],
    category: [],
    min: priceMin,
    max: priceMax,
  });
  const [inputs, setInputs] = useState({ min: String(priceMin), max: String(priceMax) });
  const [sort, setSort] = useState<Sort>('featured');
  const [drawer, setDrawer] = useState(false);

  useEffect(() => {
    document.body.classList.toggle('active', drawer);
    if (!drawer) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setDrawer(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [drawer]);

  const categoryOf = useMemo(() => {
    const map = new Map<string, string>();
    for (const opt of categoryOptions) for (const id of opt.memberIds) map.set(id, opt.slug);
    return (p: ProductCardData) => map.get(p.category.id) ?? p.category.slug;
  }, [categoryOptions]);

  const valueOf = (p: ProductCardData, key: GroupKey) =>
    key === 'availability' ? availabilityOf(p) : categoryOf(p);
  const matches = (p: ProductCardData, s: FilterState, skip?: GroupKey | 'price') =>
    (['availability', 'category'] as GroupKey[]).every(
      (k) => k === skip || !s[k].length || s[k].includes(valueOf(p, k)),
    ) &&
    (skip === 'price' || (p.price >= s.min && p.price <= s.max));

  const visible = products.filter((p) => matches(p, state));
  const sorted = [...visible].sort((a, b) => {
    if (sort === 'price-asc') return a.price - b.price;
    if (sort === 'price-desc') return b.price - a.price;
    if (sort === 'title-asc') return a.name.localeCompare(b.name);
    return 0;
  });

  const priceActive = Number(state.min > priceMin || state.max < priceMax);
  const activeTotal = state.availability.length + state.category.length + priceActive;
  const span = priceMax - priceMin || 1;

  const toggle = (key: GroupKey, value: string) =>
    setState((s) => ({
      ...s,
      [key]: s[key].includes(value) ? s[key].filter((v) => v !== value) : [...s[key], value],
    }));

  const setRange = (min: number, max: number) => {
    setState((s) => ({ ...s, min, max }));
    setInputs({ min: String(min), max: String(max) });
  };

  const option = (key: GroupKey, value: string, label: string) => {
    const n = products.filter((p) => valueOf(p, key) === value && matches(p, state, key)).length;
    const checked = state[key].includes(value);
    const id = `f-${key}-${value}`;
    return (
      <li key={value} className="filter-list-item">
        <input
          className="filter-checkbox"
          id={id}
          type="checkbox"
          name={key}
          value={value}
          checked={checked}
          disabled={n === 0 && !checked}
          onChange={() => toggle(key, value)}
        />
        <label className="filter-label" htmlFor={id}>
          {label} <span className="filter-count">({n})</span>
        </label>
      </li>
    );
  };

  return (
    <section className="collection-section">
      <div className="container">
        <div className="collection-wrapper">
          <div className={`collection-filter${drawer ? ' active' : ''}`}>
            <span className="filter-window-close-btn" onClick={() => setDrawer(false)}></span>
            <div className="filter-box">
              <div className="filter-sidebar-heading">
                <p className="filter-sidebar-title">Filter</p>
                <button
                  className="filter-close-btn"
                  type="button"
                  aria-label="close filter"
                  onClick={() => setDrawer(false)}
                >
                  <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                    <path
                      d="M3 15L15 3M15 15L3 3"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    ></path>
                  </svg>
                </button>
              </div>
              <form
                className="filter-form"
                onReset={(e) => {
                  e.preventDefault();
                  setState({ availability: [], category: [], min: priceMin, max: priceMax });
                  setInputs({ min: String(priceMin), max: String(priceMax) });
                }}
              >
                <div className="filter-accordion">
                  <Accordion title="Availability" counter={state.availability.length}>
                    <ul className="filter-list">
                      {option('availability', 'in-stock', 'In stock')}
                      {option('availability', 'out-of-stock', 'Out of stock')}
                    </ul>
                  </Accordion>
                  <Accordion title="Price" counter={priceActive}>
                    <div className="filter-price">
                      <div className="filter-price-inputs">
                        <label className="filter-price-field">
                          <span>Tk</span>
                          <input
                            className="filter-price-min"
                            type="number"
                            min={priceMin}
                            max={priceMax}
                            value={inputs.min}
                            aria-label="minimum price"
                            onChange={(e) => setInputs((i) => ({ ...i, min: e.target.value }))}
                            onBlur={() => {
                              let min = Math.max(
                                priceMin,
                                Math.min(Number(inputs.min) || priceMin, priceMax),
                              );
                              let max = state.max;
                              if (min > max) [min, max] = [max, min];
                              setRange(min, max);
                            }}
                          />
                        </label>
                        <span className="filter-price-sep">–</span>
                        <label className="filter-price-field">
                          <span>Tk</span>
                          <input
                            className="filter-price-max"
                            type="number"
                            min={priceMin}
                            max={priceMax}
                            value={inputs.max}
                            aria-label="maximum price"
                            onChange={(e) => setInputs((i) => ({ ...i, max: e.target.value }))}
                            onBlur={() => {
                              let max = Math.max(
                                priceMin,
                                Math.min(Number(inputs.max) || priceMax, priceMax),
                              );
                              let min = state.min;
                              if (min > max) [min, max] = [max, min];
                              setRange(min, max);
                            }}
                          />
                        </label>
                      </div>
                      <div
                        className="filter-price-range"
                        style={
                          {
                            '--range-min': `${((state.min - priceMin) / span) * 100}%`,
                            '--range-max': `${((state.max - priceMin) / span) * 100}%`,
                          } as React.CSSProperties
                        }
                      >
                        <input
                          className="filter-range filter-range-min"
                          type="range"
                          min={priceMin}
                          max={priceMax}
                          value={state.min}
                          tabIndex={-1}
                          aria-label="minimum price"
                          onChange={(e) =>
                            setRange(Math.min(Number(e.target.value), state.max), state.max)
                          }
                        />
                        <input
                          className="filter-range filter-range-max"
                          type="range"
                          min={priceMin}
                          max={priceMax}
                          value={state.max}
                          tabIndex={-1}
                          aria-label="maximum price"
                          onChange={(e) =>
                            setRange(state.min, Math.max(Number(e.target.value), state.min))
                          }
                        />
                      </div>
                    </div>
                  </Accordion>
                  {categoryOptions.length > 1 ? (
                    <Accordion title="Category" counter={state.category.length}>
                      <ul className="filter-list">
                        {categoryOptions.map((c) => option('category', c.slug, c.name))}
                      </ul>
                    </Accordion>
                  ) : null}
                </div>
                <div className="filter-actions">
                  <button className="btn filter-reset-btn" type="reset">
                    clear all
                  </button>
                  <button
                    className="btn filter-apply-btn"
                    type="button"
                    onClick={() => setDrawer(false)}
                  >
                    show results
                  </button>
                </div>
              </form>
              {promo ? (
                <Link href={collectionUrl(promo.slug)} className="filter-media-card">
                  {promo.image ? <img src={promo.image} alt={promo.name} loading="lazy" /> : null}
                  <div className="filter-media-card-content">
                    <p className="filter-media-card-title">{promo.name}</p>
                    <span className="filter-media-card-link">see all products</span>
                  </div>
                </Link>
              ) : null}
            </div>
          </div>
          <div className="collection-content">
            <div className="collection-top">
              <div className="collection-filter-btn">
                <span
                  className="filter-open-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDrawer(true);
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 19.61 18.75"
                    style={{ fill: '#fff', width: '20px' }}
                  >
                    <g>
                      <path d="M0,2.89c0,.23.18.41.41.41h3.73c.32,1.04,1.28,1.81,2.43,1.81s2.11-.76,2.43-1.81h10.2c.23,0,.41-.18.41-.41v-.68c0-.23-.18-.41-.41-.41h-10.2c-.32-1.04-1.28-1.81-2.43-1.81s-2.11.76-2.43,1.81H.41c-.23,0-.41.18-.41.41v.68ZM6.57,1.5c.58,0,1.06.47,1.06,1.06s-.47,1.06-1.06,1.06-1.06-.47-1.06-1.06.47-1.06,1.06-1.06Z"></path>
                      <path d="M.41,10.12h9.08c.32,1.04,1.28,1.81,2.43,1.81s2.11-.76,2.43-1.81h4.85c.23,0,.41-.18.41-.41v-.68c0-.23-.18-.41-.41-.41h-4.85c-.32-1.04-1.28-1.81-2.43-1.81s-2.11.76-2.43,1.81H.41c-.23,0-.41.18-.41.41v.68c0,.23.18.41.41.41ZM11.92,8.32c.58,0,1.06.47,1.06,1.06s-.47,1.06-1.06,1.06-1.06-.47-1.06-1.06.47-1.06,1.06-1.06Z"></path>
                      <path d="M19.61,15.85c0-.23-.18-.41-.41-.41h-10.2c-.32-1.04-1.28-1.81-2.43-1.81s-2.11.76-2.43,1.81H.41c-.23,0-.41.18-.41.41v.68c0,.23.18.41.41.41h3.73c.32,1.04,1.28,1.81,2.43,1.81s2.11-.76,2.43-1.81h10.2c.23,0,.41-.18.41-.41v-.68ZM6.57,17.25c-.58,0-1.06-.47-1.06-1.06s.47-1.06,1.06-1.06,1.06.47,1.06,1.06-.47,1.06-1.06,1.06Z"></path>
                    </g>
                  </svg>{' '}
                  Filter <span className="filter-open-count">{activeTotal || ''}</span>
                </span>
                <p className="collection-product-count">
                  {visible.length} product{visible.length === 1 ? '' : 's'}
                </p>
              </div>
              <div className="filter-select-field">
                <label className="filter-select-field-label" htmlFor="sort_by">
                  Sort by
                </label>
                <select
                  name="sort_by"
                  id="sort_by"
                  value={sort}
                  onChange={(e) => setSort(e.target.value as Sort)}
                >
                  <option value="featured">Featured</option>
                  <option value="price-asc">Price, low to high</option>
                  <option value="price-desc">Price, high to low</option>
                  <option value="title-asc">Alphabetically, A-Z</option>
                </select>
                <span className="filter-select-field-icon">
                  <svg
                    aria-hidden="true"
                    focusable="false"
                    className="icon icon-caret"
                    viewBox="0 0 10 6"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M9.354.646a.5.5 0 00-.708 0L5 4.293 1.354.646a.5.5 0 00-.708.708l4 4a.5.5 0 00.708 0l4-4a.5.5 0 000-.708z"
                      fill="currentColor"
                    ></path>
                  </svg>
                </span>
              </div>
            </div>
            <div className="product-items">
              {sorted.map((p) => (
                <div
                  key={p.id}
                  className="product-item"
                  data-category={categoryOf(p)}
                  data-availability={availabilityOf(p)}
                >
                  <ProductCard product={p} />
                </div>
              ))}
              {!sorted.length ? (
                <p className="collection-empty">No products match these filters.</p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

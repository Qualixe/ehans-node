'use client';

import type {
  HomeProductGrid,
  ProductCard as ProductCardData,
  ProductListResponse,
} from '@ehans/shared';
import { useRouter } from 'next/navigation';
import { useId, useState } from 'react';
import { apiFetch } from '@/lib/api-client';
import { ProductCard } from '../product-card';

function SkeletonItem() {
  return (
    <li className="product-card-grid__item product-card-grid__item--skeleton" aria-hidden="true">
      <div className="card-skeleton">
        <div className="card-skeleton__block card-skeleton__image"></div>
        <div className="card-skeleton__content">
          <div className="card-skeleton__block card-skeleton__line"></div>
          <div className="card-skeleton__block card-skeleton__line card-skeleton__line--short"></div>
          <div className="card-skeleton__block card-skeleton__button"></div>
        </div>
      </div>
    </li>
  );
}

/**
 * Live home "Trending Items" section (`.product-card-grid`): the first page is server
 * rendered; "Show more" appends the next page with skeleton cards while it loads.
 */
export function TrendingGrid({ grid }: { grid: HomeProductGrid }) {
  const router = useRouter();
  const gridId = `ProductCardGrid-${useId().replace(/:/g, '')}`;
  const [items, setItems] = useState<ProductCardData[]>(grid.items);
  const [firstNew, setFirstNew] = useState(grid.items.length);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(grid.total);

  const remaining = Math.max(0, total - items.length);

  async function showMore(e: React.MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        category: grid.category.slug,
        sort: 'manual',
        pageSize: String(grid.pageSize),
        page: String(page + 1),
      });
      const next = await apiFetch<ProductListResponse>(`/catalog/products?${params.toString()}`);
      const seen = new Set(items.map((p) => p.id));
      setFirstNew(items.length);
      setItems([...items, ...next.items.filter((p) => !seen.has(p.id))]);
      setTotal(next.total);
      setPage(next.page);
    } catch {
      // same fallback as the live script: navigate to the collection
      router.push(`/collections/${grid.category.slug}`);
    } finally {
      setLoading(false);
    }
  }

  if (!items.length) return null;

  return (
    <section className="product-card-grid">
      <div className="container">
        <div className="card-slider-section-heading">
          <h2 className="title">{grid.title}</h2>
        </div>
        <ul
          className="product-card-grid__items list-unstyled"
          id={gridId}
          role="list"
          aria-busy={loading ? 'true' : undefined}
        >
          {items.map((p, i) => (
            <li
              key={p.id}
              className={`product-card-grid__item${i >= firstNew ? ' product-card-grid__item--new' : ''}`}
            >
              <ProductCard product={p} />
            </li>
          ))}
          {loading
            ? Array.from({ length: Math.min(grid.pageSize, remaining) }, (_, i) => (
                <SkeletonItem key={`skeleton-${i}`} />
              ))
            : null}
        </ul>
        <div
          className="product-card-grid__more"
          data-product-grid-more=""
          style={
            {
              '--product-grid-progress': (items.length / Math.max(1, total)).toFixed(3),
            } as React.CSSProperties
          }
        >
          <p className="product-card-grid__status visually-hidden" role="status">
            Showing {items.length} of {total} products
          </p>
          <div className="product-card-grid__progress" aria-hidden="true">
            <span className="product-card-grid__progress-bar"></span>
          </div>
          {remaining > 0 ? (
            <a
              href={`/collections/${grid.category.slug}`}
              className="product-card-grid__more-btn"
              aria-controls={gridId}
              aria-busy={loading ? 'true' : undefined}
              onClick={showMore}
            >
              <span className="product-card-grid__more-label">Show more</span>{' '}
              <span className="product-card-grid__more-icon" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M5 9.01266L6.0219 8L12 13.9747L17.9781 8L19 9.01266L12 16L5 9.01266Z"
                    fill="currentColor"
                  ></path>
                </svg>
              </span>{' '}
              <span className="product-card-grid__more-spinner" aria-hidden="true"></span>
            </a>
          ) : null}
        </div>
      </div>
    </section>
  );
}

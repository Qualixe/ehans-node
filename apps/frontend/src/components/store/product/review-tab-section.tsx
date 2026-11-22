'use client';

import { useState } from 'react';

const Star = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
    <path
      d="M10 1.5 12.47 6.5 18 7.3 14 11.2 14.94 16.7 10 14 5.06 16.7 6 11.2 2 7.3 7.53 6.5 10 1.5Z"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinejoin="round"
    ></path>
  </svg>
);

interface Summary {
  score: number;
  count: number;
}

function Panel({
  id,
  active,
  summary,
  allLabel,
  wrapScore,
}: {
  id: string;
  active: boolean;
  summary: Summary;
  allLabel: string;
  wrapScore: boolean;
}) {
  const content = (
    <>
      <p className="review-summary-meta-text">
        Based on <strong>{summary.count} Reviews</strong>
      </p>
      <div className="review-summary-stars">
        {Array.from({ length: 5 }, (_, i) => (
          <Star key={i} />
        ))}
      </div>
    </>
  );
  return (
    <div className={`review-tab-panel${active ? ' active' : ''}`} id={id}>
      <div className="review-summary-card">
        <div className="review-summary-left">
          <p className="review-summary-score">{summary.score.toFixed(1)}</p>
          {wrapScore ? (
            <div className="review-summary-content">{content}</div>
          ) : (
            <div>{content}</div>
          )}
        </div>
        <div className="review-summary-btn">
          {/* reviews module (submission + moderation) is ported with the glowy admin */}
          <a href="#product-review" className="btn">
            Write a review
          </a>
        </div>
      </div>
      <div className="review-summary-divider"></div>
      <div className="review-all-link-wrap">
        <a href="#product-review" className="review-all-link">
          {allLabel} <span>›</span>
        </a>
      </div>
    </div>
  );
}

/** Template "Ratings & Reviews" section with product / category tabs. */
export function ReviewTabSection({ product, category }: { product: Summary; category: Summary }) {
  const [tab, setTab] = useState<'product' | 'category'>('product');
  return (
    <section className="review-tab-section" id="product-review">
      <div className="container">
        <h2 className="review-tab-section-title">Ratings & Reviews</h2>
        <div className="review-tab-nav">
          <button
            className={`review-tab-nav-item${tab === 'product' ? ' active' : ''}`}
            type="button"
            onClick={() => setTab('product')}
          >
            Product Reviews
          </button>{' '}
          <button
            className={`review-tab-nav-item${tab === 'category' ? ' active' : ''}`}
            type="button"
            onClick={() => setTab('category')}
          >
            Category Reviews
          </button>
        </div>
        <div className="review-tab-panels">
          <Panel
            id="product-reviews"
            active={tab === 'product'}
            summary={product}
            allLabel="Read All Product Reviews"
            wrapScore
          />
          <Panel
            id="category-reviews"
            active={tab === 'category'}
            summary={category}
            allLabel="Read All Category Reviews"
            wrapScore={false}
          />
        </div>
      </div>
    </section>
  );
}

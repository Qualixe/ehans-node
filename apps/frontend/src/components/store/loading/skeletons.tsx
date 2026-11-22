/** Shimmer placeholders shaped like the template sections (shown while data streams in). */

import { HOME_GRID_TITLE } from '@ehans/shared';

const Block = ({ className = '', style }: { className?: string; style?: React.CSSProperties }) => (
  <span className={`skeleton ${className}`} style={style} aria-hidden="true" />
);

export function CardSkeleton() {
  return (
    <div className="skeleton-card">
      <Block className="skeleton-square" style={{ borderRadius: 0 }} />
      <div className="skeleton-card-body">
        <Block className="skeleton-text" style={{ width: '90%' }} />
        <Block className="skeleton-text" style={{ width: '55%' }} />
        <Block className="skeleton-btn" style={{ height: 44, marginBottom: 0 }} />
      </div>
    </div>
  );
}

/** Home category row (live `.category-section`, no heading). */
export function CategoryRowSkeleton() {
  return (
    <div className="category-section" aria-busy="true" aria-label="Loading categories">
      <div className="container">
        <div className="category-wrapper">
          <div className="category-slider-wrapper">
            <div className="swiper category-slider">
              <div className="swiper-wrapper">
                {Array.from({ length: 10 }, (_, i) => (
                  <div key={i} className="swiper-slide">
                    <div className="category-item">
                      <div className="img">
                        <Block className="skeleton-square" style={{ borderRadius: 'inherit' }} />
                      </div>
                      <div className="content">
                        <Block className="skeleton-text" style={{ width: 70, margin: '0 auto' }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Home "Trending Items" grid while loading (live theme `.card-skeleton` cards). */
export function TrendingGridSkeleton() {
  return (
    <section className="product-card-grid" aria-busy="true" aria-label="Loading products">
      <div className="container">
        <div className="card-slider-section-heading">
          <h2 className="title">{HOME_GRID_TITLE}</h2>
        </div>
        <ul className="product-card-grid__items list-unstyled" role="list">
          {Array.from({ length: 10 }, (_, i) => (
            <li key={i} className="product-card-grid__item product-card-grid__item--skeleton">
              <div className="card-skeleton">
                <div className="card-skeleton__block card-skeleton__image"></div>
                <div className="card-skeleton__content">
                  <div className="card-skeleton__block card-skeleton__line"></div>
                  <div className="card-skeleton__block card-skeleton__line card-skeleton__line--short"></div>
                  <div className="card-skeleton__block card-skeleton__button"></div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** Product page: gallery with thumbnails on the left, details on the right. */
export function ProductPageSkeleton() {
  return (
    <section className="product-section" aria-busy="true" aria-label="Loading product">
      <div className="container">
        <div className="product-page-content-wrap skeleton-product">
          <div className="product-slider-area">
            <div className="skeleton-gallery">
              <div className="skeleton-thumbs">
                {Array.from({ length: 5 }, (_, i) => (
                  <Block key={i} />
                ))}
              </div>
              <Block className="skeleton-square" style={{ borderRadius: 12 }} />
            </div>
          </div>
          <div className="product-content-area skeleton-info">
            <Block className="skeleton-text" style={{ height: 30, width: '100%' }} />
            <Block className="skeleton-text" style={{ height: 40, width: '100%', marginTop: 16 }} />
            <Block className="skeleton-text" style={{ width: '45%', marginTop: 16 }} />
            <Block className="skeleton-title" style={{ width: '85%' }} />
            <Block className="skeleton-text" style={{ width: '35%', height: 20 }} />
            <Block className="skeleton-text" style={{ width: '100%', height: 8, marginTop: 16 }} />
            <Block className="skeleton-text" style={{ width: '40%', margin: '22px auto 16px' }} />
            {Array.from({ length: 3 }, (_, i) => (
              <Block key={i} className="skeleton-btn" style={{ height: 64 }} />
            ))}
            <Block className="skeleton-btn" />
            <Block className="skeleton-btn" />
          </div>
        </div>
      </div>
    </section>
  );
}

/** Collection page: category header + product grid. */
export function CollectionPageSkeleton() {
  return (
    <>
      <section
        className="category-section collection-category"
        aria-busy="true"
        aria-label="Loading collection"
      >
        <div className="container">
          <div className="category-section-heading">
            <h1 className="title h5">
              <Block
                className="skeleton-text"
                style={{ display: 'inline-block', width: 200, marginBottom: 0 }}
              />
            </h1>
          </div>
          <div className="category-wrapper">
            <div className="category-slider-wrapper">
              <div className="swiper collection-category-slider">
                <div className="swiper-wrapper">
                  {Array.from({ length: 10 }, (_, i) => (
                    <div key={i} className="swiper-slide">
                      <div className="category-item">
                        <div className="img">
                          <Block className="skeleton-square" style={{ borderRadius: 'inherit' }} />
                        </div>
                        <div className="content">
                          <Block
                            className="skeleton-text"
                            style={{ width: 70, margin: '0 auto' }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="collection-section">
        <div className="container">
          <div className="collection-wrapper">
            <div className="collection-content" style={{ width: '100%' }}>
              <div className="collection-top">
                <Block
                  className="skeleton-text"
                  style={{ width: 120, height: 36, marginBottom: 0 }}
                />
                <Block
                  className="skeleton-text"
                  style={{ width: 200, height: 36, marginBottom: 0 }}
                />
              </div>
              <div className="product-items">
                {Array.from({ length: 8 }, (_, i) => (
                  <div key={i} className="product-item">
                    <CardSkeleton />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

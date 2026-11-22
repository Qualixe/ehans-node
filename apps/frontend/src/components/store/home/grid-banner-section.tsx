import Link from 'next/link';
import { HOME_GRID_BANNERS } from '@/lib/home-media';

// Live ehansmart.com grid banners (local copies, see lib/home-media.ts)
const BANNERS = HOME_GRID_BANNERS.map((b, i) => ({ ...b, n: i + 1 }));

/** Banners point at live collections; fall back to all products when that collection isn't here. */
function bannerHref(slug: string, categorySlugs: string[]): string {
  return slug && categorySlugs.includes(slug) ? `/collections/${slug}` : '/collections';
}

export function GridBannerSection({ categorySlugs = [] }: { categorySlugs?: string[] }) {
  return (
    <section className="grid-banner-section">
      <div className="container">
        <div className="grid-banner-items">
          {BANNERS.map((b) => (
            <div key={b.n} className={`grid-banner-item grid-banner-item${b.n}`}>
              <Link className="grid-banner-item-inner" href={bannerHref(b.slug, categorySlugs)}>
                <div className="grid-banner-item-img">
                  <img src={b.desktop} alt={b.title} className="desktop-img" />
                  <img src={b.mobile} alt={b.title} className="mobile-img" />
                </div>
                <div className="grid-banner-item-content">
                  <div className="grid-banner-item-content-inner">
                    <h2 className="grid-banner-item-content-title">{b.title}</h2>
                    <p className="grid-banner-item-content-text">{b.text}</p>
                    <div className="btn secondary-btn">
                      shop now
                      <span></span>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

import Link from 'next/link';
import { collectionUrl } from '@/lib/format';

const BANNERS = [
  {
    n: 1,
    slug: 'womens-essentials',
    title: 'Women’s Essentials',
    text: 'Beauty, care & style picks for every day',
  },
  { n: 2, slug: 'home-kitchen', title: 'Home & Kitchen', text: 'Cook, serve & live better' },
  { n: 3, slug: 'mens-essentials', title: 'Man’s Essentials', text: 'Grooming & style for him' },
];

export function GridBannerSection() {
  return (
    <section className="grid-banner-section">
      <div className="container">
        <div className="grid-banner-items">
          {BANNERS.map((b) => (
            <div key={b.n} className={`grid-banner-item grid-banner-item${b.n}`}>
              <Link className="grid-banner-item-inner" href={collectionUrl(b.slug)}>
                <div className="grid-banner-item-img">
                  <img
                    src={`/assets/images/grid-banner-img${b.n}.webp`}
                    alt={b.title}
                    className="desktop-img"
                  />
                  <img
                    src={`/assets/images/grid-banner-img${b.n}-mobile.webp`}
                    alt={b.title}
                    className="mobile-img"
                  />
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

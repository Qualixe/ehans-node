import Link from 'next/link';
import { HOME_HERO_SLIDES } from '@/lib/home-media';
import { Slider, type SliderOptions } from '../slider';

const HERO_OPTIONS: SliderOptions = {
  slidesPerView: 1,
  grabCursor: true,
  spaceBetween: 16,
  loop: true,
  speed: 1000,
  autoplay: { delay: 3500, disableOnInteraction: false },
  pagination: { el: 'hero-pagination', clickable: true },
  navigation: { nextEl: 'hero-button-next', prevEl: 'hero-button-prev' },
  breakpoints: { 1: { spaceBetween: 0 }, 993: { spaceBetween: 16 } },
};

// Live ehansmart.com hero (local copies, see lib/home-media.ts)
const SLIDES = HOME_HERO_SLIDES.map((s) => ({
  ...s,
  // Shopify's "all products" collection is /collections here
  href: s.href === '/collections/all' ? '/collections' : s.href,
}));
// loop/autoplay only make sense with more than one slide
const OPTIONS: SliderOptions =
  SLIDES.length > 1 ? HERO_OPTIONS : { ...HERO_OPTIONS, loop: false, autoplay: false };

export function HeroSection() {
  return (
    <section className="hero-section">
      <div className="container">
        <Slider
          className="swiper hero-slider"
          options={OPTIONS}
          controls={
            <>
              <div className="swiper-pagination hero-pagination"></div>
              <div className="swiper-button-prev hero-button-prev"></div>
              <div className="swiper-button-next hero-button-next"></div>
            </>
          }
        >
          {SLIDES.map((s, i) => (
            <div key={s.desktop} className="swiper-slide">
              <Link href={s.href} className="slider-hero-item">
                <img
                  src={s.desktop}
                  alt={s.alt}
                  className="desktop-img"
                  fetchPriority={i === 0 ? 'high' : undefined}
                />
                <img src={s.mobile} alt={s.alt} className="mobile-img" />
                <div className="slider-hero-overlay">
                  <div className="container">
                    <div className="hero-content-inner">
                      <div className="hero-content">
                        <h1 className="hero-content-heading">{s.heading}</h1>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </Slider>
      </div>
    </section>
  );
}

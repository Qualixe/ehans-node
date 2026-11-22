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

const SLIDES = [
  {
    desktop: '/assets/images/hero-slider-banner1.webp',
    mobile: '/assets/images/hero-slider-banner1-mobile.webp',
    alt: 'Ehans Mart - Bangladeshi fast-growing e-commerce brand',
    heading: 'Bangladeshi fast-growing e-commerce brand',
    href: '/collections',
  },
  {
    desktop: '/assets/images/hero-slider-banner2.webp',
    mobile: '/assets/images/hero-slider-banner2-mobile.webp',
    alt: 'Shop smart, pay on delivery - Cash on delivery, easy return, fast delivery',
    heading: 'Shop smart, pay on delivery',
    href: '/collections',
  },
];

export function HeroSection() {
  return (
    <section className="hero-section">
      <div className="container">
        <Slider
          className="swiper hero-slider"
          options={HERO_OPTIONS}
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
              <a href={s.href} className="slider-hero-item">
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
              </a>
            </div>
          ))}
        </Slider>
      </div>
    </section>
  );
}

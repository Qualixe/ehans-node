import type { ProductCard as ProductCardData } from '@ehans/shared';
import Link from 'next/link';
import { ProductCard } from './product-card';
import { Slider, type SliderOptions } from './slider';

const EXPLORE_OPTIONS: SliderOptions = {
  slidesPerView: 5,
  centeredSlides: false,
  spaceBetween: 10,
  grabCursor: true,
  loop: true,
  speed: 500,
  autoplay: false,
  navigation: { nextEl: 'explore-slider-button-next', prevEl: 'explore-slider-button-prev' },
  breakpoints: {
    1: { slidesPerView: 2, spaceBetween: 5 },
    576: { slidesPerView: 2, spaceBetween: 10 },
    768: { slidesPerView: 3, spaceBetween: 10 },
    993: { slidesPerView: 4, spaceBetween: 10 },
    1200: { slidesPerView: 5, spaceBetween: 10 },
  },
};

/** Template "explore-slider-section": heading + view-all button + product card slider. */
export function CardSliderSection({
  title,
  href,
  products,
}: {
  title: string;
  href?: string;
  products: ProductCardData[];
}) {
  if (!products.length) return null;
  // loop mode needs more slides than the widest view shows
  const options = { ...EXPLORE_OPTIONS, loop: products.length > 5 };
  return (
    <section className="explore-slider-section">
      <div className="container">
        <div className="card-slider-section-heading">
          <h2 className="title">{title}</h2>
          {href ? (
            <div className="card-slider-section-btn">
              <Link href={href} className="btn">
                View All products
              </Link>
            </div>
          ) : null}
        </div>
        <Slider
          className="swiper explore-slider"
          options={options}
          controls={
            <>
              <div className="explore-slider-button-next swiper-button-next"></div>
              <div className="explore-slider-button-prev swiper-button-prev"></div>
            </>
          }
        >
          {products.map((p) => (
            <div key={p.id} className="swiper-slide">
              <div className="card-slider-item">
                <ProductCard product={p} />
              </div>
            </div>
          ))}
        </Slider>
      </div>
    </section>
  );
}

import type { CategorySummary } from '@ehans/shared';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { collectionUrl } from '@/lib/format';
import { Slider, type SliderOptions } from './slider';

const OPTIONS: SliderOptions = {
  slidesPerView: 'auto',
  spaceBetween: 20,
  grabCursor: true,
  loop: false,
  navigation: {
    nextEl: 'collection-category-button-next',
    prevEl: 'collection-category-button-prev',
  },
  breakpoints: { 1: { spaceBetween: 10 }, 576: { spaceBetween: 20 } },
};

/** Template "collection-category" section: heading + sub-category slider (collections & product pages). */
export function CollectionCategorySection({
  heading,
  categories,
  className = 'category-section collection-category',
}: {
  heading: ReactNode;
  categories: CategorySummary[];
  className?: string;
}) {
  return (
    <section className={className}>
      <div className="container">
        <div className="category-section-heading">{heading}</div>
        {categories.length ? (
          <div className="category-wrapper">
            <div className="category-slider-wrapper">
              <Slider
                className="swiper collection-category-slider"
                options={OPTIONS}
                controls={
                  <>
                    <div className="swiper-button-prev collection-category-button-prev"></div>
                    <div className="swiper-button-next collection-category-button-next"></div>
                  </>
                }
              >
                {categories.map((c) => (
                  <div key={c.id} className="swiper-slide">
                    <Link href={collectionUrl(c.slug)} className="category-item">
                      <div className="img">
                        {c.image ? <img src={c.image} alt={c.name} /> : null}
                      </div>
                      <div className="content">
                        <p className="title">{c.name}</p>
                      </div>
                    </Link>
                  </div>
                ))}
              </Slider>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

import type { CategorySummary } from '@ehans/shared';
import Link from 'next/link';
import { collectionUrl } from '@/lib/format';
import { RevealMedia } from './reveal-media';
import { Slider, type SliderOptions } from './slider';

const CATEGORY_OPTIONS: SliderOptions = {
  slidesPerView: 'auto',
  spaceBetween: 10,
  grabCursor: true,
  loop: false,
  navigation: { nextEl: 'category-button-next', prevEl: 'category-button-prev' },
};

/** Template category-section slider (home, collections and product pages use variants of it). */
export function CategorySlider({
  categories,
  sectionClassName = 'category-section',
  activeSlug,
  as: Tag = 'div',
  heading,
}: {
  categories: CategorySummary[];
  sectionClassName?: string;
  activeSlug?: string;
  as?: 'div' | 'section';
  heading?: React.ReactNode;
}) {
  if (!categories.length) return null;
  return (
    <Tag className={sectionClassName}>
      <div className="container">
        {heading}
        <div className="category-wrapper">
          <div className="category-slider-wrapper">
            <Slider
              className="swiper category-slider"
              options={CATEGORY_OPTIONS}
              controls={
                <>
                  <div className="swiper-button-prev category-button-prev"></div>
                  <div className="swiper-button-next category-button-next"></div>
                </>
              }
            >
              {categories.map((c) => (
                <div key={c.id} className="swiper-slide">
                  <Link
                    href={collectionUrl(c.slug)}
                    className={`category-item${activeSlug === c.slug ? ' active' : ''}`}
                  >
                    <RevealMedia className="img" src={c.image} width={320} height={320} />
                    <div className="content">
                      <p className="title">{c.name}</p>
                    </div>
                  </Link>
                </div>
              ))}
            </Slider>
          </div>
        </div>
      </div>
    </Tag>
  );
}

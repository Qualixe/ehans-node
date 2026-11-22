'use client';

import { useEffect, useState } from 'react';
import type Swiper from 'swiper';
import { Slider, type SliderOptions } from '../slider';
import { useProduct } from './product-context';

const THUMB_OPTIONS: SliderOptions = {
  direction: 'vertical',
  loop: false,
  spaceBetween: 8,
  slidesPerView: 'auto',
  freeMode: true,
  mousewheel: true,
  watchSlidesProgress: true,
  breakpoints: {
    1: { direction: 'horizontal', spaceBetween: 8 },
    768: { direction: 'vertical', spaceBetween: 8 },
  },
};

const MAIN_OPTIONS: SliderOptions = {
  loop: true,
  autoHeight: true,
  spaceBetween: 10,
  pagination: { el: 'product-slider-pagination', clickable: true },
};

/** Product image slider with thumbnails + full-screen image modal (template product-slider-area). */
export function ProductGallery() {
  const { product } = useProduct();
  const [thumbs, setThumbs] = useState<Swiper | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const images = product.images;
  const alt = (i: number) => `${product.name} - image ${i + 1}`;

  useEffect(() => {
    if (!modalOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setModalOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [modalOpen]);

  return (
    <>
      <div className="product-slider-area">
        <div className="product-slider-inner">
          <Slider
            className="swiper product-slider"
            options={{ ...MAIN_OPTIONS, loop: images.length > 1 }}
            thumbsSwiper={thumbs}
            wrapperProps={{
              onClick: (e) => {
                e.stopPropagation();
                setModalOpen(true);
              },
            }}
            controls={<div className="swiper-pagination product-slider-pagination"></div>}
          >
            {images.map((img, i) => (
              <div key={img.url + i} className="swiper-slide">
                <div className="product-slider-img">
                  <img src={img.url} alt={alt(i)} fetchPriority={i === 0 ? 'high' : undefined} />
                </div>
              </div>
            ))}
          </Slider>
          <Slider
            className="swiper product-slider-thumb"
            options={THUMB_OPTIONS}
            onSwiper={setThumbs}
          >
            {images.map((img, i) => (
              <div key={img.url + i} className="swiper-slide">
                <div className="product-slider-img">
                  <img src={img.url} alt={alt(i)} />
                </div>
              </div>
            ))}
          </Slider>
        </div>
      </div>

      <div
        className={`product-slider-modal${modalOpen ? ' active' : ''}`}
        onClick={() => setModalOpen(false)}
      >
        <button
          className="product-slider-modal-close"
          type="button"
          aria-label="product modal close"
          title="product modal close"
          onClick={(e) => {
            e.stopPropagation();
            setModalOpen(false);
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M3 15L15 3"
              stroke="#232323"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            ></path>
            <path
              d="M15 15L3 3"
              stroke="#232323"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            ></path>
          </svg>
        </button>
        <div className="product-slider-modal-content">
          <div className="product-slider-modal-items">
            {images.map((img, i) => (
              <div key={img.url + i} className="product-slider-modal-item">
                <img src={img.url} alt={alt(i)} loading="lazy" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

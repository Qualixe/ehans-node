'use client';

import type { ProductCard } from '@ehans/shared';
import { Fragment, type ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { formatCardPrice } from '@/lib/format';
import { cartActions } from '../providers/cart-store';
import { toCartItem } from '../product-card';
import { CloseIcon } from '../icons';
import { flyToCart } from '../fly-to-cart';

interface Review {
  video: string;
  poster: string;
  card: ReactNode;
  caption: ReactNode;
}

const REVIEWS: Review[] = [
  {
    video: '/assets/videos/review-1.mp4',
    poster: '/assets/videos/review-1.jpg',
    card: (
      <>
        why <span className="highlight">1000+</span> customers trust us
      </>
    ),
    caption: (
      <>
        See why <span className="highlight">1000+</span> customers trust us
      </>
    ),
  },
  {
    video: '/assets/videos/review-2.mp4',
    poster: '/assets/videos/review-2.jpg',
    card: (
      <>
        Comfort you can <span className="highlight">feel</span> instantly
      </>
    ),
    caption: (
      <>
        Comfort you can <span className="highlight">feel</span> instantly
      </>
    ),
  },
  {
    video: '/assets/videos/review-3.mp4',
    poster: '/assets/videos/review-3.jpg',
    card: (
      <>
        Real people. Real <span className="highlight">reviews</span>
      </>
    ),
    caption: (
      <>
        Real people. Real <span className="highlight">reviews</span>
      </>
    ),
  },
  {
    video: '/assets/videos/review-4.mp4',
    poster: '/assets/videos/review-4.jpg',
    card: (
      <>
        Premium product<span className="highlight">reviews</span>
      </>
    ),
    caption: (
      <>
        Premium product<span className="highlight">reviews</span>
      </>
    ),
  },
];

const ShareIcon = () => (
  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <circle cx="15" cy="5" r="2.2" stroke="currentColor" strokeWidth="1.4"></circle>
    <circle cx="15" cy="15" r="2.2" stroke="currentColor" strokeWidth="1.4"></circle>
    <circle cx="5" cy="10" r="2.2" stroke="currentColor" strokeWidth="1.4"></circle>
    <path d="M7 8.8 13 5.8M7 11.2l6 3" stroke="currentColor" strokeWidth="1.4"></path>
  </svg>
);

/** Video review cards + story-style popup; each video features one catalog product. */
export function CommunityReviews({ products }: { products: ProductCard[] }) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(0);
  const [muted, setMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const videos = useRef<(HTMLVideoElement | null)[]>([]);
  const cardVideos = useRef<(HTMLVideoElement | null)[]>([]);
  const product = products.length ? products[current % products.length] : undefined;

  // React does not render the `muted` attribute on the server; mute before autoplaying
  useEffect(() => {
    cardVideos.current.forEach((v) => {
      if (!v) return;
      v.muted = true;
      void v.play().catch(() => undefined);
    });
  }, []);

  const pauseAll = () =>
    videos.current.forEach((v) => {
      if (!v) return;
      v.pause();
      v.currentTime = 0;
    });

  const goTo = useCallback(
    (index: number) => {
      if (index < 0 || index >= REVIEWS.length) return;
      pauseAll();
      setCurrent(index);
      setProgress(0);
      const v = videos.current[index];
      if (v) {
        v.muted = muted;
        v.currentTime = 0;
        void v.play().catch(() => undefined);
      }
    },
    [muted],
  );

  const close = useCallback(() => {
    setOpen(false);
    pauseAll();
  }, []);

  useEffect(() => {
    document.body.classList.toggle('active', open);
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') goTo(current + 1);
      if (e.key === 'ArrowLeft') goTo(current - 1);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, current, goTo, close]);

  return (
    <>
      <section className="community-review-section">
        <div className="container">
          <h2 className="community-review-title">Community Reviews</h2>
          <div className="community-review-items">
            {REVIEWS.map((r, i) => (
              <button
                key={r.video}
                className="community-review-item"
                type="button"
                data-review-index={i}
                onClick={() => {
                  setOpen(true);
                  goTo(i);
                }}
              >
                <video
                  ref={(el) => {
                    cardVideos.current[i] = el;
                  }}
                  className="community-review-item-video"
                  src={r.video}
                  poster={r.poster}
                  muted
                  loop
                  playsInline
                  autoPlay
                ></video>
                <div className="community-review-item-content">
                  <p className="community-review-item-text">{r.card}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className={`community-review-popup${open ? ' active' : ''}`}>
        <span className="community-review-popup-close-window-btn" onClick={close}></span>
        <div className="community-review-popup-inner">
          <div className="community-review-popup-card">
            <div className="community-review-popup-video-wrap">
              <div className="community-review-popup-progress">
                {REVIEWS.map((r, i) => (
                  <span
                    key={r.video}
                    className={`community-review-popup-progress-bar${i < current ? ' completed' : ''}`}
                  >
                    <i
                      style={{
                        width: i < current ? '100%' : i === current ? `${progress}%` : '0%',
                      }}
                    ></i>
                  </span>
                ))}
              </div>
              <div className="community-review-popup-top-btns">
                <button
                  className={`community-review-popup-mute-btn${muted ? '' : ' unmuted'}`}
                  type="button"
                  aria-label="mute video"
                  onClick={() => {
                    setMuted((m) => {
                      const v = videos.current[current];
                      if (v) v.muted = !m;
                      return !m;
                    });
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <path d="M3 8v4h3.5L11 16V4L6.5 8H3Z" fill="currentColor"></path>
                    <g className="waves">
                      <path
                        d="M14 7c1 .8 1 5.2 0 6M16.3 5c2 2 2 8 0 10"
                        stroke="currentColor"
                        strokeWidth="1.4"
                        strokeLinecap="round"
                      ></path>
                    </g>
                  </svg>
                </button>
                <button
                  className="community-review-popup-close-btn"
                  type="button"
                  aria-label="close popup"
                  onClick={close}
                >
                  <CloseIcon size={12} fill="currentColor" />
                </button>
              </div>
              <div className="community-review-popup-slides">
                {REVIEWS.map((r, i) => (
                  <div
                    key={r.video}
                    className={`community-review-popup-slide${i === current ? ' active' : ''}`}
                  >
                    <video
                      ref={(el) => {
                        videos.current[i] = el;
                      }}
                      className="community-review-popup-video"
                      src={r.video}
                      poster={r.poster}
                      playsInline
                      muted
                      preload="none"
                      onTimeUpdate={(e) => {
                        const v = e.currentTarget;
                        if (i === current && v.duration)
                          setProgress((v.currentTime / v.duration) * 100);
                      }}
                      onEnded={() => {
                        if (i === current && current < REVIEWS.length - 1) goTo(current + 1);
                      }}
                    ></video>
                    <div className="community-review-popup-caption">
                      <p>{r.caption}</p>
                    </div>
                    <button
                      className="community-review-popup-share-btn"
                      type="button"
                      aria-label="share"
                      onClick={() => {
                        if (navigator.share)
                          void navigator
                            .share({ title: document.title, url: window.location.href })
                            .catch(() => undefined);
                      }}
                    >
                      <ShareIcon />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            {product ? (
              <>
                <div className="community-review-popup-product">
                  <div className="community-review-popup-product-img">
                    {product.image ? <img src={product.image.url} alt={product.name} /> : null}
                  </div>
                  <div className="community-review-popup-product-info">
                    <p className="community-review-popup-product-title">{product.name}</p>
                    <p className="community-review-popup-product-price">
                      {product.compareAtPrice ? (
                        <span className="prev">{formatCardPrice(product.compareAtPrice)}</span>
                      ) : (
                        <Fragment />
                      )}
                      <span className="curr">{formatCardPrice(product.price)}</span>
                    </p>
                  </div>
                </div>
                <div className="community-review-popup-btn-wrap">
                  <a
                    href="#"
                    className="btn"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      // fly from the popup button before the popup closes (live theme behaviour)
                      flyToCart(e.currentTarget, product.image?.url);
                      cartActions.add(toCartItem(product));
                      close();
                    }}
                  >
                    Add to Cart
                  </a>
                </div>
              </>
            ) : null}
          </div>
          <button
            className="community-review-popup-nav-btn prev"
            type="button"
            aria-label="previous review"
            disabled={current === 0}
            onClick={() => goTo(current - 1)}
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path
                d="M12.5 15.5 7 10l5.5-5.5"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              ></path>
            </svg>
          </button>
          <button
            className="community-review-popup-nav-btn next"
            type="button"
            aria-label="next review"
            disabled={current === REVIEWS.length - 1}
            onClick={() => goTo(current + 1)}
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path
                d="M7.5 4.5 13 10l-5.5 5.5"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              ></path>
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}

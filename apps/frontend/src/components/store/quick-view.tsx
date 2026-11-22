'use client';

import type { ProductDetail } from '@ehans/shared';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { getPublicEnv } from '@/lib/env';
import { formatPrice, productUrl } from '@/lib/format';
import { flyToCart } from './fly-to-cart';
import { cartActions } from './providers/cart-store';
import { useStoreUi } from './providers/store-ui';

const MAX_QTY = 99;

/**
 * Quick view as on the live ehansmart.com theme: media, title, price + stock,
 * option groups (with per-option prices), "How many?", add to cart → the card
 * switches to "View cart" and the image flies into the header cart.
 */
export function QuickView() {
  const { quickView: product, quickViewTrigger, closeQuickView } = useStoreUi();
  const [detail, setDetail] = useState<ProductDetail | null>(null);
  const [chosen, setChosen] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [arrows, setArrows] = useState({ prev: true, next: false });
  const [lastId, setLastId] = useState<string | null>(null);
  const imagesRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const drag = useRef({ active: false, startX: 0, startScroll: 0 });

  // a different product was opened: reset selection
  const openId = product?.id ?? null;
  if (openId !== lastId) {
    setLastId(openId);
    setQuantity(1);
    setChosen([]);
    if (detail?.id !== openId) setDetail(null);
  }

  useEffect(() => {
    if (!product) return;
    const controller = new AbortController();
    const base = getPublicEnv().NEXT_PUBLIC_API_URL.replace(/\/$/, '');
    fetch(`${base}/catalog/products/${encodeURIComponent(product.slug)}`, {
      signal: controller.signal,
    })
      .then((r) => (r.ok ? (r.json() as Promise<ProductDetail>) : null))
      .then((d) => {
        if (!d) return;
        setDetail(d);
        // first available variant is preselected (live theme behaviour)
        const first = d.variants.find((v) => v.stock > 0) ?? d.variants[0];
        if (first) setChosen(first.options);
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, [product]);

  const close = useCallback(() => {
    closeQuickView();
    quickViewTrigger?.focus({ preventScroll: true });
  }, [closeQuickView, quickViewTrigger]);

  useEffect(() => {
    document.body.classList.toggle('active', Boolean(product));
    if (!product) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [product, close]);

  const updateArrows = useCallback(() => {
    const el = imagesRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth - 2;
    setArrows({ prev: el.scrollLeft <= 2, next: el.scrollLeft >= max });
  }, []);

  // image strip: wheel → horizontal scroll, mouse drag
  useEffect(() => {
    const el = imagesRef.current;
    if (!el) return;
    el.scrollLeft = 0;
    const raf = requestAnimationFrame(updateArrows);
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };
    const onMove = (e: MouseEvent) => {
      if (drag.current.active)
        el.scrollLeft = drag.current.startScroll - (e.pageX - drag.current.startX);
    };
    const onUp = () => {
      if (!drag.current.active) return;
      drag.current.active = false;
      el.classList.remove('dragging');
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener('wheel', onWheel);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [detail, product, updateArrows]);

  const variants = detail?.variants ?? [];
  const options = detail?.options ?? [];
  const hasOptions = options.length > 0 && variants.length > 1;
  const findVariant = (values: string[]) =>
    variants.find((v) => v.options.every((value, i) => value === values[i]));
  const selected = hasOptions ? findVariant(chosen) : variants[0];
  const price = selected?.price ?? product?.price ?? 0;
  const compare = selected ? selected.compareAtPrice : (product?.compareAtPrice ?? null);
  const available = selected ? selected.stock > 0 : Boolean(product?.inStock);
  const images = detail?.images ?? (product?.image ? [product.image] : []);
  const priceOf = (value: string) =>
    options.length === 1 ? variants.find((v) => v.options[0] === value)?.price : undefined;

  const slide = (dir: number) => {
    const el = imagesRef.current;
    const img = el?.querySelector('img');
    el?.scrollBy({
      left: dir * (img ? img.getBoundingClientRect().width + 5 : el.clientWidth),
      behavior: 'smooth',
    });
  };

  const addToCart = () => {
    if (!product || !available || (hasOptions && !selected)) return;
    const image = selected?.imageUrl ?? images[0]?.url ?? '';
    const card = quickViewTrigger?.closest('.product-card');
    const cardImage = card?.querySelector('.card-img');
    const flySource = cardImage ?? quickViewTrigger;
    close();
    // fly after the quick view has closed (two frames), like the live theme
    requestAnimationFrame(() =>
      requestAnimationFrame(() => flyToCart(flySource, image, { fromImage: Boolean(cardImage) })),
    );
    cartActions.add(
      {
        id: selected ? `${product.id}:${selected.id}` : product.id,
        productId: product.id,
        variantId: selected?.id,
        title: hasOptions && selected ? `${product.name} (${selected.title})` : product.name,
        img: image,
        price,
        url: productUrl(product.slug),
      },
      quantity,
    );
  };

  return (
    <div
      className={`quick-view${product ? ' active' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="EhansQuickViewTitle"
    >
      <span className="quick-view-close-window-btn" onClick={close}></span>
      <div className="quick-view-inner">
        <button
          ref={closeRef}
          className="quick-view-close-btn"
          type="button"
          aria-label="Close"
          onClick={close}
        >
          <svg width="14" height="14" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <path
              d="M3 15L15 3M15 15L3 3"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            ></path>
          </svg>
        </button>
        <div className="quick-view-media">
          <div className="quick-view-images-wrap">
            <div
              className="quick-view-images"
              ref={imagesRef}
              onScroll={updateArrows}
              onMouseDown={(e) => {
                drag.current = {
                  active: true,
                  startX: e.pageX,
                  startScroll: e.currentTarget.scrollLeft,
                };
                e.currentTarget.classList.add('dragging');
              }}
            >
              {images.map((img, i) => (
                <img
                  key={img.url + i}
                  src={img.url}
                  alt={product?.name ?? ''}
                  draggable={false}
                  loading="lazy"
                />
              ))}
            </div>
            <button
              className="quick-view-images-btn prev"
              type="button"
              aria-label="Previous image"
              disabled={arrows.prev}
              onClick={() => slide(-1)}
            >
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path
                  d="M12.5 15.5 7 10l5.5-5.5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                ></path>
              </svg>
            </button>
            <button
              className="quick-view-images-btn next"
              type="button"
              aria-label="Next image"
              disabled={arrows.next}
              onClick={() => slide(1)}
            >
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path
                  d="M7.5 4.5 13 10l-5.5 5.5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                ></path>
              </svg>
            </button>
          </div>
        </div>
        <div className="quick-view-content">
          <h2 className="quick-view-title" id="EhansQuickViewTitle">
            {product?.name}
          </h2>
          <p className="quick-view-subtitle" hidden={!detail?.shortDescription}>
            {detail?.shortDescription}
          </p>
          <div className="quick-view-price">
            <p className="latest-price">{formatPrice(price)}</p>
            <p className="previous-price">
              {compare && compare > price ? formatPrice(compare) : ''}
            </p>
            <p className={`quick-view-stock${available ? '' : ' is-sold-out'}`} aria-live="polite">
              {available ? 'In stock' : 'Sold out'}
            </p>
          </div>
          <div className="quick-view-variant" hidden={!hasOptions}>
            <p className="quick-view-variant-label" hidden>
              <span className="name"></span>
              <span className="value" hidden>
                {selected?.title}
              </span>
            </p>
            <div className="quick-view-variant-options">
              {hasOptions
                ? options.map((option, i) => (
                    <div key={option.name} className="quick-view-option-group">
                      <p className="quick-view-variant-label">{option.name}</p>
                      <div className="quick-view-option-values">
                        {option.values.map((value) => {
                          const isChosen = chosen[i] === value;
                          const values = [...chosen];
                          values[i] = value;
                          const optionAvailable = (findVariant(values)?.stock ?? 0) > 0;
                          const optionPrice = priceOf(value);
                          return (
                            <button
                              key={value}
                              className={`quick-view-variant-btn${isChosen ? ' active' : ''}${optionAvailable ? '' : ' is-unavailable'}`}
                              type="button"
                              aria-pressed={isChosen}
                              onClick={() => setChosen(values)}
                            >
                              <span className="quick-view-variant-name">{value}</span>
                              {optionPrice !== undefined ? (
                                <span className="quick-view-variant-price">
                                  {formatPrice(optionPrice)}
                                </span>
                              ) : null}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))
                : null}
            </div>
          </div>
          <div className="quick-view-quantity-row">
            <p className="quick-view-quantity-label">How many?</p>
            <div className="quick-view-quantity">
              <button
                className="quick-view-quantity-decrease"
                type="button"
                aria-label="Decrease quantity"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              >
                −
              </button>
              <span className="quick-view-quantity-count" aria-live="polite">
                {quantity}
              </span>
              <button
                className="quick-view-quantity-increase"
                type="button"
                aria-label="Increase quantity"
                onClick={() => setQuantity((q) => Math.min(MAX_QTY, q + 1))}
              >
                +
              </button>
            </div>
          </div>
          <button
            className="btn quick-view-add-btn"
            type="button"
            disabled={!product || !available || (hasOptions && !detail)}
            onClick={addToCart}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path
                d="M2.5 3.5H4.6l1.6 7.7c.17.82.89 1.4 1.73 1.4h6.17c.82 0 1.53-.55 1.73-1.34l1.3-5.16H5.3"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              ></path>
              <circle cx="8.2" cy="15.6" r="1.1" fill="currentColor"></circle>
              <circle cx="14.1" cy="15.6" r="1.1" fill="currentColor"></circle>
            </svg>{' '}
            Add to cart
          </button>
          <Link
            href={product ? productUrl(product.slug) : '/collections'}
            className="quick-view-details-btn"
            onClick={() => closeQuickView()}
          >
            See full details
          </Link>
        </div>
      </div>
    </div>
  );
}

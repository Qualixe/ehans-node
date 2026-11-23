'use client';

import { useEffect, useRef, useState } from 'react';
import { formatPrice } from '@/lib/format';
import { addButtonProps, useAddToCart } from '../providers/use-add-to-cart';
import { useProduct } from './product-context';

/**
 * Shows once the main buy buttons scroll above the screen, hides near the footer
 * (template sticky-add-to-cart). Adds selected bundle × sticky quantity.
 */
export function StickyAddToCart() {
  const { product, variant, unit, bundleQty, offerFor, cartLine, extraItems, clearBuyWith } =
    useProduct();
  const { state, add } = useAddToCart();
  const [visible, setVisible] = useState(false);
  const [qty, setQty] = useState('1');
  const hiddenByFooter = useRef(false);

  useEffect(() => {
    const buttons = document.querySelector('.product-btn-wrap');
    const footer = document.querySelector('footer.footer');
    const pastButtons = () => {
      const r = buttons?.getBoundingClientRect();
      return Boolean(r && (r.bottom < 0 || r.top < 0));
    };
    const observers: IntersectionObserver[] = [];
    if (buttons) {
      const o = new IntersectionObserver(([entry]) => {
        if (!entry || entry.isIntersecting) return setVisible(false);
        const r = entry.boundingClientRect;
        setVisible((r.bottom < 0 || r.top < 0) && !hiddenByFooter.current);
      });
      o.observe(buttons);
      observers.push(o);
    }
    if (footer) {
      const o = new IntersectionObserver(
        ([entry]) => {
          if (!entry) return;
          if (entry.isIntersecting) {
            hiddenByFooter.current = true;
            setVisible(false);
          } else if (hiddenByFooter.current) {
            hiddenByFooter.current = false;
            if (pastButtons()) setVisible(true);
          }
        },
        { rootMargin: '0px 0px 160px 0px' },
      );
      o.observe(footer);
      observers.push(o);
    }
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  const quantity = () => Math.min(99, Math.max(1, parseInt(qty, 10) || 1));
  const offer = offerFor(bundleQty);
  const full = unit.price * bundleQty;
  const compare = (unit.compareAtPrice ?? 0) * bundleQty;
  const bundle = product.bundles.find((b) => b.quantity === bundleQty);
  const btn = addButtonProps(state, 'add to cart', 'btn sticky-add-to-cart-btn');

  return (
    <section
      className={`sticky-add-to-cart-section${visible ? ' show' : ''}`}
      aria-hidden={!visible}
    >
      <div className="sticky-add-to-cart-inner">
        <div className="sticky-prduct-img">
          {unit.image ? <img src={unit.image} alt={product.name} /> : null}
        </div>
        <div className="sticky-prduct-content">
          <p className="sticky-add-to-cart-title">{product.name}</p>
          <p className="sticky-add-to-cart-variant">
            {[variant?.title, bundle?.title].filter(Boolean).join(' · ')}
          </p>
        </div>
        <div className="sticky-add-to-cart-purchase">
          <div className="sticky-prduct-price">
            <p className="latest-price">
              {formatPrice(full - Math.round((full * offer.discount) / 100))}
            </p>
            {offer.discount || compare ? (
              <p className="previous-price">{formatPrice(offer.discount ? full : compare)}</p>
            ) : null}
          </div>
          <div className="sticky-quantity">
            <button
              className="sticky-quantity-decrease"
              type="button"
              aria-label="decrease quantity"
              onClick={() => setQty(String(Math.max(1, quantity() - 1)))}
            >
              −
            </button>
            <input
              className="sticky-quantity-input"
              type="number"
              min="1"
              value={qty}
              inputMode="numeric"
              aria-label="quantity"
              onChange={(e) => setQty(e.target.value)}
              onBlur={() => setQty(String(quantity()))}
            />
            <button
              className="sticky-quantity-increase"
              type="button"
              aria-label="increase quantity"
              onClick={() => setQty(String(Math.min(99, quantity() + 1)))}
            >
              +
            </button>
          </div>
          <div className="sticky-bar-btn-wrap">
            <button
              className={btn.className}
              type="button"
              disabled={!unit.inStock}
              onClick={(e) => {
                add(
                  [
                    { item: cartLine(bundleQty), qty: bundleQty * quantity() },
                    ...extraItems.map((item) => ({ item })),
                  ],
                  {
                    flyFrom: e.currentTarget,
                  },
                );
                clearBuyWith();
                setQty('1');
              }}
            >
              <span className="btn-label">
                <span className="btn-label-text">{btn.children}</span>
                <span className="btn-label-text" aria-hidden="true">
                  {btn.children}
                </span>
              </span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

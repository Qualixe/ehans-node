'use client';

import { type FormEvent, useEffect, useRef, useState } from 'react';
import { formatPrice } from '@/lib/format';
import { STORE } from '@/lib/store-config';
import { useProduct } from './product-context';

const toEnglishDigits = (v: string) => v.replace(/[০-৯]/g, (d) => String('০১২৩৪৫৬৭৮৯'.indexOf(d)));
const normalizePhone = (v: string) =>
  toEnglishDigits(v)
    .replace(/[\s-]/g, '')
    .replace(/^\+?88/, '');

const RULES = {
  phone: (v: string) => /^01[3-9]\d{8}$/.test(normalizePhone(v)),
  address: (v: string) => v.trim().length >= 8,
  name: (v: string) => v.trim().length >= 2,
};
type Field = keyof typeof RULES;

/**
 * Template "buy it now" quick-order popup (cash on delivery).
 * Order placement is wired when the checkout/orders module is ported from glowy;
 * until then submitting validates the form and asks the customer to call instead of
 * pretending the order was placed.
 */
export function BuyNowPopup() {
  const { product, bundleQty, offerFor, buyNowOpen, setBuyNowOpen } = useProduct();
  const [quantity, setQuantity] = useState(bundleQty);
  const [shipping, setShipping] = useState<number>(STORE.shippingOptions[0].value);
  const [values, setValues] = useState<Record<Field | 'note', string>>({
    phone: '',
    address: '',
    name: '',
    note: '',
  });
  const [invalid, setInvalid] = useState<Set<Field>>(new Set());
  const [notice, setNotice] = useState('');
  const [wasOpen, setWasOpen] = useState(false);
  const phoneRef = useRef<HTMLInputElement>(null);
  const refs = {
    phone: phoneRef,
    address: useRef<HTMLInputElement>(null),
    name: useRef<HTMLInputElement>(null),
  };

  // opening starts from the selected bundle quantity
  if (buyNowOpen !== wasOpen) {
    setWasOpen(buyNowOpen);
    if (buyNowOpen) {
      setQuantity(bundleQty);
      setNotice('');
    }
  }

  useEffect(() => {
    document.body.classList.toggle('active', buyNowOpen);
    if (!buyNowOpen) return;
    const t = window.setTimeout(() => phoneRef.current?.focus(), 100);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setBuyNowOpen(false);
    document.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener('keydown', onKey);
    };
  }, [buyNowOpen, setBuyNowOpen]);

  const offer = offerFor(quantity);
  const option =
    STORE.shippingOptions.find((o) => o.value === shipping) ?? STORE.shippingOptions[0];
  const subtotal = product.price * quantity;
  const discount = subtotal * (offer.discount / 100);
  const shippingCost = offer.freeDelivery ? 0 : option.value;
  const total = subtotal - discount + shippingCost;
  const offerText = [
    offer.discount ? `Bundle offer · Save ${offer.discount}%` : '',
    offer.freeDelivery ? 'Free Delivery 🚚' : '',
  ]
    .filter(Boolean)
    .join(' + ');

  const validate = (field: Field, value = values[field]) => {
    const ok = RULES[field](value);
    setInvalid((s) => {
      const next = new Set(s);
      if (ok) next.delete(field);
      else next.add(field);
      return next;
    });
    return ok;
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const bad = (Object.keys(RULES) as Field[]).filter((f) => !validate(f));
    if (bad.length) {
      refs[bad[0]!].current?.focus();
      return;
    }
    setNotice(
      `Online ordering is launching soon. Please call ${STORE.phone} or message us on WhatsApp to place this order.`,
    );
  };

  const field = (
    name: Field,
    label: string,
    type: string,
    placeholder: string,
    error: string,
    extra: object = {},
  ) => (
    <div className={`buy-now-popup-field${invalid.has(name) ? ' invalid' : ''}`}>
      <label htmlFor={`buy_now_${name}`}>{label}</label>
      <input
        ref={refs[name]}
        type={type}
        id={`buy_now_${name}`}
        name={name}
        placeholder={placeholder}
        value={values[name]}
        onChange={(e) => {
          const v = e.target.value;
          setValues((s) => ({ ...s, [name]: v }));
          if (invalid.has(name)) validate(name, v);
        }}
        onBlur={() => values[name] && validate(name)}
        {...extra}
      />
      <p className="buy-now-popup-error">{error}</p>
    </div>
  );

  const summary = (
    <div className="buy-now-popup-summary">
      <p>
        <span>Subtotal</span>
        <span>{formatPrice(subtotal)}</span>
      </p>
      <p>
        <span>Discount</span>
        <span>- {formatPrice(discount)}</span>
      </p>
      <p>
        <span>Shipping ({option.label})</span>
        <span>{shippingCost ? formatPrice(shippingCost) : 'Free'}</span>
      </p>
      <p className="total">
        <span>Total</span>
        <span>{formatPrice(total)}</span>
      </p>
    </div>
  );

  return (
    <div className={`buy-now-popup${buyNowOpen ? ' active' : ''}`}>
      <span className="buy-now-popup-close-window-btn" onClick={() => setBuyNowOpen(false)}></span>
      <div className="buy-now-popup-inner">
        <form className="buy-now-popup-form" noValidate onSubmit={onSubmit}>
          <div className="buy-now-popup-top">
            <p className="buy-now-popup-title">Please fill in the form to order</p>
            <button
              className="buy-now-popup-close-btn"
              type="button"
              aria-label="close popup"
              onClick={() => setBuyNowOpen(false)}
            >
              <svg width="12" height="12" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <path
                  d="M3 15L15 3M15 15L3 3"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                ></path>
              </svg>
            </button>
          </div>
          <div className="buy-now-popup-content">
            <div className="buy-now-popup-card">
              {field(
                'phone',
                'Phone*',
                'tel',
                '01XXXXXXXXX',
                'Enter a valid 11-digit mobile number',
                { inputMode: 'numeric' },
              )}
              {field(
                'address',
                'Address*',
                'text',
                'House, road, area, district',
                'Please enter your full address',
              )}
              {field('name', 'Name*', 'text', 'Your name', 'Please enter your name')}
            </div>
            <div className="buy-now-popup-card buy-now-popup-product">
              <div className="buy-now-popup-product-img">
                {product.images[0] ? <img src={product.images[0].url} alt={product.name} /> : null}
                <span className="buy-now-popup-qty-badge">{quantity}</span>
              </div>
              <div className="buy-now-popup-product-info">
                <p className="buy-now-popup-product-title">{product.name}</p>
                <p className="buy-now-popup-product-offer">{offerText}</p>
                <div className="buy-now-popup-quantity">
                  <button
                    className="buy-now-popup-quantity-decrease"
                    type="button"
                    aria-label="decrease quantity"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  >
                    −
                  </button>
                  <span className="buy-now-popup-quantity-count">{quantity}</span>
                  <button
                    className="buy-now-popup-quantity-increase"
                    type="button"
                    aria-label="increase quantity"
                    onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                  >
                    +
                  </button>
                </div>
              </div>
              <p className="buy-now-popup-product-price">{formatPrice(subtotal - discount)}</p>
            </div>
            <div className="buy-now-popup-card">
              <p className="buy-now-popup-card-title">Shipping Options</p>
              {STORE.shippingOptions.map((o) => (
                <label key={o.value} className="buy-now-popup-shipping">
                  <input
                    type="radio"
                    name="shipping"
                    value={o.value}
                    checked={shipping === o.value}
                    onChange={() => setShipping(o.value)}
                  />
                  <span>{o.label}</span>
                  <strong>{formatPrice(o.value)}</strong>
                </label>
              ))}
            </div>
            {summary}
            <div className="buy-now-popup-field">
              <label htmlFor="buy_now_note">Order note (optional)</label>
              <textarea
                id="buy_now_note"
                name="note"
                rows={2}
                placeholder="Anything we should know?"
                value={values.note}
                onChange={(e) => setValues((s) => ({ ...s, note: e.target.value }))}
              />
            </div>
          </div>
          <div className="buy-now-popup-bottom">
            {notice ? (
              <p
                className="buy-now-popup-error"
                role="status"
                style={{ display: 'block', marginBottom: 8 }}
              >
                {notice}
              </p>
            ) : null}
            <button className="btn buy-now-popup-submit-btn" type="submit">
              Order now - Cash on delivery
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

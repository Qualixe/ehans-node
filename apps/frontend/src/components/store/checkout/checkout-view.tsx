'use client';

import { type CheckoutItemInput, type CheckoutQuote, SHIPPING_ZONES } from '@ehans/shared';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type FormEvent, useEffect, useState, useTransition } from 'react';
import { myCheckoutDetails } from '@/lib/account/actions';
import { checkoutSessionKey, resetCheckoutSession, saveDraft } from './incomplete';
import { placeOrder, quoteCheckout } from '@/lib/checkout-actions';
import { formatPrice } from '@/lib/format';
import { useIsClient } from '../hooks';
import { useCart } from '../providers/cart-store';
import { DistrictOptions } from './district-select';
import {
  ORDER_FIELDS,
  ORDER_RULES,
  type OrderField,
  confirmationUrl,
  normalizePhone,
} from './order-form';

type Values = Record<OrderField | 'note', string>;

const FIELDS: Record<Exclude<OrderField, 'district'>, [string, string, string, string, string]> = {
  // label, type, placeholder, error, autocomplete
  name: ['Name*', 'text', 'Your full name', 'Please enter your name', 'name'],
  phone: ['Phone*', 'tel', '01XXXXXXXXX', 'Enter a valid 11-digit mobile number', 'tel'],
  address: [
    'Address*',
    'text',
    'House, road, area, thana',
    'Please enter your full address',
    'street-address',
  ],
};

/**
 * Cart checkout (glowy checkout/create): delivery details, cash on delivery, and the order
 * summary priced by the API. Built from the template's cart and buy-now popup classes.
 */
export function CheckoutView() {
  const { items, count, clear } = useCart();
  const ready = useIsClient();
  const router = useRouter();
  const [values, setValues] = useState<Values>({
    name: '',
    phone: '',
    district: '',
    address: '',
    note: '',
  });
  const [invalid, setInvalid] = useState<Set<OrderField>>(new Set());
  const [errors, setErrors] = useState<string[]>([]);
  const [quote, setQuote] = useState<CheckoutQuote | null>(null);
  const [placing, startPlacing] = useTransition();
  const [placed, setPlaced] = useState(false);

  // carts from before checkout existed have no product ids: those lines must be added again
  const stale = items.filter((i) => !i.productId);
  const orderItems: CheckoutItemInput[] = items
    .filter((i) => i.productId)
    .map((i) => ({ productId: i.productId!, variantId: i.variantId ?? null, quantity: i.qty }));
  const itemsKey = JSON.stringify(orderItems);

  // signed in: start from the saved profile (fields the shopper already typed win)
  useEffect(() => {
    let cancelled = false;
    void myCheckoutDetails().then((d) => {
      if (!d || cancelled) return;
      setValues((v) => ({
        ...v,
        name: v.name || d.name,
        phone: v.phone || d.phone,
        address: v.address || d.address,
        district: v.district || d.district,
      }));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const list = JSON.parse(itemsKey) as CheckoutItemInput[];
    if (!list.length) return;
    let cancelled = false;
    const t = window.setTimeout(async () => {
      const result = await quoteCheckout(list, values.district || null);
      if (cancelled) return;
      if ('quote' in result) {
        setQuote(result.quote);
        setErrors([]);
      } else {
        setQuote(null);
        setErrors([result.error]);
      }
    }, 150);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [itemsKey, values.district]);

  const validate = (field: OrderField, value = values[field]) => {
    const ok = ORDER_RULES[field](value);
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
    const bad = ORDER_FIELDS.filter((f) => !validate(f));
    if (bad.length) {
      document.getElementById(`checkout_${bad[0]}`)?.focus();
      return;
    }
    if (stale.length) return;
    setErrors([]);
    startPlacing(async () => {
      const result = await placeOrder({
        mode: 'cart',
        items: orderItems,
        customerName: values.name.trim(),
        phone: normalizePhone(values.phone),
        address: values.address.trim(),
        district: values.district,
        note: values.note.trim() || null,
        sessionKey: checkoutSessionKey() || null,
      });
      if ('errors' in result) {
        setErrors(result.errors);
        return;
      }
      setPlaced(true);
      resetCheckoutSession();
      router.push(confirmationUrl(result.order));
      clear();
    });
  };

  // a valid phone saves the draft for the order panel's "Incomplete orders"
  useEffect(() => {
    if (!placed) saveDraft({ ...values, items: JSON.parse(itemsKey) as CheckoutItemInput[] });
  }, [values, itemsKey, placed]);

  const set = (field: keyof Values, v: string) => {
    setValues((s) => ({ ...s, [field]: v }));
    if (field !== 'note' && (field === 'district' || invalid.has(field))) validate(field, v);
  };

  const input = (name: Exclude<OrderField, 'district'>) => {
    const [label, type, placeholder, error, autoComplete] = FIELDS[name];
    return (
      <div className={`buy-now-popup-field${invalid.has(name) ? ' invalid' : ''}`}>
        <label htmlFor={`checkout_${name}`}>{label}</label>
        <input
          id={`checkout_${name}`}
          name={name}
          type={type}
          placeholder={placeholder}
          autoComplete={autoComplete}
          inputMode={name === 'phone' ? 'numeric' : undefined}
          maxLength={name === 'address' ? 500 : 100}
          value={values[name]}
          onChange={(e) => set(name, e.target.value)}
          onBlur={() => values[name] && validate(name)}
        />
        <p className="buy-now-popup-error">{error}</p>
      </div>
    );
  };

  const empty = ready && items.length === 0 && !placed;
  const zone = quote?.zone ? SHIPPING_ZONES[quote.zone].label : null;
  const shipping = !quote
    ? '…'
    : quote.freeShipping
      ? 'Free'
      : quote.zone
        ? formatPrice(quote.shipping)
        : 'Select your district';

  return (
    <section className="cart-section checkout-section">
      <div className="container">
        <div className="section-heading-wrapper">
          <h1 className="section-heading">Checkout</h1>
        </div>
        <div className="cart-page-empty" hidden={!empty}>
          <p className="cart-page-empty-title">Your cart is empty</p>
          <p className="cart-page-empty-text">Add something to your cart to check out.</p>
          <Link href="/collections" className="btn primary-btn">
            continue shopping
          </Link>
        </div>
        <form className="cart-wrapper" hidden={empty || !ready} noValidate onSubmit={onSubmit}>
          <div className="cart-content-wrap">
            <div className="buy-now-popup-card checkout-card">
              <p className="cart-summary-title">Delivery details</p>
              {input('name')}
              {input('phone')}
              <div className={`buy-now-popup-field${invalid.has('district') ? ' invalid' : ''}`}>
                <label htmlFor="checkout_district">District*</label>
                <select
                  id="checkout_district"
                  name="district"
                  value={values.district}
                  onChange={(e) => set('district', e.target.value)}
                >
                  <DistrictOptions />
                </select>
                <p className="buy-now-popup-error">Please choose your district</p>
              </div>
              {input('address')}
              <p className="cart-summary-title">Payment method</p>
              <label className="buy-now-popup-shipping">
                <input type="radio" name="payment_method" value="cod" defaultChecked />
                <span>
                  Cash on delivery
                  <br />
                  <small>Pay when you receive your order</small>
                </span>
              </label>
              <div className="buy-now-popup-field">
                <label htmlFor="checkout_note">Order note (optional)</label>
                <textarea
                  id="checkout_note"
                  name="note"
                  rows={3}
                  maxLength={500}
                  placeholder="Delivery instructions, preferred time, etc."
                  value={values.note}
                  onChange={(e) => set('note', e.target.value)}
                />
              </div>
            </div>
          </div>
          <aside className="cart-summary" aria-label="Order summary">
            <p className="cart-summary-title">Your order ({count})</p>
            <div className="checkout-items">
              {(quote?.lines ?? []).map((line) => (
                <div
                  key={`${line.productId}:${line.variantId ?? ''}`}
                  className="buy-now-popup-product"
                >
                  <div className="buy-now-popup-product-img">
                    {line.image ? <img src={line.image} alt={line.name} /> : null}
                    <span className="buy-now-popup-qty-badge">{line.quantity}</span>
                  </div>
                  <div className="buy-now-popup-product-info">
                    <p className="buy-now-popup-product-title">
                      {line.name}
                      {line.variantTitle ? ` (${line.variantTitle})` : ''}
                    </p>
                    {line.discountPercent ? (
                      <p className="buy-now-popup-product-offer">
                        Bundle offer · Save {line.discountPercent}%
                      </p>
                    ) : null}
                  </div>
                  <p className="buy-now-popup-product-price">
                    {formatPrice(line.lineSubtotal - line.lineDiscount)}
                  </p>
                </div>
              ))}
              {stale.map((i) => (
                <p key={i.id} className="buy-now-popup-error checkout-alert">
                  “{i.title}” needs to be added to your cart again.{' '}
                  <Link href={i.url}>Open product</Link>
                </p>
              ))}
            </div>
            <div className="cart-summary-items">
              <div className="cart-summary-item">
                <p className="title">Subtotal:</p>
                <p className="price">{quote ? formatPrice(quote.subtotal) : '…'}</p>
              </div>
              {quote?.discount ? (
                <div className="cart-summary-item">
                  <p className="title">Discount:</p>
                  <p className="price">- {formatPrice(quote.discount)}</p>
                </div>
              ) : null}
              <div className="cart-summary-item">
                <p className="title">Shipping{zone ? ` (${zone})` : ''}:</p>
                <p className="price">{shipping}</p>
              </div>
              <div className="cart-summary-item summary-total">
                <p className="title">Total:</p>
                <p className="price">{quote ? formatPrice(quote.total) : '…'}</p>
              </div>
            </div>
            {errors.length ? (
              <div role="alert">
                {errors.map((m) => (
                  <p key={m} className="buy-now-popup-error checkout-alert">
                    {m}
                  </p>
                ))}
              </div>
            ) : null}
            <div className="cart-summary-btn">
              <button
                className="btn primary-btn"
                type="submit"
                disabled={placing || placed || stale.length > 0 || !quote}
                aria-busy={placing}
              >
                {placing || placed
                  ? 'Placing your order…'
                  : `Place order${quote ? ` · ${formatPrice(quote.total)}` : ''}`}
              </button>
            </div>
            <p className="checkout-terms">
              By placing your order you agree to our{' '}
              <Link href="/policies/privacy-policy">store policies</Link>.
            </p>
          </aside>
        </form>
      </div>
    </section>
  );
}

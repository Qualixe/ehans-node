'use client';

import { type CheckoutQuote, MAX_QUANTITY_PER_ITEM } from '@ehans/shared';
import { useRouter } from 'next/navigation';
import { type FormEvent, useEffect, useRef, useState, useTransition } from 'react';
import { myCheckoutDetails } from '@/lib/account/actions';
import { checkoutSessionKey, resetCheckoutSession, saveDraft } from '../checkout/incomplete';
import { placeOrder, quoteCheckout } from '@/lib/checkout-actions';
import { formatTaka } from '@/lib/format';
import { DistrictPicker } from '../checkout/district-picker';
import {
  ORDER_FIELDS,
  ORDER_RULES,
  type OrderField,
  confirmationUrl,
  normalizePhone,
} from '../checkout/order-form';
import { QcIcon } from '../checkout/qc-icons';
import { useProduct } from './product-context';

type Values = Record<OrderField, string>;

const MESSAGES: Record<OrderField, string> = {
  name: 'Please enter your name.',
  phone: 'Please enter a valid Bangladeshi mobile number (01XXXXXXXXX).',
  district: 'Please choose your district.',
  address: 'Please enter your full address (house, road, area, thana).',
};

/** glowy remembers the shopper's details for the next order (qc.customer). */
const STORAGE_KEY = 'ehans-qc-customer';
const EMPTY: Values = { name: '', phone: '', district: '', address: '' };

function remembered(): Values {
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}') as Partial<Values>;
    return {
      ...EMPTY,
      ...Object.fromEntries(
        ORDER_FIELDS.filter((f) => typeof saved[f] === 'string').map((f) => [f, saved[f]]),
      ),
    };
  } catch {
    return EMPTY;
  }
}

/**
 * "Buy it now": glowy's one-step cash-on-delivery popup (partials/quick-checkout), with the
 * Ehans colours. Totals come from the API; the order is placed there too.
 */
export function BuyNowPopup() {
  const { product, variant, unit, bundleQty, buyNowOpen, setBuyNowOpen } = useProduct();
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [values, setValues] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<OrderField, string>>>({});
  const [alert, setAlert] = useState<string | null>(null);
  const [quote, setQuote] = useState<CheckoutQuote | null>(null);
  const [placing, startPlacing] = useTransition();
  const [shown, setShown] = useState(false);
  const quantity = Math.min(bundleQty, MAX_QUANTITY_PER_ITEM);

  // open/close the native modal dialog with the product page's state
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (buyNowOpen && !dialog.open) {
      setValues((v) => (v === EMPTY ? remembered() : v));
      // signed in: fill whatever is still empty from the saved profile
      void myCheckoutDetails().then((d) => {
        if (!d) return;
        setValues((v) => ({
          name: v.name || d.name,
          phone: v.phone || d.phone,
          address: v.address || d.address,
          district: v.district || d.district,
        }));
      });
      setAlert(null);
      dialog.showModal();
      document.documentElement.classList.add('quick-checkout-open');
      requestAnimationFrame(() => setShown(true));
    } else if (!buyNowOpen && dialog.open) {
      setShown(false);
      dialog.close();
    }
    if (!buyNowOpen) document.documentElement.classList.remove('quick-checkout-open');
  }, [buyNowOpen]);

  // the exact total from the API whenever the product, variant, quantity or district changes
  const items = [{ productId: product.id, variantId: variant?.id ?? null, quantity }];

  // a valid phone saves the draft for the order panel's "Incomplete orders"
  useEffect(() => {
    if (buyNowOpen) saveDraft({ ...values, items });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- items is rebuilt each render
  }, [buyNowOpen, values, product.id, variant?.id, quantity]);
  const itemsKey = JSON.stringify(items);
  useEffect(() => {
    if (!buyNowOpen) return;
    let cancelled = false;
    const t = window.setTimeout(async () => {
      const result = await quoteCheckout(JSON.parse(itemsKey), values.district || null);
      if (cancelled) return;
      if ('quote' in result) {
        setQuote(result.quote);
        setAlert(null);
      } else {
        setQuote(null);
        setAlert(result.error);
      }
    }, 120);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [buyNowOpen, itemsKey, values.district]);

  const set = (field: OrderField, v: string) => {
    setValues((s) => ({ ...s, [field]: v }));
    if (errors[field] && ORDER_RULES[field](v)) {
      setErrors((e) => ({ ...e, [field]: undefined }));
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const found = Object.fromEntries(
      ORDER_FIELDS.filter((f) => !ORDER_RULES[f](values[f])).map((f) => [f, MESSAGES[f]]),
    ) as Partial<Record<OrderField, string>>;
    setErrors(found);
    const first = ORDER_FIELDS.find((f) => found[f]);
    if (first) {
      document.getElementById(`qc-${first}`)?.focus();
      return;
    }
    setAlert(null);
    startPlacing(async () => {
      const result = await placeOrder({
        mode: 'buy_now',
        items,
        customerName: values.name.trim(),
        phone: normalizePhone(values.phone),
        address: values.address.trim(),
        district: values.district,
        sessionKey: checkoutSessionKey() || null,
      });
      if ('errors' in result) {
        setAlert(result.errors[0] ?? 'Something went wrong. Please try again.');
        return;
      }
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
      } catch {
        // storage unavailable
      }
      resetCheckoutSession();
      router.push(confirmationUrl(result.order));
      setBuyNowOpen(false);
    });
  };

  const field = (
    name: Exclude<OrderField, 'district'>,
    icon: 'user' | 'phone' | 'home',
    label: string,
    props: React.InputHTMLAttributes<HTMLInputElement>,
  ) => (
    <div className={`qc-field${errors[name] ? ' has-error' : ''}`}>
      <label htmlFor={`qc-${name}`} className="qc-visually-hidden">
        {label}
      </label>
      <div className="qc-input">
        <QcIcon name={icon} />
        <input
          id={`qc-${name}`}
          name={name}
          value={values[name]}
          onChange={(e) => set(name, e.target.value)}
          aria-invalid={errors[name] ? true : undefined}
          required
          {...props}
        />
      </div>
      {errors[name] ? <p className="qc-error">{errors[name]}</p> : null}
    </div>
  );

  const line = quote?.lines[0];

  return (
    <dialog
      ref={dialogRef}
      className={`quick-checkout${shown ? ' is-open' : ''}`}
      aria-labelledby="quick-checkout-title"
      onClose={() => setBuyNowOpen(false)}
      onClick={(e) => {
        // a click on the backdrop (the dialog element itself) closes it, like glowy
        if (e.target === e.currentTarget) setBuyNowOpen(false);
      }}
    >
      <form className="qc-form" noValidate onSubmit={onSubmit}>
        <header className="qc-head">
          <p className="qc-title" id="quick-checkout-title">
            Order with cash on delivery
          </p>
          <button
            type="button"
            className="qc-close"
            aria-label="Close"
            onClick={() => setBuyNowOpen(false)}
          >
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path
                d="M3 15L15 3M15 15L3 3"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </header>

        <div className="qc-body">
          {alert ? (
            <p className="qc-alert" role="alert">
              {alert}
            </p>
          ) : null}

          {field('name', 'user', 'Your name', {
            type: 'text',
            placeholder: 'Your full name',
            autoComplete: 'name',
            maxLength: 100,
          })}
          {field('phone', 'phone', 'Mobile number', {
            type: 'tel',
            placeholder: 'Mobile number (01XXXXXXXXX)',
            autoComplete: 'tel',
            inputMode: 'tel',
            maxLength: 20,
          })}
          <div className={`qc-field${errors.district ? ' has-error' : ''}`}>
            <DistrictPicker
              id="qc-district"
              value={values.district}
              invalid={Boolean(errors.district)}
              onChange={(key) => set('district', key)}
            />
            {errors.district ? <p className="qc-error">{errors.district}</p> : null}
          </div>
          {field('address', 'home', 'Full address', {
            type: 'text',
            placeholder: 'Full address (house, road, area, thana)',
            autoComplete: 'street-address',
            maxLength: 500,
          })}

          <div className="qc-summary" aria-live="polite">
            {quote && line ? (
              <>
                <ul className="qc-items">
                  <li className="qc-item">
                    <span className="qc-item-img">
                      {(line.image ?? unit.image) ? (
                        <img src={line.image ?? unit.image ?? ''} alt="" />
                      ) : null}
                      <span className="qc-item-qty" aria-label={`Quantity ${line.quantity}`}>
                        {line.quantity}
                      </span>
                    </span>
                    <span className="qc-item-name">
                      {line.name}
                      {line.variantTitle ? <small>{line.variantTitle}</small> : null}
                    </span>
                    <strong className="qc-item-total">{formatTaka(line.lineSubtotal)}</strong>
                  </li>
                </ul>
                <dl className="qc-totals">
                  <div>
                    <dt>Subtotal</dt>
                    <dd>{formatTaka(quote.subtotal)}</dd>
                  </div>
                  {quote.discount > 0 ? (
                    <div className="qc-discount">
                      <dt>Bundle discount ({line.discountPercent}%)</dt>
                      <dd>−{formatTaka(quote.discount)}</dd>
                    </div>
                  ) : null}
                  <div>
                    <dt>Shipping</dt>
                    <dd>
                      {quote.freeShipping
                        ? 'Free'
                        : quote.zone
                          ? formatTaka(quote.shipping)
                          : 'Select district'}
                    </dd>
                  </div>
                  <div className="qc-grand">
                    <dt>Total</dt>
                    <dd>{formatTaka(quote.total)}</dd>
                  </div>
                </dl>
              </>
            ) : alert ? null : (
              <div className="qc-loading" aria-label="Loading your order">
                <span></span>
                <span></span>
              </div>
            )}
          </div>
        </div>

        <footer className="qc-foot">
          <button
            type="submit"
            className="qc-submit"
            disabled={placing || !quote}
            aria-busy={placing}
          >
            <b className="qc-submit-label">
              {placing
                ? 'Placing your order…'
                : `Place order${quote ? ` · ${formatTaka(quote.total)}` : ''}`}
            </b>
          </button>
          <p className="qc-cod">Cash on delivery · Pay when you receive it</p>
        </footer>
      </form>
    </dialog>
  );
}

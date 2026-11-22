'use client';

import { useRef, useState } from 'react';
import { formatPrice } from '@/lib/format';
import { STORE, whatsappOrderUrl } from '@/lib/store-config';
import { addButtonProps, useAddToCart } from '../providers/use-add-to-cart';
import { useStoreUi } from '../providers/store-ui';
import { toCartItem } from '../product-card';
import { useProduct } from './product-context';

/** Inline styles the live cash-on-delivery app puts on its "ORDER NOW" button. */
const COD_BUTTON_STYLE: React.CSSProperties = {
  backgroundColor: 'rgb(255, 84, 84)',
  color: 'rgb(255, 255, 255)',
  fontSize: 16,
  fontWeight: 700,
  fontStyle: 'normal',
  padding: '14px 28px',
  border: 'none',
  borderRadius: 4,
  boxShadow: 'rgba(0, 0, 0, 0.125) 0px 1px 3px',
  gap: 0,
};

const CaretIcon = () => (
  <svg aria-hidden="true" focusable="false" className="icon icon-caret" viewBox="0 0 10 6">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M9.354.646a.5.5 0 00-.708 0L5 4.293 1.354.646a.5.5 0 00-.708.708l4 4a.5.5 0 00.708 0l4-4a.5.5 0 000-.708z"
      fill="black"
    ></path>
  </svg>
);

const ACCORDION = [
  {
    title: 'Returns',
    items: [
      'Not satisfied? Return it easily — no stress, no hassle',
      'Product must be unused with original box & accessories',
      'No return for misuse, water damage, or physical damage',
      'Return request within 7 days of delivery',
    ],
  },
  {
    title: 'Care Instructions',
    items: [
      'Test on a small hidden area before first use',
      'Close the lid tightly after use',
      'Store in a cool, dry place away from direct sunlight',
      'Keep out of reach of children; avoid contact with eyes',
    ],
  },
];

function Accordion() {
  const [open, setOpen] = useState(0); // first item open by default (template)
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  const [heights, setHeights] = useState<Record<number, number>>({});
  return (
    <div className="product-description-accordion">
      <div className="product-accordion-items">
        {ACCORDION.map((item, i) => (
          <div key={item.title} className={`product-accordion-item${open === i ? ' active' : ''}`}>
            <div
              className="item-title-wrapper product-accordion-toggle-btn"
              onClick={() => {
                setHeights((h) => ({ ...h, [i]: refs.current[i]?.scrollHeight ?? 0 }));
                setOpen(open === i ? -1 : i);
              }}
            >
              <h6 className="item-title">{item.title}</h6>
              <span className="icon">
                <CaretIcon />
              </span>
            </div>
            <div
              className="product-accordion-item-content"
              ref={(el) => {
                refs.current[i] = el;
              }}
              style={
                open === i ? { maxHeight: heights[i] ? `${heights[i]}px` : 'none' } : undefined
              }
            >
              <div className="product-accordion-item-content-inner">
                <ul>
                  {item.items.map((t) => (
                    <li key={t}>
                      <p>{t}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const MARQUEE = Array.from({ length: 6 });

export function ProductInfo() {
  const {
    product,
    bundleQty,
    setBundleQty,
    cartLine,
    buyWith,
    toggleBuyWith,
    clearBuyWith,
    setBuyNowOpen,
  } = useProduct();
  const { openQuickView } = useStoreUi();
  const { state, add } = useAddToCart();
  const [tab, setTab] = useState<'description' | 'specification'>('description');
  const btn = addButtonProps(
    state,
    product.inStock ? 'add to cart' : 'sold out',
    'btn product-add-to-cart-btn',
  );
  const stockMax = Math.max(product.stock + product.soldCount, product.stock, 1);
  const rating = product.ratingAverage ?? 0;

  const addMain = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!product.inStock) return;
    const extras = product.buyWith
      .filter((p) => buyWith.has(p.id))
      .map((p) => ({ item: toCartItem(p) }));
    add([{ item: cartLine(bundleQty), qty: bundleQty }, ...extras], { flyFrom: e.currentTarget });
    clearBuyWith();
  };

  return (
    <div className="product-content-area">
      <div className="product-offer-marquee">
        <div className="product-offer-marquee-track">
          {MARQUEE.map((_, i) => (
            <span key={i}>
              This Offer is <strong>For Limited Time</strong> <em>Only</em>
            </span>
          ))}
        </div>
      </div>
      <div className="product-happy-customer">
        <div className="product-happy-customer-img">
          <img src="/assets/videos/review-2.jpg" alt="customer" />{' '}
          <img src="/assets/videos/review-3.jpg" alt="customer" />{' '}
          <img src="/assets/videos/review-4.jpg" alt="customer" />
        </div>
        <p className="product-happy-customer-text">
          <strong>Tanvir</strong>{' '}
          <span className="icon">
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path
                d="M10 1.5l2.2 1.6 2.7-.1.8 2.6 2.2 1.6-.9 2.6.9 2.6-2.2 1.6-.8 2.6-2.7-.1L10 18.5l-2.2-1.6-2.7.1-.8-2.6-2.2-1.6.9-2.6-.9-2.6 2.2-1.6.8-2.6 2.7.1L10 1.5Z"
                fill="currentColor"
              ></path>
              <path
                d="M6.8 10.2l2.1 2.1 4.3-4.4"
                stroke="#fff"
                strokeWidth="1.6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              ></path>
            </svg>
          </span>{' '}
          and {80 + (product.soldCount % 50)} people watching
        </p>
      </div>
      {product.ratingCount ? (
        <a href="#product-review" className="product-rattings">
          <span
            className="product-rattings-stars"
            style={{ '--rating': String(rating) } as React.CSSProperties}
          ></span>{' '}
          <span className="rattings-count">
            {rating.toFixed(1)} From {product.ratingCount} Reviews
          </span>
        </a>
      ) : null}
      <h1 className="product-title">{product.name}</h1>
      <div className="product-price-wrap">
        {product.compareAtPrice && product.compareAtPrice > product.price ? (
          <p className="previous-price">{formatPrice(product.compareAtPrice)}</p>
        ) : null}
        <p className="latest-price">{formatPrice(product.price)}</p>
        {product.discountPercent ? (
          <p className="product-price-save">- {product.discountPercent}%</p>
        ) : null}
      </div>
      <div className="product-stock">
        <p className="product-stock-text">
          <span className="product-stock-dot"></span>{' '}
          {product.inStock ? (
            <>
              Currently <span className="product-stock-count">{product.stock}</span> items are in
              stock!
            </>
          ) : (
            <>Currently out of stock</>
          )}
        </p>
        <div
          className="product-stock-bar"
          style={
            {
              '--stock': `${Math.min(100, (product.stock / stockMax) * 100)}%`,
            } as React.CSSProperties
          }
        >
          <span></span>
        </div>
      </div>

      {product.bundles.length ? (
        <div className="bundle-wrapper">
          <h2 className="bundle-wrapper-title">Bundle & Save</h2>
          {product.bundles.map((b) => {
            const full = product.price * b.quantity;
            const total = full * (1 - b.discountPercent / 100);
            const id = `${b.quantity}_bundle`;
            return (
              <div key={b.quantity} className="bundle-item">
                {b.badge ? (
                  <>
                    <span className="bundle-badge">{b.badge}</span>{' '}
                  </>
                ) : null}
                <input
                  type="radio"
                  name="bundle"
                  value={b.quantity}
                  id={id}
                  data-discount={b.discountPercent}
                  {...(b.freeDelivery ? { 'data-free-delivery': '' } : {})}
                  checked={bundleQty === b.quantity}
                  onChange={() => setBundleQty(b.quantity)}
                />{' '}
                <label className="bundle-label" htmlFor={id}>
                  <span className="bundle-radio"></span>{' '}
                  <span className="bundle-content">
                    <span className="bundle-title">
                      {b.title}
                      {b.discountPercent ? (
                        <>
                          {' '}
                          <span className="bundle-savings">Save {b.discountPercent}%</span>
                        </>
                      ) : null}
                    </span>
                    {b.quantity > 1 ? (
                      <>
                        {' '}
                        <span className="bundle-single-price">
                          {formatPrice(total / b.quantity)}/Pcs
                        </span>
                      </>
                    ) : null}
                  </span>{' '}
                  <span className="bundle-price">
                    {b.quantity > 1 ? (
                      <>
                        <span className="bundle-previous-price">
                          {b.discountPercent ? formatPrice(full) : ''}
                        </span>{' '}
                      </>
                    ) : null}
                    <span className="bundle-total-price">{formatPrice(total)}</span>
                  </span>
                </label>
              </div>
            );
          })}
        </div>
      ) : null}

      <div className="product-btn-wrap">
        <button
          className={btn.className}
          type="button"
          aria-busy={btn['aria-busy']}
          disabled={!product.inStock}
          onClick={addMain}
        >
          {btn.children}
        </button>{' '}
        {/* live ehansmart.com: the cash-on-delivery app's "ORDER NOW" button (its inline styles
            are the app's settings); here it opens the buy-now popup */}
        <div className="cod-btn-wrapper cod-btn-wrapper--product">
          <button
            type="button"
            className="cod-buy-btn cod-animate-shake"
            style={COD_BUTTON_STYLE}
            disabled={!product.inStock}
            onClick={() => setBuyNowOpen(true)}
          >
            <span className="cod-buy-btn__content">
              <span style={{ width: 20, height: 20, display: 'inline-flex' }}>
                <svg
                  width="100%"
                  height="100%"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M16 10a4 4 0 0 1-8 0"></path>
                  <path d="M3.103 6.034h17.794"></path>
                  <path d="M3.4 5.467a2 2 0 0 0-.4 1.2V20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.667a2 2 0 0 0-.4-1.2l-2-2.667A2 2 0 0 0 17 2H7a2 2 0 0 0-1.6.8z"></path>
                </svg>
              </span>
              <span>ORDER NOW</span>
            </span>
          </button>
        </div>
        <div className="product-contact-btn-wrap">
          <a href={`tel:${STORE.phone}`} className="btn product-call-btn">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M6.6 3.5 9 3l2 4-2 1.5a13 13 0 0 0 6.5 6.5L17 13l4 2-.5 2.4a3 3 0 0 1-3.2 2.4C10.4 19 5 13.6 4.2 6.7A3 3 0 0 1 6.6 3.5Z"></path>
              <path d="M15.5 4.5a6 6 0 0 1 4 4"></path>
              <path d="M15.5 7.5a3 3 0 0 1 1.5 1.5"></path>
            </svg>{' '}
            call now
          </a>{' '}
          <a
            href={whatsappOrderUrl(product.name)}
            className="btn product-whatsapp-btn"
            target="_blank"
            rel="noopener"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M20 11.5a8 8 0 0 1-11.8 7L4 20l1.5-4.1A8 8 0 1 1 20 11.5Z"></path>
              <path d="M8.5 8.5c.3-.6.6-.6.9-.1l.7 1.2c.2.3.1.6-.1.8l-.5.5c.6 1.1 1.5 2 2.6 2.6l.5-.5c.2-.2.5-.3.8-.1l1.2.7c.5.3.5.6-.1.9"></path>
            </svg>{' '}
            whatsapp
          </a>
        </div>
      </div>

      {product.buyWith.length ? (
        <div className="product-buy-with">
          <h4 className="product-buy-with-title">Buy it with</h4>
          {product.buyWith.map((p) => (
            <label key={p.id} className="product-buy-with-item">
              <input
                type="checkbox"
                className="product-buy-with-checkbox"
                data-id={p.id}
                checked={buyWith.has(p.id)}
                disabled={!p.inStock}
                onChange={() => toggleBuyWith(p.id)}
              />
              <div className="product-buy-with-img">
                {p.image ? <img src={p.image.url} alt={p.name} /> : null}
              </div>
              <span className="product-buy-with-name">{p.name}</span>{' '}
              <span className="product-buy-with-price">{formatPrice(p.price)}</span>
            </label>
          ))}
        </div>
      ) : null}

      {product.upsells.length ? (
        <div className="product-upsell">
          <h4 className="product-upsell-title-main">
            Complete your {product.category.name.toLowerCase()}
          </h4>
          {product.upsells.map((p) => (
            <div key={p.id} className="product-upsell-item" data-id={p.id}>
              <div className="product-upsell-img">
                {p.image ? <img src={p.image.url} alt={p.name} /> : null}
              </div>
              <div className="product-upsell-content">
                <p className="product-upsell-title">{p.name}</p>
                <div className="product-upsell-bottom">
                  <p className="product-upsell-price">{formatPrice(p.price)}</p>
                  <button
                    className="btn product-upsell-btn quick-view-open"
                    type="button"
                    disabled={!p.inStock}
                    onClick={(e) => openQuickView(p, e.currentTarget)}
                  >
                    add <span>+</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <div className="product-tab">
        <div className="product-tab-nav">
          <button
            className={`product-tab-nav-item${tab === 'description' ? ' active' : ''}`}
            type="button"
            onClick={() => setTab('description')}
          >
            Description
          </button>{' '}
          <button
            className={`product-tab-nav-item${tab === 'specification' ? ' active' : ''}`}
            type="button"
            onClick={() => setTab('specification')}
          >
            Specification
          </button>
        </div>
        <div
          className={`product-tab-panel${tab === 'description' ? ' active' : ''}`}
          id="product-tab-description"
          // descriptionHtml is authored by staff in the admin (trusted content)
          dangerouslySetInnerHTML={{
            __html:
              product.descriptionHtml ??
              `<p>${escapeHtml(product.shortDescription ?? product.name)}</p>`,
          }}
        />
        <div
          className={`product-tab-panel${tab === 'specification' ? ' active' : ''}`}
          id="product-tab-specification"
        >
          <table className="product-spec-table">
            <tbody>
              {product.specifications.map((s) => (
                <tr key={s.label}>
                  <th>{s.label}</th>
                  <td>{s.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Accordion />
    </div>
  );
}

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

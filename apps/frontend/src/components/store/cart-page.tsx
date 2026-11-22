'use client';

import Link from 'next/link';
import { useState } from 'react';
import { formatPrice } from '@/lib/format';
import { type CartItem, useCart } from './providers/cart-store';
import { useIsClient } from './hooks';

function QtyBox({ item, setQty }: { item: CartItem; setQty: (id: string, qty: number) => void }) {
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <div className="product-quantity">
      <button
        className="quantity-decrease"
        type="button"
        aria-label="decrease quantity"
        onClick={() => setQty(item.id, item.qty - 1)}
      >
        <svg width="11" height="2" viewBox="0 0 11 2" fill="none">
          <path
            d="M0.75 0.75H10.0833"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>
      <input
        className="quantity-count"
        type="number"
        min="1"
        max="99"
        inputMode="numeric"
        aria-label="quantity"
        value={draft ?? item.qty}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          if (draft !== null) setQty(item.id, Math.min(99, Math.max(1, parseInt(draft, 10) || 1)));
          setDraft(null);
        }}
      />
      <button
        className="quantity-increase"
        type="button"
        aria-label="increase quantity"
        onClick={() => setQty(item.id, item.qty + 1)}
      >
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
          <path
            d="M0.75 5.41667H10.0833M5.41667 0.75V10.0833"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
}

/** Template cart page: same browser cart as the drawer (quantity / remove / totals). */
export function CartPageView() {
  const { items, total, setQty, remove } = useCart();
  const ready = useIsClient(); // the cart lives in localStorage; avoid flashing "empty" during hydration
  const empty = ready && items.length === 0;

  return (
    <section className="cart-section">
      <div className="container">
        <div className="section-heading-wrapper">
          <h1 className="section-heading">My Shopping Cart</h1>
        </div>
        <div className="cart-page-empty" hidden={!empty}>
          <p className="cart-page-empty-title">Your cart is empty</p>
          <p className="cart-page-empty-text">Looks like you have not added anything yet.</p>
          <Link href="/collections" className="btn primary-btn">
            continue shopping
          </Link>
        </div>
        <div className="cart-wrapper" hidden={empty}>
          <div className="cart-content-wrap">
            <div className="cart-table">
              <div className="cart-table-heading">
                <div className="cart-product-content">
                  <div className="Product">
                    <p className="cart-table-product-title">Product</p>
                  </div>
                </div>
                <div className="cart-product-details">
                  <div className="price">
                    <p className="cart-table-price-title">price</p>
                  </div>
                  <div className="Quantity">
                    <p className="cart-table-quantity-title">Quantity</p>
                  </div>
                  <div className="Subtotal">
                    <p className="cart-table-subtotal-title">Subtotal</p>
                  </div>
                  <div className="cart-remove">
                    <p className="cart-table-cart-remove-title"></p>
                  </div>
                </div>
              </div>
              <div className="cart-product-items">
                {items.map((item) => (
                  <div key={item.id} className="cart-product-item">
                    <div className="cart-product-content">
                      <Link href={item.url} className="cart-product-img">
                        {item.img ? <img src={item.img} alt={item.title} /> : null}
                      </Link>
                      <div className="content">
                        <Link href={item.url} className="title">
                          {item.title}
                        </Link>
                        <div className="cart-product-mobile-details">
                          <div className="price">
                            <p className="cart-product-price">{formatPrice(item.price)}</p>
                          </div>
                          <div className="Quantity">
                            <QtyBox item={item} setQty={setQty} />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="cart-product-details">
                      <div className="price">
                        <p className="cart-product-price">{formatPrice(item.price)}</p>
                      </div>
                      <div className="Quantity">
                        <QtyBox item={item} setQty={setQty} />
                      </div>
                      <div className="Subtotal">
                        <p className="cart-product-subtotal">
                          {formatPrice(item.price * item.qty)}
                        </p>
                      </div>
                      <div className="cart-remove">
                        <button
                          className="cart-product-remove-btn"
                          type="button"
                          aria-label="remove item"
                          onClick={() => remove(item.id)}
                        >
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path
                              d="M12 23C18.0748 23 23 18.0748 23 12C23 5.92525 18.0748 1 12 1C5.92525 1 1 5.92525 1 12C1 18.0748 5.92525 23 12 23Z"
                              stroke="#CCCCCC"
                              strokeMiterlimit="10"
                            />
                            <path
                              d="M16 8L8 16M16 16L8 8"
                              stroke="#666666"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="cart-summary">
            <p className="cart-summary-title">Cart Total</p>
            <div className="cart-summary-items">
              <div className="cart-summary-item">
                <p className="title">Subtotal:</p>
                <p className="price">{formatPrice(total)}</p>
              </div>
              <div className="cart-summary-item">
                <p className="title">Shipping:</p>
                <p className="price">Calculated at checkout</p>
              </div>
              <div className="cart-summary-item summary-total">
                <p className="title">Total:</p>
                <p className="price">{formatPrice(total)}</p>
              </div>
            </div>
            <div className="cart-summary-btn">
              {/* checkout is the next module ported from glowy */}
              <a
                href="#"
                className="btn primary-btn"
                aria-label="go to checkout"
                title="Checkout opens soon"
                aria-disabled="true"
                onClick={(e) => e.preventDefault()}
              >
                Proceed to checkout
                <span></span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

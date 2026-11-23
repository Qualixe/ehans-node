'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatPrice } from '@/lib/format';
import { useCart } from '../providers/cart-store';
import { useStoreUi } from '../providers/store-ui';
import { CloseIcon, TrashIcon } from '../icons';

export function CartDrawer() {
  const { panel, closePanel } = useStoreUi();
  const router = useRouter();
  const { items, count, total, setQty, remove } = useCart();
  const open = panel === 'cart';
  const cls = ['cart-drawer', items.length === 0 ? 'blank' : '', open ? 'active' : '']
    .filter(Boolean)
    .join(' ');

  return (
    <div className={cls}>
      <span className="cart-drawer-close-window-btn" onClick={closePanel}></span>
      <div className={`cart-drawer-inner${open ? ' active' : ''}`}>
        <div className="cart-drawer-top">
          <p className="cart-drawer-title">
            cart{' '}
            <span>
              ({count} {count === 1 ? 'item' : 'items'})
            </span>
          </p>
          <button
            className="cart-drawer-close-btn"
            type="button"
            aria-label="cart drawer close"
            title="close cart"
            onClick={closePanel}
          >
            <CloseIcon />
          </button>
        </div>
        <div className="cart-drawer-content">
          <div className="cart-drawer-items">
            {items.map((item) => (
              <div key={item.id} className="cart-drawer-item">
                <div className="cart-drawer-item-img">
                  {item.img ? <img src={item.img} alt={item.title} /> : null}
                </div>
                <div className="cart-drawer-item-content-wrap">
                  <div className="cart-drawer-item-content-inner">
                    <div className="cart-drawer-item-content">
                      <Link href={item.url} className="cart-drawer-item-title">
                        {item.title}
                      </Link>
                      <div className="content-btm">
                        <div className="cart-drawer-item-qty-btn-wrap">
                          <button
                            className="cart-drawer-item-qty-btn"
                            type="button"
                            aria-label="decrease quantity"
                            onClick={() => setQty(item.id, item.qty - 1)}
                          >
                            -
                          </button>
                          <input
                            type="text"
                            className="cart-drawer-item-qty-input"
                            value={item.qty}
                            readOnly
                          />
                          <button
                            className="cart-drawer-item-qty-btn"
                            type="button"
                            aria-label="increase quantity"
                            onClick={() => setQty(item.id, item.qty + 1)}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="cart-drawer-item-remove-btn-wrap">
                    <button
                      className="cart-drawer-item-remove-btn"
                      type="button"
                      aria-label="remove item"
                      onClick={() => remove(item.id)}
                    >
                      <TrashIcon />
                    </button>
                    <p className="cart-drawer-item-price">{formatPrice(item.price * item.qty)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="cart-drawer-empty">
          <div className="cart-drawer-empty-text">
            <p>Your Cart Is Empty</p>
            <Link href="/collections" className="btn" onClick={closePanel}>
              shop now
            </Link>
          </div>
        </div>
        <div className="cart-drawer-footer">
          <div className="cart-drawer-total-wrap">
            <p className="cart-drawer-total-title">total</p>
            <p className="cart-drawer-total-price">{formatPrice(total)}</p>
          </div>
          <div className="cart-drawer-checkout-btn-wrap">
            <button
              className="btn"
              type="button"
              onClick={() => {
                closePanel();
                router.push('/checkout');
              }}
            >
              secure checkout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

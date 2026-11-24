import { type OrderConfirmation, POS_PAYMENT_METHODS } from '@ehans/shared';
import Link from 'next/link';
import { formatPrice } from '@/lib/format';
import { STORE } from '@/lib/store-config';

const PAYMENT: Record<string, string> = POS_PAYMENT_METHODS;

/** Delivery details + items and totals: the order confirmation and "My orders" order pages. */
export function OrderSummary({ order }: { order: OrderConfirmation }) {
  return (
    <div className="cart-wrapper">
      <div className="cart-content-wrap">
        <div className="buy-now-popup-card checkout-card">
          <p className="cart-summary-title">Delivery details</p>
          <div className="cart-summary-items">
            <div className="cart-summary-item">
              <p className="title">Name:</p>
              <p className="price">{order.customerName}</p>
            </div>
            <div className="cart-summary-item">
              <p className="title">Phone:</p>
              <p className="price">{order.phone}</p>
            </div>
            <div className="cart-summary-item">
              <p className="title">Address:</p>
              <p className="price">
                {order.address}
                {order.city ? `, ${order.city}` : ''}
              </p>
            </div>
            <div className="cart-summary-item">
              <p className="title">Payment:</p>
              <p className="price">{PAYMENT[order.paymentMethod] ?? order.paymentMethod}</p>
            </div>
            {order.note ? (
              <div className="cart-summary-item">
                <p className="title">Note:</p>
                <p className="price">{order.note}</p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
      <aside className="cart-summary" aria-label="Order summary">
        <p className="cart-summary-title">Your order</p>
        <div className="checkout-items">
          {order.items.map((item, i) => (
            <div key={i} className="buy-now-popup-product">
              <div className="buy-now-popup-product-img">
                {item.image ? <img src={item.image} alt={item.name} /> : null}
                <span className="buy-now-popup-qty-badge">{item.quantity}</span>
              </div>
              <div className="buy-now-popup-product-info">
                <p className="buy-now-popup-product-title">
                  {item.name}
                  {item.variantTitle ? ` (${item.variantTitle})` : ''}
                </p>
              </div>
              <p className="buy-now-popup-product-price">{formatPrice(item.lineTotal)}</p>
            </div>
          ))}
        </div>
        <div className="cart-summary-items">
          <div className="cart-summary-item">
            <p className="title">Subtotal:</p>
            <p className="price">{formatPrice(order.subtotal)}</p>
          </div>
          {order.discount ? (
            <div className="cart-summary-item">
              <p className="title">Discount:</p>
              <p className="price">- {formatPrice(order.discount)}</p>
            </div>
          ) : null}
          <div className="cart-summary-item">
            <p className="title">Shipping:</p>
            <p className="price">{order.shippingFee ? formatPrice(order.shippingFee) : 'Free'}</p>
          </div>
          <div className="cart-summary-item summary-total">
            <p className="title">Total:</p>
            <p className="price">{formatPrice(order.total)}</p>
          </div>
        </div>
        <div className="cart-summary-btn">
          <Link href="/collections" className="btn primary-btn">
            continue shopping
          </Link>
        </div>
        <p className="checkout-terms">
          Questions? Call <a href={`tel:${STORE.phone}`}>{STORE.phone}</a>.
        </p>
      </aside>
    </div>
  );
}

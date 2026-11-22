// Generated from design/ehans-mart/faq.html (markup kept verbatim). Edit freely.
import Link from 'next/link';

export function FaqContent() {
  return (
    <>
      <section className="about-hero-section about-hero-compact faq-hero-section">
        <div className="container">
          <div className="about-hero-inner">
            <h1 className="about-hero-title">
              Help <span>Center</span>
            </h1>
            <form className="faq-search" role="search">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="7"></circle>
                <path d="m20 20-3.5-3.5"></path>
              </svg>{' '}
              <input
                type="search"
                className="faq-search-input"
                placeholder="Search a question… e.g. delivery charge"
                aria-label="Search FAQ"
              />{' '}
              <button type="button" className="faq-search-clear" aria-label="Clear search" hidden>
                ✕
              </button>
            </form>
          </div>
        </div>
      </section>
      <section className="faq-section">
        <div className="container">
          <div className="faq-tabs" role="tablist" aria-label="FAQ categories">
            <button type="button" className="faq-tab active" data-faq-tab="all">
              All <span className="faq-tab-count"></span>
            </button>{' '}
            <button type="button" className="faq-tab" data-faq-tab="order">
              Orders <span className="faq-tab-count"></span>
            </button>{' '}
            <button type="button" className="faq-tab" data-faq-tab="delivery">
              Delivery <span className="faq-tab-count"></span>
            </button>{' '}
            <button type="button" className="faq-tab" data-faq-tab="payment">
              Payment <span className="faq-tab-count"></span>
            </button>{' '}
            <button type="button" className="faq-tab" data-faq-tab="return">
              Return & Exchange <span className="faq-tab-count"></span>
            </button>{' '}
            <button type="button" className="faq-tab" data-faq-tab="product">
              Products <span className="faq-tab-count"></span>
            </button>
          </div>
          <div className="faq-items">
            <details className="faq-item" data-faq-cat="order" open>
              <summary>
                <span className="faq-item-tag">Orders</span>
                How do I place an order?
              </summary>
              <div className="faq-item-answer">
                <p>
                  Open the product, choose the option or pack you want and click{' '}
                  <strong>Buy Now</strong>. Give your name, phone number and full address, then
                  confirm the order. You can also call or WhatsApp us at +8801841650668 to order.
                </p>
              </div>
            </details>
            <details className="faq-item" data-faq-cat="order">
              <summary>
                <span className="faq-item-tag">Orders</span>
                Do I need an account to order?
              </summary>
              <div className="faq-item-answer">
                <p>
                  No. You can order as a guest — only your name, phone number and address are
                  needed.
                </p>
              </div>
            </details>
            <details className="faq-item" data-faq-cat="order">
              <summary>
                <span className="faq-item-tag">Orders</span>
                How do I know my order is confirmed?
              </summary>
              <div className="faq-item-answer">
                <p>
                  After you place an order, our team calls you to confirm the product, quantity and
                  address before we dispatch the parcel. Please keep your phone on.
                </p>
              </div>
            </details>
            <details className="faq-item" data-faq-cat="order">
              <summary>
                <span className="faq-item-tag">Orders</span>
                Can I change or cancel my order?
              </summary>
              <div className="faq-item-answer">
                <p>
                  Yes, before the parcel is shipped. Just tell us on the confirmation call, or call
                  / WhatsApp us as soon as possible.
                </p>
              </div>
            </details>
            <details className="faq-item" data-faq-cat="delivery">
              <summary>
                <span className="faq-item-tag">Delivery</span>
                How long does delivery take?
              </summary>
              <div className="faq-item-answer">
                <p>
                  Inside Dhaka usually <strong>1–2 days</strong> and outside Dhaka{' '}
                  <strong>2–4 days</strong> after your order is confirmed. Holidays or bad weather
                  can cause small delays.
                </p>
              </div>
            </details>
            <details className="faq-item" data-faq-cat="delivery">
              <summary>
                <span className="faq-item-tag">Delivery</span>
                How much is the delivery charge?
              </summary>
              <div className="faq-item-answer">
                <p>
                  <strong>Tk 80</strong> inside Dhaka and <strong>Tk 130</strong> outside Dhaka.
                  Some bundle offers (like “Buy 3”) include free delivery.
                </p>
              </div>
            </details>
            <details className="faq-item" data-faq-cat="delivery">
              <summary>
                <span className="faq-item-tag">Delivery</span>
                Do you deliver all over Bangladesh?
              </summary>
              <div className="faq-item-answer">
                <p>Yes. We deliver to all 64 districts through trusted courier partners.</p>
              </div>
            </details>
            <details className="faq-item" data-faq-cat="delivery">
              <summary>
                <span className="faq-item-tag">Delivery</span>
                Can I check the product before paying?
              </summary>
              <div className="faq-item-answer">
                <p>
                  Yes. Please open and check the parcel in front of the delivery person, then pay.
                  If anything is wrong, tell us right away.
                </p>
              </div>
            </details>
            <details className="faq-item" data-faq-cat="payment">
              <summary>
                <span className="faq-item-tag">Payment</span>
                Which payment methods do you accept?
              </summary>
              <div className="faq-item-answer">
                <p>
                  We offer <strong>Cash on Delivery</strong> all over Bangladesh. You can also pay
                  by bKash or Nagad if you prefer — ask our team on the confirmation call.
                </p>
              </div>
            </details>
            <details className="faq-item" data-faq-cat="payment">
              <summary>
                <span className="faq-item-tag">Payment</span>
                Do I have to pay in advance?
              </summary>
              <div className="faq-item-answer">
                <p>
                  No advance payment is needed. You pay only when the product reaches your hands.
                </p>
              </div>
            </details>
            <details className="faq-item" data-faq-cat="payment">
              <summary>
                <span className="faq-item-tag">Payment</span>
                Are there any hidden charges?
              </summary>
              <div className="faq-item-answer">
                <p>
                  No. You pay the product price plus the delivery charge shown at checkout — nothing
                  else.
                </p>
              </div>
            </details>
            <details className="faq-item" data-faq-cat="return">
              <summary>
                <span className="faq-item-tag">Return</span>
                Can I return a product?
              </summary>
              <div className="faq-item-answer">
                <p>
                  Yes. If the product is unused and in its original box, you can request a return
                  within <strong>7 days</strong> of delivery. Products damaged by misuse or water
                  cannot be returned.{' '}
                  <Link href="/policies/privacy-policy#refund">Read the return policy →</Link>
                </p>
              </div>
            </details>
            <details className="faq-item" data-faq-cat="return">
              <summary>
                <span className="faq-item-tag">Return</span>I received a wrong or damaged product.
                What now?
              </summary>
              <div className="faq-item-answer">
                <p>
                  Sorry about that! Call or WhatsApp us with your order number and a photo of the
                  product. We will replace it or refund you, and we cover the return delivery
                  charge.
                </p>
              </div>
            </details>
            <details className="faq-item" data-faq-cat="return">
              <summary>
                <span className="faq-item-tag">Exchange</span>
                Can I exchange for another size or colour?
              </summary>
              <div className="faq-item-answer">
                <p>
                  Yes, within 7 days of delivery if the product is unused.{' '}
                  <Link href="/policies/privacy-policy#exchange">See how exchange works →</Link>
                </p>
              </div>
            </details>
            <details className="faq-item" data-faq-cat="return">
              <summary>
                <span className="faq-item-tag">Refund</span>
                How long does a refund take?
              </summary>
              <div className="faq-item-answer">
                <p>
                  After we receive and check the returned product, the refund is sent within 3–7
                  working days by bKash, Nagad or bank transfer.
                </p>
              </div>
            </details>
            <details className="faq-item" data-faq-cat="product">
              <summary>
                <span className="faq-item-tag">Products</span>
                Are your products quality checked?
              </summary>
              <div className="faq-item-answer">
                <p>
                  Yes. Every product is checked by our team before it is packed and shipped from our
                  hub in Rangpur.
                </p>
              </div>
            </details>
            <details className="faq-item" data-faq-cat="product">
              <summary>
                <span className="faq-item-tag">Products</span>
                Will the product look the same as the picture?
              </summary>
              <div className="faq-item-answer">
                <p>
                  We use real product photos. The colour can look slightly different because of
                  screen light and settings.
                </p>
              </div>
            </details>
            <details className="faq-item" data-faq-cat="product">
              <summary>
                <span className="faq-item-tag">Products</span>A product is out of stock. When will
                it be back?
              </summary>
              <div className="faq-item-answer">
                <p>
                  Most products are restocked quickly. Message us on WhatsApp and we will let you
                  know as soon as it is available.
                </p>
              </div>
            </details>
            {/* no result */}
            <div className="faq-empty" hidden>
              <p className="faq-empty-title">No answer found</p>
              <p className="faq-empty-text">
                Try another word, or ask us directly — we reply fast.
              </p>
              <a
                href="https://wa.me/8801841650668"
                className="btn faq-empty-btn"
                target="_blank"
                rel="noopener"
              >
                ask on whatsapp
              </a>
            </div>
          </div>
        </div>
      </section>
      <section className="about-cta-section faq-help-section">
        <div className="container">
          <div className="about-cta-inner">
            <div className="about-cta-content">
              <span className="about-pill">
                <i>✦</i> still have questions?
              </span>
              <h2 className="about-cta-title">
                Talk To Our <span>Support Team</span>
              </h2>
              <ul className="about-cta-contact">
                <li>
                  <strong>Phone:</strong> <a href="tel:+8801841650668">+8801841650668</a>
                </li>
                <li>
                  <strong>Email:</strong> <a href="mailto:info@ehansmart.com">info@ehansmart.com</a>
                </li>
                <li>
                  <strong>Open:</strong> 24 hours a day, 7 days a week
                </li>
              </ul>
            </div>
            <div className="about-cta-btns">
              <Link href="/contact" className="btn about-btn-primary">
                contact us
              </Link>{' '}
              <a
                href="https://wa.me/8801841650668"
                className="btn about-btn-outline"
                target="_blank"
                rel="noopener"
              >
                whatsapp us
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

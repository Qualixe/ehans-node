// Generated from design/ehans-mart/about.html (markup kept verbatim). Edit freely.
import Link from 'next/link';

export function AboutContent() {
  return (
    <>
      <section className="about-hero-section about-hero-compact">
        <div className="container">
          <div className="about-hero-inner">
            <h1 className="about-hero-title">
              About <span>Us</span>
            </h1>
          </div>
        </div>
      </section>
      <section className="about-story-section">
        <div className="container">
          <div className="about-story-wrapper">
            <div className="about-story-img">
              <img
                src="/assets/images/category-home-kitchen.jpg"
                alt="Ehans Mart home and kitchen products"
                loading="lazy"
              />
              <div className="about-story-badge">
                <strong>2024</strong> <span>since</span>
              </div>
            </div>
            <div className="about-story-content">
              <p className="about-subtitle">our story</p>
              <h2 className="about-title">Who We Are</h2>
              <p className="about-text">
                Ehans Mart is a Bangladeshi online shop that started its journey in 2024 with one
                simple goal — to make everyday shopping easy, safe and smart for every family.
              </p>
              <p className="about-text">
                From baby care and home & kitchen to women’s and men’s essentials, we hand-pick
                useful products that solve real daily problems. Every order is checked before it
                leaves our hub in Rangpur, and you pay only when the product reaches your hands.
              </p>
              <blockquote className="about-quote">
                “২০২৪ সাল থেকে নিরবচ্ছিন্নভাবে মানসম্মত পণ্য ও বিশ্বস্ত সেবার মাধ্যমে আমরা ১০০,০০০+ সন্তুষ্ট
                ক্রেতার আস্থা অর্জন করে আসছি।”
              </blockquote>
            </div>
          </div>
        </div>
      </section>
      <section className="about-stats-section">
        <div className="container">
          <div className="about-stats-items">
            <div className="about-stats-item">
              <p className="about-stats-number" data-count="100" data-suffix="K+">
                100K+
              </p>
              <p className="about-stats-label">Happy customers</p>
            </div>
            <div className="about-stats-item">
              <p className="about-stats-number" data-count="45" data-suffix="+">
                45+
              </p>
              <p className="about-stats-label">Useful products</p>
            </div>
            <div className="about-stats-item">
              <p className="about-stats-number" data-count="8" data-suffix="">
                8
              </p>
              <p className="about-stats-label">Product categories</p>
            </div>
            <div className="about-stats-item">
              <p className="about-stats-number" data-count="64" data-suffix="">
                64
              </p>
              <p className="about-stats-label">Districts we deliver to</p>
            </div>
          </div>
        </div>
      </section>
      <section className="about-feature-section">
        <div className="container">
          <div className="about-heading">
            <p className="about-subtitle">why choose us</p>
            <h2 className="about-title">Shopping Made Simple & Safe</h2>
          </div>
          <div className="about-feature-items">
            <div className="about-feature-item">
              <span className="about-feature-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z"></path>
                  <path d="M3 7.5 12 12l9-4.5M12 12v9"></path>
                </svg>
              </span>
              <h3 className="about-feature-title">Cash On Delivery</h3>
              <p className="about-feature-text">
                Check the product first, then pay. No advance payment needed.
              </p>
            </div>
            <div className="about-feature-item">
              <span className="about-feature-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M4 12a8 8 0 1 0 2.3-5.6M4 4v4h4"></path>
                </svg>
              </span>
              <h3 className="about-feature-title">Easy Return</h3>
              <p className="about-feature-text">
                Not happy with your order? Return it easily — no stress, no hassle.
              </p>
            </div>
            <div className="about-feature-item">
              <span className="about-feature-icon">
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M13.5 2 5 13.5h6L9.5 22 19 9.5h-6z"></path>
                </svg>
              </span>
              <h3 className="about-feature-title">Fast Delivery</h3>
              <p className="about-feature-text">
                Quick delivery inside and outside Dhaka, right to your door.
              </p>
            </div>
            <div className="about-feature-item">
              <span className="about-feature-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M12 3 4 6v6c0 4.4 3.4 8.1 8 9 4.6-.9 8-4.6 8-9V6z"></path>
                  <path d="m8.5 12 2.5 2.5 4.5-5"></path>
                </svg>
              </span>
              <h3 className="about-feature-title">Quality Checked</h3>
              <p className="about-feature-text">
                Every product is checked by our team before it is packed and shipped.
              </p>
            </div>
          </div>
        </div>
      </section>
      <section className="about-category-section">
        <div className="container">
          <div className="about-heading about-heading-row">
            <div>
              <p className="about-subtitle">what we offer</p>
              <h2 className="about-title">Explore Our Collections</h2>
            </div>
            <Link href="/collections" className="btn about-view-all">
              view all products
            </Link>
          </div>
          <div className="about-category-items">
            <Link href="/collections" className="about-category-item">
              <img src="/assets/images/category-baby-care.jpg" alt="Baby Care" loading="lazy" />{' '}
              <span className="about-category-name">Baby Care</span>
            </Link>{' '}
            <Link href="/collections" className="about-category-item">
              <img
                src="/assets/images/category-home-kitchen.jpg"
                alt="Home & Kitchen"
                loading="lazy"
              />{' '}
              <span className="about-category-name">Home & Kitchen</span>
            </Link>{' '}
            <Link href="/collections" className="about-category-item">
              <img
                src="/assets/images/category-womens-essentials.jpg"
                alt="Women’s Essentials"
                loading="lazy"
              />{' '}
              <span className="about-category-name">Women’s Essentials</span>
            </Link>{' '}
            <Link href="/collections" className="about-category-item">
              <img
                src="/assets/images/category-mens-essentials.jpg"
                alt="Man’s Essentials"
                loading="lazy"
              />{' '}
              <span className="about-category-name">Man’s Essentials</span>
            </Link>
          </div>
        </div>
      </section>
      <section className="about-mission-section">
        <div className="container">
          <div className="about-mission-wrapper">
            <div className="about-mission-content">
              <p className="about-subtitle">our goal</p>
              <h2 className="about-title">Mission & Vision</h2>
              <div className="about-mission-item">
                <h3 className="about-mission-title">Our Mission</h3>
                <p className="about-text">
                  সহজ, নিরাপদ ও স্মার্ট অনলাইন শপিং অভিজ্ঞতা দেওয়াই আমাদের মূল লক্ষ্য। We want every
                  customer to get the right product at a fair price, with honest information and no
                  surprises.
                </p>
              </div>
              <div className="about-mission-item">
                <h3 className="about-mission-title">Our Vision</h3>
                <p className="about-text">
                  To become the most trusted everyday-shopping brand in Bangladesh — the first place
                  a family thinks of for home, kitchen, baby and personal care needs.
                </p>
              </div>
            </div>
            <div className="about-mission-img">
              <img
                src="/assets/images/category-womens-essentials.jpg"
                alt="Ehans Mart customer"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>
      <section className="about-process-section">
        <div className="container">
          <div className="about-heading">
            <p className="about-subtitle">how it works</p>
            <h2 className="about-title">From Click To Your Door</h2>
          </div>
          <div className="about-process-items">
            <div className="about-process-item">
              <span className="about-process-step">01</span>
              <h3 className="about-process-title">Choose Product</h3>
              <p className="about-process-text">
                Browse our collections and add what you need to the cart.
              </p>
            </div>
            <div className="about-process-item">
              <span className="about-process-step">02</span>
              <h3 className="about-process-title">Place Order</h3>
              <p className="about-process-text">
                Give your name, phone and address — no online payment needed.
              </p>
            </div>
            <div className="about-process-item">
              <span className="about-process-step">03</span>
              <h3 className="about-process-title">Confirmation Call</h3>
              <p className="about-process-text">
                Our team calls you to confirm the order before dispatch.
              </p>
            </div>
            <div className="about-process-item">
              <span className="about-process-step">04</span>
              <h3 className="about-process-title">Receive & Pay</h3>
              <p className="about-process-text">
                Get your parcel, check it, then pay cash on delivery.
              </p>
            </div>
          </div>
        </div>
      </section>
      <section className="about-cta-section">
        <div className="container">
          <div className="about-cta-inner">
            <div className="about-cta-content">
              <span className="about-pill">
                <i>✦</i> we are here to help
              </span>
              <h2 className="about-cta-title">
                Have A Question? <span>Talk To Us</span>
              </h2>
              <ul className="about-cta-contact">
                <li>
                  <strong>Address:</strong> Kaunia, Rangpur 5400, Bangladesh
                </li>
                <li>
                  <strong>Phone:</strong> <a href="tel:+8801841650668">+8801841650668</a>
                </li>
                <li>
                  <strong>Email:</strong> <a href="mailto:info@ehansmart.com">info@ehansmart.com</a>
                </li>
              </ul>
            </div>
            <div className="about-cta-btns">
              <Link href="/contact" className="btn about-btn-primary">
                contact us
              </Link>{' '}
              <Link href="/collections" className="btn about-btn-outline">
                start shopping
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

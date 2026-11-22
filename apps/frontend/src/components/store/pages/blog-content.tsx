// Generated from design/ehans-mart/blog.html (markup kept verbatim). Edit freely.
import Link from 'next/link';

export function BlogContent() {
  return (
    <>
      <section className="about-hero-section about-hero-compact blog-hero-section">
        <div className="container">
          <div className="about-hero-inner">
            <h1 className="about-hero-title">
              Our <span>Blog</span>
            </h1>
            <form className="blog-search" role="search">
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
                className="blog-search-input"
                placeholder="Search articles… e.g. kitchen, baby"
                aria-label="Search articles"
              />
            </form>
          </div>
        </div>
      </section>
      <section className="blog-featured-section">
        <div className="container">
          <article className="blog-featured">
            <Link href="/blog/sample-post" className="blog-featured-img">
              <img
                src="/assets/images/ehans-product-267-1.jpg"
                alt="Refrigerator child lock for baby safety"
                loading="lazy"
              />{' '}
              <span className="blog-featured-badge">featured</span>
            </Link>
            <div className="blog-featured-content">
              <p className="blog-meta">
                <span className="blog-meta-cat">Baby Care</span>
                <span>Oct 15, 2026</span>
                <span>6 min read</span>
              </p>
              <h2 className="blog-featured-title">
                <Link href="/blog/sample-post">7 Easy Ways To Baby-Proof Your Home Today</Link>
              </h2>
              <p className="blog-featured-text">
                When your baby starts crawling, every drawer, fridge and door becomes an adventure.
                These 7 simple steps — from child locks to safety helmets — help you keep your
                little one safe without turning your home upside down.
              </p>
              <ul className="blog-featured-points">
                <li>Lock the fridge, cabinets and drawers</li>
                <li>Use door stoppers and corner guards</li>
                <li>Protect the head while learning to walk</li>
              </ul>
              <div className="blog-author">
                <span className="blog-author-avatar">EM</span>
                <div>
                  <p className="blog-author-name">Ehans Mart Team</p>
                  <p className="blog-author-role">Baby care & safety</p>
                </div>
                <Link href="/blog/sample-post" className="btn blog-featured-btn">
                  read article
                </Link>
              </div>
            </div>
          </article>
        </div>
      </section>
      <section className="blog-section">
        <div className="container">
          <div className="about-heading about-heading-row">
            <div>
              <p className="about-subtitle">latest articles</p>
              <h2 className="about-title">From Our Blog</h2>
            </div>
            <div className="blog-tabs" role="tablist" aria-label="Blog categories">
              <button type="button" className="blog-tab active" data-blog-tab="all">
                All
              </button>{' '}
              <button type="button" className="blog-tab" data-blog-tab="baby">
                Baby Care
              </button>{' '}
              <button type="button" className="blog-tab" data-blog-tab="kitchen">
                Home & Kitchen
              </button>{' '}
              <button type="button" className="blog-tab" data-blog-tab="beauty">
                Beauty
              </button>{' '}
              <button type="button" className="blog-tab" data-blog-tab="guide">
                Buying Guide
              </button>
            </div>
          </div>
          <div className="blog-items">
            <article className="blog-card" data-blog-cat="kitchen">
              <Link href="/blog/sample-post" className="blog-card-img">
                <img
                  src="/assets/images/ehans-product-260-1.jpg"
                  alt="Kitchen Cleaning Made Easy: Remove Oil Stains In Minutes"
                  loading="lazy"
                />{' '}
                <span className="blog-card-tag">Home & Kitchen</span>
              </Link>
              <div className="blog-card-content">
                <p className="blog-meta">
                  <span>Oct 12, 2026</span>
                  <span>4 min read</span>
                </p>
                <h3 className="blog-card-title">
                  <Link href="/blog/sample-post">
                    Kitchen Cleaning Made Easy: Remove Oil Stains In Minutes
                  </Link>
                </h3>
                <p className="blog-card-text">
                  Greasy stove, tiles and exhaust fan? Here is a simple 3-step routine with foam
                  spray that saves time and keeps your kitchen shining.
                </p>
                <Link href="/blog/sample-post" className="blog-read-more">
                  read more <span aria-hidden="true">→</span>
                </Link>
              </div>
            </article>
            <article className="blog-card" data-blog-cat="kitchen">
              <Link href="/blog/sample-post" className="blog-card-img">
                <img
                  src="/assets/images/ehans-product-263-1.jpg"
                  alt="How To Organize Your Drawers In Just 10 Minutes"
                  loading="lazy"
                />{' '}
                <span className="blog-card-tag">Home & Kitchen</span>
              </Link>
              <div className="blog-card-content">
                <p className="blog-meta">
                  <span>Oct 08, 2026</span>
                  <span>3 min read</span>
                </p>
                <h3 className="blog-card-title">
                  <Link href="/blog/sample-post">
                    How To Organize Your Drawers In Just 10 Minutes
                  </Link>
                </h3>
                <p className="blog-card-text">
                  Messy drawers waste time every day. Use storage partitions to give every spoon,
                  sock and charger its own place.
                </p>
                <Link href="/blog/sample-post" className="blog-read-more">
                  read more <span aria-hidden="true">→</span>
                </Link>
              </div>
            </article>
            <article className="blog-card" data-blog-cat="baby">
              <Link href="/blog/sample-post" className="blog-card-img">
                <img
                  src="/assets/images/ehans-product-252-1.jpg"
                  alt="Safe Travel With Kids: Why A Riding Belt Matters"
                  loading="lazy"
                />{' '}
                <span className="blog-card-tag">Baby Care</span>
              </Link>
              <div className="blog-card-content">
                <p className="blog-meta">
                  <span>Oct 04, 2026</span>
                  <span>5 min read</span>
                </p>
                <h3 className="blog-card-title">
                  <Link href="/blog/sample-post">
                    Safe Travel With Kids: Why A Riding Belt Matters
                  </Link>
                </h3>
                <p className="blog-card-text">
                  Taking your child on a bike or rickshaw? Learn how a baby riding safety belt keeps
                  little ones secure on every ride.
                </p>
                <Link href="/blog/sample-post" className="blog-read-more">
                  read more <span aria-hidden="true">→</span>
                </Link>
              </div>
            </article>
            <article className="blog-card" data-blog-cat="baby">
              <Link href="/blog/sample-post" className="blog-card-img">
                <img
                  src="/assets/images/ehans-product-251-1.jpg"
                  alt="Summer Care For Babies: Protect Them From Sun and Heat"
                  loading="lazy"
                />{' '}
                <span className="blog-card-tag">Baby Care</span>
              </Link>
              <div className="blog-card-content">
                <p className="blog-meta">
                  <span>Sep 28, 2026</span>
                  <span>4 min read</span>
                </p>
                <h3 className="blog-card-title">
                  <Link href="/blog/sample-post">
                    Summer Care For Babies: Protect Them From Sun & Heat
                  </Link>
                </h3>
                <p className="blog-card-text">
                  Hot days are hard on little skin. Simple habits — a sun hat, light clothes and
                  enough water — make a big difference.
                </p>
                <Link href="/blog/sample-post" className="blog-read-more">
                  read more <span aria-hidden="true">→</span>
                </Link>
              </div>
            </article>
            <article className="blog-card" data-blog-cat="guide">
              <Link href="/blog/sample-post" className="blog-card-img">
                <img
                  src="/assets/images/ehans-product-274-1.jpg"
                  alt="Regular vs Premium Kitchen Apron: Which One Should You Buy?"
                  loading="lazy"
                />{' '}
                <span className="blog-card-tag">Buying Guide</span>
              </Link>
              <div className="blog-card-content">
                <p className="blog-meta">
                  <span>Sep 22, 2026</span>
                  <span>3 min read</span>
                </p>
                <h3 className="blog-card-title">
                  <Link href="/blog/sample-post">
                    Regular vs Premium Kitchen Apron: Which One Should You Buy?
                  </Link>
                </h3>
                <p className="blog-card-text">
                  Compare fabric, pockets and water protection to choose the apron that fits your
                  cooking style and budget.
                </p>
                <Link href="/blog/sample-post" className="blog-read-more">
                  read more <span aria-hidden="true">→</span>
                </Link>
              </div>
            </article>
            <article className="blog-card" data-blog-cat="baby">
              <Link href="/blog/sample-post" className="blog-card-img">
                <img
                  src="/assets/images/ehans-product-253-1.jpg"
                  alt="5 Healthy Tiffin Ideas Your Kids Will Love"
                  loading="lazy"
                />{' '}
                <span className="blog-card-tag">Baby Care</span>
              </Link>
              <div className="blog-card-content">
                <p className="blog-meta">
                  <span>Sep 16, 2026</span>
                  <span>4 min read</span>
                </p>
                <h3 className="blog-card-title">
                  <Link href="/blog/sample-post">5 Healthy Tiffin Ideas Your Kids Will Love</Link>
                </h3>
                <p className="blog-card-text">
                  Quick, healthy and tasty tiffin ideas for school days — plus how to keep food
                  fresh until lunch time.
                </p>
                <Link href="/blog/sample-post" className="blog-read-more">
                  read more <span aria-hidden="true">→</span>
                </Link>
              </div>
            </article>
            <article className="blog-card" data-blog-cat="beauty">
              <Link href="/blog/sample-post" className="blog-card-img">
                <img
                  src="/assets/images/ehans-product-285-1.jpg"
                  alt="An Easy Hair Oil Routine For Healthy, Strong Hair"
                  loading="lazy"
                />{' '}
                <span className="blog-card-tag">Beauty & Lifestyle</span>
              </Link>
              <div className="blog-card-content">
                <p className="blog-meta">
                  <span>Sep 10, 2026</span>
                  <span>3 min read</span>
                </p>
                <h3 className="blog-card-title">
                  <Link href="/blog/sample-post">
                    An Easy Hair Oil Routine For Healthy, Strong Hair
                  </Link>
                </h3>
                <p className="blog-card-text">
                  Oiling the scalp the right way helps reduce hair fall. See how an applicator comb
                  makes it quick and mess-free.
                </p>
                <Link href="/blog/sample-post" className="blog-read-more">
                  read more <span aria-hidden="true">→</span>
                </Link>
              </div>
            </article>
            <article className="blog-card" data-blog-cat="kitchen">
              <Link href="/blog/sample-post" className="blog-card-img">
                <img
                  src="/assets/images/ehans-product-255-1.jpg"
                  alt="Keep Dust, Noise and Insects Out With Door Foam"
                  loading="lazy"
                />{' '}
                <span className="blog-card-tag">Home & Kitchen</span>
              </Link>
              <div className="blog-card-content">
                <p className="blog-meta">
                  <span>Sep 03, 2026</span>
                  <span>3 min read</span>
                </p>
                <h3 className="blog-card-title">
                  <Link href="/blog/sample-post">
                    Keep Dust, Noise & Insects Out With Door Foam
                  </Link>
                </h3>
                <p className="blog-card-text">
                  The gap under your door lets in dust, mosquitoes and noise. Door foam is a cheap,
                  2-minute fix for a cleaner home.
                </p>
                <Link href="/blog/sample-post" className="blog-read-more">
                  read more <span aria-hidden="true">→</span>
                </Link>
              </div>
            </article>
            <article className="blog-card" data-blog-cat="beauty">
              <Link href="/blog/sample-post" className="blog-card-img">
                <img
                  src="/assets/images/ehans-product-283-1.jpg"
                  alt="Cute Hair Clip Styles For Little Girls"
                  loading="lazy"
                />{' '}
                <span className="blog-card-tag">Beauty & Lifestyle</span>
              </Link>
              <div className="blog-card-content">
                <p className="blog-meta">
                  <span>Aug 27, 2026</span>
                  <span>2 min read</span>
                </p>
                <h3 className="blog-card-title">
                  <Link href="/blog/sample-post">Cute Hair Clip Styles For Little Girls</Link>
                </h3>
                <p className="blog-card-text">
                  From tulip bows to lily princess clips — easy hairstyles for school, parties and
                  Eid that take less than a minute.
                </p>
                <Link href="/blog/sample-post" className="blog-read-more">
                  read more <span aria-hidden="true">→</span>
                </Link>
              </div>
            </article>
            <article className="blog-card" data-blog-cat="guide">
              <Link href="/blog/sample-post" className="blog-card-img">
                <img
                  src="/assets/images/ehans-product-293-1.jpg"
                  alt="Cook Healthier With Less Oil: A Smart Oil Dispenser Guide"
                  loading="lazy"
                />{' '}
                <span className="blog-card-tag">Buying Guide</span>
              </Link>
              <div className="blog-card-content">
                <p className="blog-meta">
                  <span>Aug 20, 2026</span>
                  <span>4 min read</span>
                </p>
                <h3 className="blog-card-title">
                  <Link href="/blog/sample-post">
                    Cook Healthier With Less Oil: A Smart Oil Dispenser Guide
                  </Link>
                </h3>
                <p className="blog-card-text">
                  Pouring straight from the bottle wastes oil. A 2-in-1 dispenser helps you control
                  every drop and eat healthier.
                </p>
                <Link href="/blog/sample-post" className="blog-read-more">
                  read more <span aria-hidden="true">→</span>
                </Link>
              </div>
            </article>
          </div>
          <div className="blog-empty" hidden>
            <p className="blog-empty-title">No articles found</p>
            <p className="blog-empty-text">Try another word or category.</p>
          </div>
          <div className="blog-more">
            <button type="button" className="btn blog-more-btn">
              load more articles
            </button>
          </div>
        </div>
      </section>
      <section className="blog-newsletter-section">
        <div className="container">
          <div className="blog-newsletter">
            <div className="blog-newsletter-content">
              <p className="about-subtitle">stay updated</p>
              <h2 className="about-title">Get New Tips & Offers First</h2>
              <p className="about-text">
                Join our list for helpful guides, new arrivals and special discounts. No spam — only
                useful stuff, once a week.
              </p>
            </div>
            <form className="blog-newsletter-form" noValidate>
              <div className="blog-newsletter-field">
                <input
                  type="email"
                  name="email"
                  placeholder="Enter your email address"
                  aria-label="Email address"
                  autoComplete="email"
                />{' '}
                <button type="submit" className="btn blog-newsletter-btn">
                  subscribe
                </button>
              </div>
              <p className="blog-newsletter-msg" aria-live="polite"></p>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}

// Generated from design/ehans-mart/contact.html (markup kept verbatim). Edit freely.

export function ContactContent() {
  return (
    <>
      <section className="about-hero-section about-hero-compact contact-hero-section">
        <div className="container">
          <div className="about-hero-inner">
            <h1 className="about-hero-title">
              Contact <span>Us</span>
            </h1>
          </div>
        </div>
      </section>
      <section className="contact-info-section">
        <div className="container">
          <div className="contact-info-items">
            <a href="tel:+8801841650668" className="contact-info-item">
              <span className="contact-info-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M6.6 3.5 9 3l2 4-2 1.5a13 13 0 0 0 6.5 6.5L17 13l4 2-.5 2.4a3 3 0 0 1-3.2 2.4C10.4 19 5 13.6 4.2 6.7A3 3 0 0 1 6.6 3.5Z"></path>
                </svg>
              </span>
              <p className="contact-info-title">Call Us</p>
              <p className="contact-info-text">+8801841650668</p>
              <span className="contact-info-link">call now →</span>
            </a>{' '}
            <a
              href="https://wa.me/8801841650668"
              className="contact-info-item"
              target="_blank"
              rel="noopener"
            >
              <span className="contact-info-icon">
                <svg
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
                </svg>
              </span>
              <p className="contact-info-title">WhatsApp</p>
              <p className="contact-info-text">Chat with our team</p>
              <span className="contact-info-link">start chat →</span>
            </a>{' '}
            <a href="mailto:info@ehansmart.com" className="contact-info-item">
              <span className="contact-info-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="3" y="5" width="18" height="14" rx="2"></rect>
                  <path d="m3 7 9 6 9-6"></path>
                </svg>
              </span>
              <p className="contact-info-title">Email Us</p>
              <p className="contact-info-text">info@ehansmart.com</p>
              <span className="contact-info-link">send email →</span>
            </a>{' '}
            <a
              href="https://maps.google.com/?q=Kaunia,+Rangpur+5400,+Bangladesh"
              className="contact-info-item"
              target="_blank"
              rel="noopener"
            >
              <span className="contact-info-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M12 21s-7-6.1-7-11.5a7 7 0 0 1 14 0C19 14.9 12 21 12 21Z"></path>
                  <circle cx="12" cy="9.5" r="2.5"></circle>
                </svg>
              </span>
              <p className="contact-info-title">Visit Us</p>
              <p className="contact-info-text">Kaunia, Rangpur 5400, Bangladesh</p>
              <span className="contact-info-link">get directions →</span>
            </a>
          </div>
        </div>
      </section>
      <section className="contact-section">
        <div className="container">
          <div className="contact-wrapper">
            <div className="contact-form-box">
              <p className="about-subtitle">send a message</p>
              <h2 className="about-title">Get In Touch</h2>
              <p className="about-text">
                Fill in the form and our team will get back to you as soon as possible.
              </p>
              <form className="contact-form" noValidate>
                <div className="contact-field-row">
                  <div className="contact-field-col">
                    <label htmlFor="contact_name">Name*</label>{' '}
                    <input
                      type="text"
                      id="contact_name"
                      name="name"
                      placeholder="Your name"
                      autoComplete="name"
                    />
                    <p className="contact-error">Please enter your name</p>
                  </div>
                  <div className="contact-field-col">
                    <label htmlFor="contact_phone">Phone*</label>{' '}
                    <input
                      type="tel"
                      id="contact_phone"
                      name="phone"
                      placeholder="01XXXXXXXXX"
                      inputMode="numeric"
                      autoComplete="tel"
                    />
                    <p className="contact-error">Enter a valid 11-digit mobile number</p>
                  </div>
                </div>
                <div className="contact-field-row">
                  <div className="contact-field-col">
                    <label htmlFor="contact_email">Email</label>{' '}
                    <input
                      type="email"
                      id="contact_email"
                      name="email"
                      placeholder="you@example.com"
                      autoComplete="email"
                    />
                    <p className="contact-error">Enter a valid email address</p>
                  </div>
                  <div className="contact-field-col">
                    <label htmlFor="contact_subject">Subject</label>
                    <div className="contact-select">
                      <select id="contact_subject" name="subject">
                        <option value="Order help">Order help</option>
                        <option value="Delivery">Delivery</option>
                        <option value="Return / exchange">Return / exchange</option>
                        <option value="Product question">Product question</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="contact-field-col">
                  <label htmlFor="contact_message">Message*</label>{' '}
                  <textarea
                    id="contact_message"
                    name="message"
                    rows={5}
                    placeholder="Write your message (order ID helps us reply faster)"
                  />
                  <p className="contact-error">Please write at least 10 characters</p>
                </div>
                <div className="contact-btn">
                  <button className="btn contact-submit-btn" type="submit">
                    send message
                  </button>
                </div>
              </form>
              <div className="contact-success" hidden>
                <span className="contact-success-icon">✓</span>
                <p className="contact-success-title">
                  Thank you, <span className="contact-success-name"></span>!
                </p>
                <p className="contact-success-text">
                  Your message has been received. Our team will contact you soon.
                </p>
                <button className="btn contact-again-btn" type="button">
                  send another message
                </button>
              </div>
            </div>
            <div className="contact-side">
              <div className="contact-side-box contact-side-dark">
                <p className="contact-side-title">Customer Support</p>
                <ul className="contact-hours">
                  <li>
                    <span>Phone & WhatsApp</span>
                    <strong>24 hours</strong>
                  </li>
                  <li>
                    <span>Days</span>
                    <strong>7 days a week</strong>
                  </li>
                  <li>
                    <span>Email reply</span>
                    <strong>within 24 hours</strong>
                  </li>
                </ul>
                <a href="tel:+8801841650668" className="contact-side-phone">
                  +8801841650668
                </a>
              </div>
              <div className="contact-side-box">
                <p className="contact-side-title">Follow Us</p>
                <ul className="contact-social">
                  <li>
                    <a href="#">
                      <svg className=" t4s-icon-facebook" role="presentation" viewBox="0 0 320 512">
                        <path d="M279.14 288l14.22-92.66h-88.91v-60.13c0-25.35 12.42-50.06 52.24-50.06h40.42V6.26S260.43 0 225.36 0c-73.22 0-121.08 44.38-121.08 124.72v70.62H22.89V288h81.39v224h100.17V288z"></path>
                      </svg>
                    </a>
                  </li>
                  <li>
                    <a href="#">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M12.1624 1.5H14.3687L9.5499 7.00625L15.2187 14.5H10.7812L7.30303 9.95625L3.32803 14.5H1.11865L6.27178 8.60938L0.837402 1.5H5.3874L8.52803 5.65312L12.1624 1.5ZM11.3874 13.1812H12.6093L4.72178 2.75H3.40928L11.3874 13.1812Z"
                          fill="black"
                        ></path>
                      </svg>
                    </a>
                  </li>
                  <li>
                    <a href="#">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M7.00303 3.40623C5.01553 3.40623 3.4124 5.00935 3.4124 6.99685C3.4124 8.98435 5.01553 10.5875 7.00303 10.5875C8.99053 10.5875 10.5937 8.98435 10.5937 6.99685C10.5937 5.00935 8.99053 3.40623 7.00303 3.40623ZM7.00303 9.33123C5.71865 9.33123 4.66865 8.28435 4.66865 6.99685C4.66865 5.70935 5.71553 4.66248 7.00303 4.66248C8.29053 4.66248 9.3374 5.70935 9.3374 6.99685C9.3374 8.28435 8.2874 9.33123 7.00303 9.33123ZM11.578 3.25935C11.578 3.72498 11.203 4.09685 10.7405 4.09685C10.2749 4.09685 9.90303 3.72185 9.90303 3.25935C9.90303 2.79685 10.278 2.42185 10.7405 2.42185C11.203 2.42185 11.578 2.79685 11.578 3.25935ZM13.9562 4.10935C13.903 2.98748 13.6468 1.99373 12.8249 1.17498C12.0062 0.356225 11.0124 0.0999756 9.89053 0.0437256C8.73428 -0.0218994 5.26865 -0.0218994 4.1124 0.0437256C2.99365 0.0968506 1.9999 0.353101 1.17803 1.17185C0.356152 1.9906 0.103027 2.98435 0.0467773 4.10623C-0.0188477 5.26248 -0.0188477 8.7281 0.0467773 9.88435C0.0999023 11.0062 0.356152 12 1.17803 12.8187C1.9999 13.6375 2.99053 13.8937 4.1124 13.95C5.26865 14.0156 8.73428 14.0156 9.89053 13.95C11.0124 13.8968 12.0062 13.6406 12.8249 12.8187C13.6437 12 13.8999 11.0062 13.9562 9.88435C14.0218 8.7281 14.0218 5.2656 13.9562 4.10935ZM12.4624 11.125C12.2187 11.7375 11.7468 12.2094 11.1312 12.4562C10.2093 12.8219 8.02178 12.7375 7.00303 12.7375C5.98428 12.7375 3.79365 12.8187 2.8749 12.4562C2.2624 12.2125 1.79053 11.7406 1.54365 11.125C1.17803 10.2031 1.2624 8.0156 1.2624 6.99685C1.2624 5.9781 1.18115 3.78748 1.54365 2.86873C1.7874 2.25623 2.25928 1.78435 2.8749 1.53748C3.79678 1.17185 5.98428 1.25623 7.00303 1.25623C8.02178 1.25623 10.2124 1.17498 11.1312 1.53748C11.7437 1.78123 12.2155 2.2531 12.4624 2.86873C12.828 3.7906 12.7437 5.9781 12.7437 6.99685C12.7437 8.0156 12.828 10.2062 12.4624 11.125Z"
                          fill="black"
                        ></path>
                      </svg>
                    </a>
                  </li>
                  <li>
                    <a href="#">
                      <svg
                        width="14"
                        height="16"
                        viewBox="0 0 14 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M11.0578 2.50667C10.4503 1.81291 10.1155 0.922133 10.1156 0H7.36889V11.0222C7.34814 11.6188 7.09646 12.1841 6.66694 12.5987C6.23742 13.0133 5.66364 13.2448 5.06667 13.2444C3.80444 13.2444 2.75556 12.2133 2.75556 10.9333C2.75556 9.40444 4.23111 8.25778 5.75111 8.72889V5.92C2.68444 5.51111 0 7.89333 0 10.9333C0 13.8933 2.45333 16 5.05778 16C7.84889 16 10.1156 13.7333 10.1156 10.9333V5.34222C11.2293 6.14209 12.5665 6.57124 13.9378 6.56889V3.82222C13.9378 3.82222 12.2667 3.90222 11.0578 2.50667Z"
                          fill="black"
                        ></path>
                      </svg>
                    </a>
                  </li>
                  <li>
                    <a href="#">
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 18 18"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M6.53341 16.95C7.33341 17.1917 8.14175 17.3334 9.00008 17.3334C11.2102 17.3334 13.3298 16.4554 14.8926 14.8926C16.4554 13.3298 17.3334 11.2102 17.3334 9.00002C17.3334 7.90567 17.1179 6.82204 16.6991 5.81099C16.2803 4.79994 15.6665 3.88129 14.8926 3.10746C14.1188 2.33364 13.2002 1.71981 12.1891 1.30102C11.1781 0.882235 10.0944 0.666687 9.00008 0.666687C7.90573 0.666687 6.8221 0.882235 5.81105 1.30102C4.80001 1.71981 3.88135 2.33364 3.10752 3.10746C1.54472 4.67027 0.666748 6.78988 0.666748 9.00002C0.666748 12.5417 2.89175 15.5834 6.03341 16.7834C5.95841 16.1334 5.88341 15.0584 6.03341 14.3167L6.99175 10.2C6.99175 10.2 6.75008 9.71669 6.75008 8.95002C6.75008 7.80002 7.46675 6.94169 8.28341 6.94169C9.00008 6.94169 9.33341 7.46669 9.33341 8.14169C9.33341 8.85835 8.85841 9.88335 8.61675 10.8667C8.47508 11.6834 9.05008 12.4 9.88342 12.4C11.3667 12.4 12.5167 10.8167 12.5167 8.58335C12.5167 6.58335 11.0834 5.21669 9.02508 5.21669C6.67508 5.21669 5.29175 6.96669 5.29175 8.80835C5.29175 9.52502 5.52508 10.25 5.90841 10.725C5.98341 10.775 5.98342 10.8417 5.95842 10.9667L5.71675 11.875C5.71675 12.0167 5.62508 12.0667 5.48341 11.9667C4.41675 11.5 3.80008 9.98335 3.80008 8.75835C3.80008 6.12502 5.66675 3.73335 9.26675 3.73335C12.1334 3.73335 14.3667 5.79169 14.3667 8.52502C14.3667 11.3917 12.5917 13.6917 10.0501 13.6917C9.24175 13.6917 8.45008 13.2584 8.16675 12.75L7.60841 14.725C7.41675 15.4417 6.89175 16.4 6.53341 16.975V16.95Z"
                          fill="black"
                        ></path>
                      </svg>
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="contact-faq-section">
        <div className="container">
          <div className="about-heading">
            <p className="about-subtitle">quick answers</p>
            <h2 className="about-title">Frequently Asked Questions</h2>
          </div>
          <div className="contact-faq-items">
            <details className="contact-faq-item" open>
              <summary>How long does delivery take?</summary>
              <p>
                Inside Dhaka usually 1–2 days and outside Dhaka 2–4 days after your order is
                confirmed.
              </p>
            </details>
            <details className="contact-faq-item">
              <summary>How much is the delivery charge?</summary>
              <p>
                Tk 80 inside Dhaka and Tk 130 outside Dhaka. Some bundle offers include free
                delivery.
              </p>
            </details>
            <details className="contact-faq-item">
              <summary>Do I have to pay in advance?</summary>
              <p>
                No. We offer cash on delivery — check your parcel first, then pay the delivery
                person.
              </p>
            </details>
            <details className="contact-faq-item">
              <summary>Can I return a product?</summary>
              <p>
                Yes. If the product is unused and in its original box, you can request a return
                within 7 days of delivery. Products damaged by misuse or water cannot be returned.
              </p>
            </details>
            <details className="contact-faq-item">
              <summary>How do I know my order is confirmed?</summary>
              <p>
                After you place an order, our team calls you to confirm the details before we
                dispatch the parcel.
              </p>
            </details>
          </div>
        </div>
      </section>
      <section className="contact-map-section">
        <div className="container">
          <div className="contact-map">
            <iframe
              title="Ehans Mart location — Kaunia, Rangpur"
              src="https://maps.google.com/maps?q=Kaunia,%20Rangpur%205400,%20Bangladesh&z=13&output=embed"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </div>
      </section>
    </>
  );
}

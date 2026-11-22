'use client';

import { useEffect } from 'react';
import { STORE } from '@/lib/store-config';
import { useStoreUi } from '../providers/store-ui';

type Kind = 'about' | 'contact' | 'faq' | 'policy' | 'blog' | 'blog-details' | 'not-found';
type Cleanup = () => void;

const toEnglishDigits = (v: string) => v.replace(/[০-৯]/g, (d) => String('০১২৩৪৫৬৭৮৯'.indexOf(d)));
const formatPhone = (v: string) =>
  toEnglishDigits(v)
    .replace(/[\s-]/g, '')
    .replace(/^\+?88/, '');
const escapeRegex = (t: string) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function on<K extends keyof HTMLElementEventMap>(
  el: EventTarget | null,
  type: K | string,
  fn: (e: Event) => void,
  opts?: AddEventListenerOptions,
): Cleanup {
  if (!el) return () => undefined;
  el.addEventListener(type, fn, opts);
  return () => el.removeEventListener(type, fn, opts);
}

// ---- about: stats count-up ----
function aboutStats(): Cleanup {
  const numbers = [...document.querySelectorAll<HTMLElement>('.about-stats-number[data-count]')];
  if (!numbers.length) return () => undefined;
  const frames: number[] = [];
  const countUp = (el: HTMLElement) => {
    const target = Number(el.dataset.count);
    const suffix = el.dataset.suffix ?? '';
    const start = performance.now();
    const step = (now: number) => {
      const p = Math.min((now - start) / 1400, 1);
      el.textContent = `${Math.round(target * (1 - Math.pow(1 - p, 3)))}${suffix}`;
      if (p < 1) frames.push(requestAnimationFrame(step));
    };
    frames.push(requestAnimationFrame(step));
  };
  const observer = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        countUp(e.target as HTMLElement);
        observer.unobserve(e.target);
      }),
    { threshold: 0.5 },
  );
  numbers.forEach((el) => observer.observe(el));
  return () => {
    observer.disconnect();
    frames.forEach(cancelAnimationFrame);
  };
}

// ---- contact form: template validation; messages module not ported yet ----
function contactForm(): Cleanup {
  const form = document.querySelector<HTMLFormElement>('.contact-form');
  if (!form) return () => undefined;
  const rules: Record<string, (v: string) => boolean> = {
    name: (v) => v.trim().length >= 2,
    phone: (v) => /^01[3-9]\d{8}$/.test(formatPhone(v)),
    email: (v) => !v.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
    message: (v) => v.trim().length >= 10,
  };
  const field = (name: string) =>
    form.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement | null;
  const validate = (input: HTMLInputElement | HTMLTextAreaElement) => {
    const ok = rules[input.name]!(input.value);
    input.closest('.contact-field-col')?.classList.toggle('invalid', !ok);
    return ok;
  };
  const cleanups: Cleanup[] = [];
  for (const name of Object.keys(rules)) {
    const input = field(name);
    if (!input) continue;
    cleanups.push(on(input, 'blur', () => input.value && validate(input)));
    cleanups.push(on(input, 'input', () => input.closest('.invalid') && validate(input)));
  }
  cleanups.push(
    on(form, 'submit', (e) => {
      e.preventDefault();
      const invalid = Object.keys(rules)
        .map(field)
        .filter((i): i is HTMLInputElement => Boolean(i))
        .filter((i) => !validate(i));
      if (invalid.length) return invalid[0]!.focus();
      let note = form.querySelector<HTMLParagraphElement>('.contact-pending-note');
      if (!note) {
        note = document.createElement('p');
        note.className = 'contact-pending-note';
        note.setAttribute('role', 'status');
        form.querySelector('.contact-submit-btn')?.insertAdjacentElement('beforebegin', note);
      }
      note.textContent = `Online messages are launching soon. Please call ${STORE.phone} or email ${STORE.email} — we reply quickly.`;
    }),
  );
  return () => cleanups.forEach((c) => c());
}

// ---- policy: side nav smooth scroll + highlight section in view ----
function policyNav(): Cleanup {
  const links = [...document.querySelectorAll<HTMLAnchorElement>('.policy-nav-link')];
  if (!links.length) return () => undefined;
  const items = links
    .map((l) => document.querySelector<HTMLElement>(l.getAttribute('href') ?? ''))
    .filter((x): x is HTMLElement => Boolean(x));
  const setActive = (id: string) =>
    links.forEach((link) => {
      const active = link.getAttribute('href') === `#${id}`;
      link.classList.toggle('active', active);
      if (active && window.innerWidth <= 992)
        link.parentElement?.scrollTo({ left: link.offsetLeft - 16, behavior: 'smooth' });
    });
  const cleanups = links.map((link) =>
    on(link, 'click', (e) => {
      const target = document.querySelector<HTMLElement>(link.getAttribute('href') ?? '');
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      history.replaceState(null, '', link.getAttribute('href'));
      setActive(target.id);
    }),
  );
  const observer = new IntersectionObserver(
    (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
    {
      rootMargin: '-30% 0px -60% 0px',
    },
  );
  items.forEach((i) => observer.observe(i));
  if (location.hash && items.some((i) => `#${i.id}` === location.hash)) {
    setActive(location.hash.slice(1));
    document.querySelector(location.hash)?.scrollIntoView({ block: 'start' });
  }
  return () => {
    observer.disconnect();
    cleanups.forEach((c) => c());
  };
}

// ---- faq: category tabs, search with highlight, one answer open ----
function faq(): Cleanup {
  const items = [...document.querySelectorAll<HTMLDetailsElement>('.faq-item')];
  if (!items.length) return () => undefined;
  const tabs = [...document.querySelectorAll<HTMLElement>('.faq-tab')];
  const input = document.querySelector<HTMLInputElement>('.faq-search-input');
  const clear = document.querySelector<HTMLButtonElement>('.faq-search-clear');
  const empty = document.querySelector<HTMLElement>('.faq-empty');
  let activeTab = 'all';
  const meta = new Map(
    items.map((item) => {
      const summary = item.querySelector('summary')!;
      const tag = summary.querySelector('.faq-item-tag');
      return [
        item,
        {
          question: (summary.textContent ?? '').replace(tag?.textContent ?? '', '').trim(),
          text: (item.textContent ?? '').toLowerCase(),
          tag: tag?.outerHTML ?? '',
        },
      ];
    }),
  );
  tabs.forEach((tab) => {
    const cat = tab.dataset.faqTab;
    const count = tab.querySelector('.faq-tab-count');
    if (count)
      count.textContent = String(
        cat === 'all' ? items.length : items.filter((i) => i.dataset.faqCat === cat).length,
      );
  });
  const render = () => {
    const word = (input?.value ?? '').trim().toLowerCase();
    let visible = 0;
    items.forEach((item) => {
      const m = meta.get(item)!;
      item.hidden = !(
        (activeTab === 'all' || item.dataset.faqCat === activeTab) &&
        (!word || m.text.includes(word))
      );
      const q = m.question.replace(/&/g, '&amp;').replace(/</g, '&lt;');
      item.querySelector('summary')!.innerHTML =
        `${m.tag}<span class="faq-item-question">${word ? q.replace(new RegExp(`(${escapeRegex(word)})`, 'gi'), '<mark>$1</mark>') : q}</span>`;
      if (!item.hidden) visible++;
    });
    if (word) {
      const first = items.find((i) => !i.hidden);
      if (first) first.open = true;
    }
    if (empty) empty.hidden = visible > 0;
    if (clear) clear.hidden = !input?.value;
  };
  const cleanups: Cleanup[] = [
    ...tabs.map((tab) =>
      on(tab, 'click', () => {
        activeTab = tab.dataset.faqTab ?? 'all';
        tabs.forEach((t) => t.classList.toggle('active', t === tab));
        tab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        render();
      }),
    ),
    on(input, 'input', render),
    on(input?.form ?? null, 'submit', (e) => e.preventDefault()),
    on(clear, 'click', () => {
      if (input) input.value = '';
      render();
      input?.focus();
    }),
    ...items.map((item) =>
      on(item, 'toggle', () => item.open && items.forEach((o) => o !== item && (o.open = false))),
    ),
  ];
  return () => cleanups.forEach((c) => c());
}

// ---- blog list: tabs, search, load more, newsletter ----
function blog(): Cleanup {
  const cleanups: Cleanup[] = [];
  const cards = [...document.querySelectorAll<HTMLElement>('.blog-card')];
  const moreBtn = document.querySelector<HTMLButtonElement>('.blog-more-btn');
  if (cards.length && moreBtn) {
    const tabs = [...document.querySelectorAll<HTMLElement>('.blog-tab')];
    const input = document.querySelector<HTMLInputElement>('.blog-search-input');
    const empty = document.querySelector<HTMLElement>('.blog-empty');
    const more = document.querySelector<HTMLElement>('.blog-more');
    const pageSize = 6;
    let activeTab = 'all';
    let showCount = pageSize;
    const render = () => {
      const word = (input?.value ?? '').trim().toLowerCase();
      const matched = cards.filter(
        (c) =>
          (activeTab === 'all' || c.dataset.blogCat === activeTab) &&
          (!word || (c.textContent ?? '').toLowerCase().includes(word)),
      );
      cards.forEach((c) => (c.hidden = true));
      matched.slice(0, showCount).forEach((c) => (c.hidden = false));
      if (empty) empty.hidden = matched.length > 0;
      if (more) more.hidden = matched.length <= showCount;
    };
    tabs.forEach((tab) =>
      cleanups.push(
        on(tab, 'click', () => {
          activeTab = tab.dataset.blogTab ?? 'all';
          showCount = pageSize;
          tabs.forEach((t) => t.classList.toggle('active', t === tab));
          render();
        }),
      ),
    );
    cleanups.push(
      on(input, 'input', () => {
        showCount = pageSize;
        render();
      }),
      on(input?.form ?? null, 'submit', (e) => {
        e.preventDefault();
        document.querySelector('.blog-section')?.scrollIntoView({ behavior: 'smooth' });
      }),
      on(moreBtn, 'click', () => {
        showCount += pageSize;
        render();
      }),
    );
    const q = new URLSearchParams(location.search).get('q');
    if (q && input) input.value = q;
    render();
  }

  const form = document.querySelector<HTMLFormElement>('.blog-newsletter-form');
  const msg = form?.querySelector<HTMLElement>('.blog-newsletter-msg');
  cleanups.push(
    on(form, 'submit', (e) => {
      e.preventDefault();
      const email =
        (form!.elements.namedItem('email') as HTMLInputElement | null)?.value.trim() ?? '';
      if (!msg) return;
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        msg.className = 'blog-newsletter-msg error';
        msg.textContent = 'Please enter a valid email address.';
        return;
      }
      // newsletter provider is not connected yet — do not claim a subscription happened
      msg.className = 'blog-newsletter-msg success';
      msg.textContent = 'Newsletter sign-up is launching soon. Thanks for your interest!';
    }),
  );
  return () => cleanups.forEach((c) => c());
}

// ---- blog details: reading progress, table of contents, share ----
function blogDetails(): Cleanup {
  const article = document.querySelector<HTMLElement>('.blog-details-article');
  if (!article) return () => undefined;
  const bar = document.querySelector<HTMLElement>('.blog-details-progress span');
  const update = () => {
    const rect = article.getBoundingClientRect();
    const total = rect.height - window.innerHeight;
    if (bar)
      bar.style.transform = `scaleX(${Math.min(Math.max(-rect.top / (total > 0 ? total : 1), 0), 1)})`;
  };
  update();
  const links = [...document.querySelectorAll<HTMLAnchorElement>('.blog-toc-link')];
  const headings = links
    .map((l) => document.querySelector<HTMLElement>(l.getAttribute('href') ?? ''))
    .filter((x): x is HTMLElement => Boolean(x));
  const setActive = (id: string) =>
    links.forEach((l) => l.classList.toggle('active', l.getAttribute('href') === `#${id}`));
  const observer = new IntersectionObserver(
    (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
    {
      rootMargin: '-20% 0px -70% 0px',
    },
  );
  headings.forEach((h) => observer.observe(h));
  const url = encodeURIComponent(location.href);
  const title = encodeURIComponent(document.title);
  const shareUrls: Record<string, string> = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
    whatsapp: `https://wa.me/?text=${title}%20${url}`,
  };
  document.querySelectorAll<HTMLAnchorElement>('[data-share]').forEach((a) => {
    const href = shareUrls[a.dataset.share ?? ''];
    if (href) {
      a.href = href;
      a.target = '_blank';
      a.rel = 'noopener';
    }
  });
  const shareMsg = document.querySelector<HTMLElement>('.blog-share-msg');
  const cleanups: Cleanup[] = [
    on(window, 'scroll', update, { passive: true }),
    on(window, 'resize', update),
    ...links.map((link) =>
      on(link, 'click', (e) => {
        const target = document.querySelector<HTMLElement>(link.getAttribute('href') ?? '');
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setActive(target.id);
      }),
    ),
    on(document.querySelector('.blog-share-copy'), 'click', () => {
      void navigator.clipboard
        .writeText(location.href)
        .then(() => shareMsg && (shareMsg.textContent = 'Link copied!'))
        .catch(() => shareMsg && (shareMsg.textContent = 'Copy failed'))
        .finally(() => setTimeout(() => shareMsg && (shareMsg.textContent = ''), 2000));
    }),
  ];
  return () => {
    observer.disconnect();
    cleanups.forEach((c) => c());
  };
}

// ---- 404: search box + suggestion tags open the header search ----
function notFound(openSearch: (q?: string) => void): Cleanup {
  const form = document.querySelector<HTMLFormElement>('.notfound-search');
  const cleanups: Cleanup[] = [
    on(form, 'submit', (e) => {
      e.preventDefault();
      openSearch((form!.elements.namedItem('q') as HTMLInputElement | null)?.value.trim() ?? '');
    }),
    ...[...document.querySelectorAll<HTMLElement>('[data-search-open]')].map((tag) =>
      on(tag, 'click', () => openSearch(tag.dataset.searchOpen ?? '')),
    ),
  ];
  return () => cleanups.forEach((c) => c());
}

/**
 * Attaches the template's page scripts to server-rendered static content
 * (about, contact, faq, policy, blog, blog details, 404). Cleans up on unmount.
 */
export function PageEnhancer({ kind }: { kind: Kind }) {
  const { openSearch } = useStoreUi();
  useEffect(() => {
    switch (kind) {
      case 'about':
        return aboutStats();
      case 'contact':
        return contactForm();
      case 'faq':
        return faq();
      case 'policy':
        return policyNav();
      case 'blog':
        return blog();
      case 'blog-details':
        return blogDetails();
      case 'not-found':
        return notFound(openSearch);
    }
  }, [kind, openSearch]);
  return null;
}

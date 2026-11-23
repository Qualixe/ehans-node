'use client';

import { useEffect, useState } from 'react';

const MIN = 90;
const MAX = 190;
const clamp = (n: number) => Math.min(MAX, Math.max(MIN, n));
const random = (from: number, to: number) => from + Math.floor(Math.random() * (to - from + 1));

/**
 * The live theme's "● (avatars) 152 people watching" row. The count is random: it starts from a
 * stable per-product number (server and browser render the same HTML), jumps to a random value
 * once the page is interactive, then drifts by a few every few seconds.
 */
export function LiveViewers({ seed }: { seed: number }) {
  const [count, setCount] = useState(() => MIN + (Math.abs(seed) % (MAX - MIN)));

  useEffect(() => {
    let timer: number;
    const tick = (first: boolean) => {
      setCount((c) => (first ? random(MIN + 20, MAX - 20) : clamp(c + random(-4, 5))));
      timer = window.setTimeout(() => tick(false), random(3000, 6000));
    };
    timer = window.setTimeout(() => tick(true), 0);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="product-happy-customer">
      <span className="product-stock-dot"></span>
      <div className="product-happy-customer-img">
        <img src="/assets/videos/review-2.jpg" alt="customer" />{' '}
        <img src="/assets/videos/review-3.jpg" alt="customer" />{' '}
        <img src="/assets/videos/review-4.jpg" alt="customer" />
      </div>
      <p className="product-happy-customer-text" aria-live="off">
        {count} people watching
      </p>
    </div>
  );
}

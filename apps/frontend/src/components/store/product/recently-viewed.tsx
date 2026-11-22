'use client';

import type { ProductCard } from '@ehans/shared';
import { useEffect, useState } from 'react';
import { CardSliderSection } from '../card-slider-section';

const KEY = 'ehans-mart-recently-viewed';
const MAX = 12;

function read(): ProductCard[] {
  try {
    const v: unknown = JSON.parse(window.localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(v)
      ? (v as ProductCard[]).filter((p) => typeof p?.id === 'string' && typeof p.slug === 'string')
      : [];
  } catch {
    return [];
  }
}

/** Records the current product and shows previously viewed ones (browser-local history). */
export function RecentlyViewed({ current }: { current: ProductCard }) {
  const [items, setItems] = useState<ProductCard[]>([]);

  useEffect(() => {
    const previous = read().filter((p) => p.id !== current.id);
    try {
      window.localStorage.setItem(KEY, JSON.stringify([current, ...previous].slice(0, MAX)));
    } catch {
      /* storage blocked: history is optional */
    }
    // localStorage is an external system; syncing it into state after mount is intended
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(previous);
  }, [current]);

  return <CardSliderSection title="Recently Viewed Products" products={items} />;
}

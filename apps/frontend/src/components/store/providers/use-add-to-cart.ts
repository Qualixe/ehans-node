'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { flyToCart } from '../fly-to-cart';
import { type CartItem, cartActions } from './cart-store';

export type AddState = 'idle' | 'loading' | 'added';

interface AddOptions {
  /** Element the product image flies from (card image or the clicked button). */
  flyFrom?: Element | null;
  /** True when flyFrom is the product image (flyer starts at the image's size). */
  fromImage?: boolean;
}

/**
 * Live ehansmart.com add-to-cart feedback: the product image flies into the header
 * cart icon (which bumps), the button turns green "Added ✓" for 1.8s. The cart
 * drawer is not opened — the cart bubble count updates instead.
 */
export function useAddToCart() {
  const [state, setState] = useState<AddState>('idle');
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const add = useCallback(
    (lines: { item: Omit<CartItem, 'qty'>; qty?: number }[], options: AddOptions = {}) => {
      if (state === 'loading' || !lines.length) return;
      flyToCart(options.flyFrom, lines[0]!.item.img, { fromImage: options.fromImage });
      lines.forEach(({ item, qty }) => cartActions.add(item, qty ?? 1));
      setState('added');
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setState('idle'), 1800);
    },
    [state],
  );

  return { state, add };
}

/** Classes + label the theme applies to an add-to-cart button. */
export function addButtonProps(state: AddState, label: string, baseClass: string) {
  return {
    className: [baseClass, state === 'loading' ? 'loading' : '', state === 'added' ? 'added' : '']
      .filter(Boolean)
      .join(' '),
    children: state === 'added' ? 'Added ✓' : label,
    'aria-busy': state === 'loading',
  };
}

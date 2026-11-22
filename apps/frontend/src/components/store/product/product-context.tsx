'use client';

import type { ProductBundleDto, ProductDetail } from '@ehans/shared';
import { createContext, type ReactNode, useContext, useMemo, useState } from 'react';
import { productUrl } from '@/lib/format';
import type { CartItem } from '../providers/cart-store';

export interface BundleOffer {
  quantity: number;
  discount: number;
  freeDelivery: boolean;
}

interface ProductState {
  product: ProductDetail;
  bundleQty: number;
  setBundleQty: (q: number) => void;
  /** Biggest bundle not above `quantity` (template getBundleOffer). */
  offerFor: (quantity: number) => BundleOffer;
  /** Cart line for `quantity` units with the matching bundle discount applied. */
  cartLine: (quantity: number) => Omit<CartItem, 'qty'>;
  buyWith: Set<string>;
  toggleBuyWith: (id: string) => void;
  clearBuyWith: () => void;
  buyNowOpen: boolean;
  setBuyNowOpen: (open: boolean) => void;
}

const ProductContext = createContext<ProductState | null>(null);

export function offerFrom(bundles: ProductBundleDto[], quantity: number): BundleOffer {
  const best = bundles
    .filter((b) => b.quantity <= quantity)
    .sort((a, b) => b.quantity - a.quantity)[0];
  return best
    ? { quantity: best.quantity, discount: best.discountPercent, freeDelivery: best.freeDelivery }
    : { quantity: 1, discount: 0, freeDelivery: false };
}

export function ProductProvider({
  product,
  children,
}: {
  product: ProductDetail;
  children: ReactNode;
}) {
  const defaultBundle = product.bundles.find((b) => b.isDefault)?.quantity ?? 1;
  const [bundleQty, setBundleQty] = useState(defaultBundle);
  const [buyWith, setBuyWith] = useState<Set<string>>(new Set());
  const [buyNowOpen, setBuyNowOpen] = useState(false);

  const value = useMemo<ProductState>(() => {
    const offerFor = (quantity: number) => offerFrom(product.bundles, quantity);
    return {
      product,
      bundleQty,
      setBundleQty,
      offerFor,
      cartLine: (quantity) => {
        const unit =
          Math.round(product.price * (1 - offerFor(quantity).discount / 100) * 100) / 100;
        return {
          id: `${product.id}:${unit}`,
          productId: product.id,
          title: product.name,
          img: product.images[0]?.url ?? '',
          price: unit,
          url: productUrl(product.slug),
        };
      },
      buyWith,
      toggleBuyWith: (id) =>
        setBuyWith((s) => {
          const next = new Set(s);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return next;
        }),
      clearBuyWith: () => setBuyWith(new Set()),
      buyNowOpen,
      setBuyNowOpen,
    };
  }, [product, bundleQty, buyWith, buyNowOpen]);

  return <ProductContext.Provider value={value}>{children}</ProductContext.Provider>;
}

export function useProduct(): ProductState {
  const ctx = useContext(ProductContext);
  if (!ctx) throw new Error('useProduct must be used inside <ProductProvider>');
  return ctx;
}

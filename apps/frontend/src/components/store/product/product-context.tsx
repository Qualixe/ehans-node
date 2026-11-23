'use client';

import type {
  CrossSellCard,
  CrossSellVariant,
  ProductBundleDto,
  ProductDetail,
  ProductVariantDto,
} from '@ehans/shared';
import { createContext, type ReactNode, useContext, useMemo, useState } from 'react';
import { productUrl } from '@/lib/format';
import type { CartItem } from '../providers/cart-store';

export interface BundleOffer {
  quantity: number;
  discount: number;
  freeDelivery: boolean;
}

/** What is being sold: the chosen variant, or the product itself when it has no options. */
export interface SellingUnit {
  price: number;
  compareAtPrice: number | null;
  stock: number;
  inStock: boolean;
  image: string | null;
}

interface ProductState {
  product: ProductDetail;
  /** The chosen variant of a product with options (null without options). */
  variant: ProductVariantDto | null;
  setVariantId: (id: string) => void;
  unit: SellingUnit;
  bundleQty: number;
  setBundleQty: (q: number) => void;
  /** Biggest bundle not above `quantity` (template getBundleOffer). */
  offerFor: (quantity: number) => BundleOffer;
  /** Cart line for `quantity` units with the matching bundle discount applied. */
  cartLine: (quantity: number) => Omit<CartItem, 'qty'>;
  /** Products marked to go into the cart with this one ("Buy it with" ticks + "Complete your …" ADDED). */
  buyWith: Set<string>;
  toggleBuyWith: (id: string) => void;
  clearBuyWith: () => void;
  /** The variant shown/chosen for a cross-sell product (null when it has no options). */
  variantOf: (card: CrossSellCard) => CrossSellVariant | null;
  chooseVariant: (productId: string, variantId: string) => void;
  /** Cart lines for the marked products, in page order (added with the main product). */
  extraItems: Omit<CartItem, 'qty'>[];
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

/** Chosen variant, else the first in stock, else the first. */
function pickVariant(card: CrossSellCard, chosenId: string | undefined): CrossSellVariant | null {
  if (!card.variants.length) return null;
  return (
    card.variants.find((v) => v.id === chosenId) ??
    card.variants.find((v) => v.inStock) ??
    card.variants[0]!
  );
}

/** Same cart line as quick view: the variant's own line, price and title. */
export function crossSellLine(
  card: CrossSellCard,
  variant: CrossSellVariant | null,
): Omit<CartItem, 'qty'> {
  return {
    id: variant ? `${card.id}:${variant.id}` : card.id,
    productId: card.id,
    variantId: variant?.id,
    title: variant ? `${card.name} (${variant.title})` : card.name,
    img: variant?.image?.url ?? card.image?.url ?? '',
    price: variant?.price ?? card.price,
    url: productUrl(card.slug),
  };
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
  const [chosen, setChosen] = useState<Record<string, string>>({});
  const [buyNowOpen, setBuyNowOpen] = useState(false);
  const hasOptions = product.options.length > 0 && product.variants.length > 0;
  const [variantId, setVariantId] = useState<string | null>(
    () => (product.variants.find((v) => v.stock > 0) ?? product.variants[0])?.id ?? null,
  );

  const value = useMemo<ProductState>(() => {
    const offerFor = (quantity: number) => offerFrom(product.bundles, quantity);
    const variant = hasOptions ? (product.variants.find((v) => v.id === variantId) ?? null) : null;
    const unit: SellingUnit = variant
      ? {
          price: variant.price,
          compareAtPrice: variant.compareAtPrice,
          stock: variant.stock,
          inStock: variant.stock > 0,
          image: variant.imageUrl ?? product.images[0]?.url ?? null,
        }
      : {
          price: product.price,
          compareAtPrice: product.compareAtPrice,
          stock: product.stock,
          inStock: product.inStock,
          image: product.images[0]?.url ?? null,
        };
    return {
      product,
      variant,
      setVariantId,
      unit,
      bundleQty,
      setBundleQty,
      offerFor,
      cartLine: (quantity) => {
        // whole taka per unit, like every price in the shop (the checkout recomputes totals)
        const price = Math.round(unit.price * (1 - offerFor(quantity).discount / 100));
        return {
          id: `${product.id}:${variant?.id ?? ''}:${price}`,
          productId: product.id,
          variantId: variant?.id,
          title: variant ? `${product.name} (${variant.title})` : product.name,
          img: unit.image ?? '',
          price,
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
      variantOf: (card) => pickVariant(card, chosen[card.id]),
      chooseVariant: (productId, variantId) => setChosen((c) => ({ ...c, [productId]: variantId })),
      extraItems: [...product.buyWith, ...product.upsells]
        .filter((p, i, all) => buyWith.has(p.id) && all.findIndex((x) => x.id === p.id) === i)
        .map((p) => crossSellLine(p, pickVariant(p, chosen[p.id]))),
      buyNowOpen,
      setBuyNowOpen,
    };
  }, [product, hasOptions, variantId, bundleQty, buyWith, chosen, buyNowOpen]);

  return <ProductContext.Provider value={value}>{children}</ProductContext.Provider>;
}

export function useProduct(): ProductState {
  const ctx = useContext(ProductContext);
  if (!ctx) throw new Error('useProduct must be used inside <ProductProvider>');
  return ctx;
}

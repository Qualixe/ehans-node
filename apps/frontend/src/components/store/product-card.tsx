'use client';

import type { ProductCard as ProductCardData } from '@ehans/shared';
import Link from 'next/link';
import { formatPrice, productUrl } from '@/lib/format';
import { addButtonProps, useAddToCart } from './providers/use-add-to-cart';
import { useStoreUi } from './providers/store-ui';
import { useCart } from './providers/cart-store';
import { RevealMedia } from './reveal-media';

export function toCartItem(p: ProductCardData) {
  return {
    id: p.id,
    productId: p.id,
    title: p.name,
    img: p.image?.url ?? '',
    price: p.price,
    url: productUrl(p.slug),
  };
}

/** Live ehansmart.com product card. Products with options open quick view. */
export function ProductCard({ product }: { product: ProductCardData }) {
  const { state, add } = useAddToCart();
  const { openQuickView, openCart } = useStoreUi();
  const { items } = useCart();
  const href = productUrl(product.slug);
  const btn = addButtonProps(state, product.inStock ? 'Add to cart' : 'Sold out', 'btn');
  // once the product is in the cart the card offers "View cart" (after the "Added ✓" flash)
  const inCart = items.some((i) => i.productId === product.id);
  const showViewCart = inCart && state !== 'added';

  return (
    <div className="product-card">
      <div className="card-image-wrap">
        {product.discountPercent ? (
          <span className="card-badge">-{product.discountPercent}%</span>
        ) : null}
        <RevealMedia
          className="card-img"
          src={product.image?.url ?? null}
          width={520}
          height={520}
          imgClassName="card_img"
        >
          {(img) => (
            <Link className="main-img" href={href} tabIndex={-1} aria-hidden="true">
              {img}
            </Link>
          )}
        </RevealMedia>
      </div>
      <div className="card-content">
        <div className="card-title-wrap">
          <Link href={href} className="card-title">
            {product.name}
          </Link>
        </div>
        <div className="card-price-wrap">
          {product.compareAtPrice && product.compareAtPrice > product.price ? (
            <p className="previous-price">
              <span className="visually-hidden">Regular price</span>{' '}
              <s>{formatPrice(product.compareAtPrice)}</s>
            </p>
          ) : null}
          <p className="latest-price">
            <span className="visually-hidden">Sale price</span>
            {formatPrice(product.price)}
          </p>
        </div>
        {/* live ehansmart.com card buttons: add (or options → quick view), then "View cart" */}
        <div className="card-btn">
          <div className="card-btn-add" hidden={showViewCart}>
            {product.hasVariants ? (
              <a
                href={href}
                className="btn card-btn-options quick-view-open"
                aria-haspopup="dialog"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (product.inStock) openQuickView(product, e.currentTarget);
                }}
              >
                {product.inStock ? 'Add to cart' : 'Sold out'}
              </a>
            ) : (
              // live markup: .card-btn-add > form.card-form > button[data-card-add]
              // (the live card.css hides anything else inside .card-btn-add)
              <form
                className="card-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const cardImage = e.currentTarget
                    .closest('.product-card')
                    ?.querySelector('.card-img');
                  add([{ item: toCartItem(product) }], {
                    flyFrom: cardImage ?? e.currentTarget,
                    fromImage: Boolean(cardImage),
                  });
                }}
              >
                <button
                  type="submit"
                  className={btn.className}
                  data-card-add=""
                  aria-busy={btn['aria-busy']}
                  disabled={!product.inStock}
                >
                  {btn.children}
                </button>
              </form>
            )}
          </div>
          <a
            href="/cart"
            className="btn card-btn-view"
            hidden={!showViewCart}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              openCart();
            }}
          >
            View cart
          </a>
        </div>
      </div>
    </div>
  );
}

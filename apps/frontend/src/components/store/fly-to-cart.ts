'use client';

/**
 * Port of the live ehansmart.com "fly to cart" effect (theme script.js flyToCart):
 * the product image pops, arcs into the visible header cart icon, then the icon bumps.
 * Styles: `.ehans-fly-to-cart` in styles/store/card.css.
 */
const FLY_DURATION = 700;
const FLY_POP_SHARE = 0.18;
const FLY_DROP = 120;

export function flyToCart(
  source: Element | null | undefined,
  image: string | null | undefined,
  { fromImage = false } = {},
): void {
  if (typeof window === 'undefined') return;
  const cartIcon = [
    ...document.querySelectorAll<HTMLElement>('.navbar-icon.cart-drawer-open'),
  ].find((icon) => icon.getClientRects().length > 0);
  if (
    !source ||
    !cartIcon ||
    !image ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
    return;

  const from = source.getBoundingClientRect();
  const to = cartIcon.getBoundingClientRect();
  const size = fromImage ? Math.min(from.width, from.height) : 120;
  if (!size) return;

  const startX = from.left + from.width / 2;
  const startY = from.top + from.height / 2;
  const flyer = document.createElement('div');
  flyer.className = 'ehans-fly-to-cart';
  flyer.setAttribute('aria-hidden', 'true');
  Object.assign(flyer.style, {
    width: `${size}px`,
    height: `${size}px`,
    left: `${startX - size / 2}px`,
    top: `${startY - size / 2}px`,
    backgroundImage: `url("${image.replace(/"/g, '%22')}")`,
  });
  document.body.appendChild(flyer);

  const popScale = fromImage ? 0.6 : 0.9;
  const endScale = Math.min(1, 40 / size);
  const p0 = { x: 0, y: FLY_DROP };
  const p2 = { x: to.left + to.width / 2 - startX, y: to.top + to.height / 2 - startY };
  const p1 = { x: p2.x * 0.3, y: Math.min(p0.y, p2.y) - 160 };
  const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const frames: Keyframe[] = [
    {
      offset: 0,
      transform: 'translate(0px, 0px) scale(1)',
      easing: 'cubic-bezier(0.2, 0.8, 0.3, 1)',
    },
    { offset: FLY_POP_SHARE, transform: `translate(0px, ${FLY_DROP}px) scale(${popScale})` },
  ];
  const steps = 30;
  for (let i = 1; i <= steps; i += 1) {
    const t = easeInOut(i / steps);
    const x = (1 - t) ** 2 * p0.x + 2 * (1 - t) * t * p1.x + t * t * p2.x;
    const y = (1 - t) ** 2 * p0.y + 2 * (1 - t) * t * p1.y + t * t * p2.y;
    const scale = popScale + (endScale - popScale) * t;
    frames.push({
      offset: FLY_POP_SHARE + (1 - FLY_POP_SHARE) * (i / steps),
      transform: `translate(${x}px, ${y}px) scale(${scale})`,
    });
  }

  flyer
    .animate(frames, { duration: FLY_DURATION, fill: 'forwards' })
    .finished.then(() => {
      flyer.remove();
      cartIcon.animate(
        [{ transform: 'scale(1)' }, { transform: 'scale(1.25)' }, { transform: 'scale(1)' }],
        { duration: 320, easing: 'ease-out' },
      );
    })
    .catch(() => flyer.remove());
}

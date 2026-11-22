'use client';

import { type ReactNode, useEffect, useRef } from 'react';
import Swiper from 'swiper';
import { Autoplay, FreeMode, Mousewheel, Navigation, Pagination, Thumbs } from 'swiper/modules';
import type { SwiperOptions } from 'swiper/types';

export type SliderOptions = Omit<
  SwiperOptions,
  'navigation' | 'pagination' | 'thumbs' | 'modules'
> & {
  /** Class names (without dot) of nav/pagination elements rendered inside this slider. */
  navigation?: { nextEl: string; prevEl: string };
  pagination?: { el: string; clickable?: boolean };
};

interface SliderProps {
  className: string;
  options: SliderOptions;
  children: ReactNode;
  /** Extra elements inside .swiper after .swiper-wrapper (pagination, arrows). */
  controls?: ReactNode;
  /** Receives the instance (used to link thumbnails to the main product slider). */
  onSwiper?: (swiper: Swiper) => void;
  thumbsSwiper?: Swiper | null;
  wrapperProps?: React.HTMLAttributes<HTMLDivElement>;
}

/**
 * Renders the template's `.swiper > .swiper-wrapper` markup and initialises
 * vanilla Swiper 11 on it with the template's options (styles come from the
 * template's swiper-bundle CSS).
 */
export function Slider({
  className,
  options,
  children,
  controls,
  onSwiper,
  thumbsSwiper,
  wrapperProps,
}: SliderProps) {
  const ref = useRef<HTMLDivElement>(null);
  const optionsKey = JSON.stringify(options);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Waiting for the thumbs slider. In dev, React mounts effects twice, so the first thumbs
    // instance is destroyed and replaced; linking to a destroyed instance crashes Swiper's
    // Thumbs module (classList of undefined). The live instance arrives in the next render.
    if (thumbsSwiper === null || thumbsSwiper?.destroyed) return;
    const { navigation, pagination, ...rest } = JSON.parse(optionsKey) as SliderOptions;
    // Only pass module params that are set: `key: undefined` would replace Swiper's
    // default param objects and crash the module (e.g. pagination.el of undefined).
    const swiper = new Swiper(el, {
      ...rest,
      modules: [Navigation, Pagination, Autoplay, Thumbs, FreeMode, Mousewheel],
      ...(navigation
        ? {
            navigation: {
              nextEl: el.querySelector<HTMLElement>(`.${navigation.nextEl}`),
              prevEl: el.querySelector<HTMLElement>(`.${navigation.prevEl}`),
            },
          }
        : {}),
      ...(pagination
        ? {
            pagination: {
              el: el.querySelector<HTMLElement>(`.${pagination.el}`),
              clickable: pagination.clickable,
            },
          }
        : {}),
      ...(thumbsSwiper ? { thumbs: { swiper: thumbsSwiper } } : {}),
    });
    onSwiper?.(swiper);
    return () => {
      // detach from the thumbs slider first so neither side touches a destroyed instance
      if (swiper.thumbs?.swiper) swiper.params.thumbs = { ...swiper.params.thumbs, swiper: null };
      swiper.destroy(true, true);
    };
    // onSwiper is intentionally not a dependency (callers pass inline setters)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [optionsKey, thumbsSwiper]);

  return (
    <div className={className} ref={ref}>
      <div className="swiper-wrapper" {...wrapperProps}>
        {children}
      </div>
      {controls}
    </div>
  );
}

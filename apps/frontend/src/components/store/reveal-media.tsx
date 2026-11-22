'use client';

import { type ReactNode, useCallback, useState } from 'react';

/**
 * Live theme `.media-skeleton.media-skeleton--reveal` wrapper: the shimmer shows until the
 * image has loaded or failed (`is-loaded`), including images that finished before hydration.
 */
export function RevealMedia({
  className,
  src,
  width,
  height,
  imgClassName,
  children,
}: {
  /** Classes of the wrapper besides the skeleton ones, e.g. `card-img` or `img`. */
  className: string;
  src: string | null;
  width: number;
  height: number;
  imgClassName?: string;
  /** Optional wrapper around the image (e.g. a link); receives the `<img>`. */
  children?: (img: ReactNode) => ReactNode;
}) {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useCallback((img: HTMLImageElement | null) => {
    if (img?.complete) setLoaded(true);
  }, []);
  const img = src ? (
    <img
      ref={imgRef}
      src={src}
      alt=""
      width={width}
      height={height}
      loading="lazy"
      className={imgClassName}
      onLoad={() => setLoaded(true)}
      onError={() => setLoaded(true)}
    />
  ) : null;
  return (
    <div
      className={`${className} media-skeleton media-skeleton--reveal${loaded ? ' is-loaded' : ''}`}
    >
      {children ? children(img) : img}
    </div>
  );
}

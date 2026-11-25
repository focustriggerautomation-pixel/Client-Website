import type { CSSProperties } from 'react';
import { imageUrl, pictureSources } from '../config/images.ts';

import { useCafe } from '../theme/ThemeProvider.tsx';

type DataAttrs = { [k: `data-${string}`]: string | boolean | undefined };

interface ImgProps extends DataAttrs {
  /** Config path, e.g. "images/hero.jpg". */
  path: string;
  alt: string;
  /** The `sizes` attribute: how wide the image renders, e.g. "(min-width: 1024px) 50vw, 100vw". */
  sizes: string;
  className?: string;
  style?: CSSProperties;
  /** Above-the-fold image: load eagerly with high priority. */
  priority?: boolean;
}

/**
 * <picture> with AVIF + WebP sources (several widths, picked via `sizes`), an optimised JPEG/PNG fallback,
 * intrinsic width/height (no layout shift) and lazy loading by default. The <picture> is display:contents,
 * so classes and data-attributes on the <img> behave exactly as before.
 */
export function Img({ path, alt, sizes, className, style, priority, ...data }: ImgProps) {
  const { cafe, images } = useCafe();
  const p = pictureSources(cafe.slug, path, images[path]);
  const img = (
    <img
      src={p?.src ?? imageUrl(cafe.slug, path)}
      width={p?.width ?? images[path]?.w}
      height={p?.height ?? images[path]?.h}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding={priority ? 'sync' : 'async'}
      fetchPriority={priority ? 'high' : undefined}
      className={className}
      style={style}
      {...data}
    />
  );
  if (!p) return img;
  return (
    <picture style={{ display: 'contents' }}>
      <source type="image/avif" srcSet={p.avif} sizes={sizes} />
      <source type="image/webp" srcSet={p.webp} sizes={sizes} />
      {img}
    </picture>
  );
}

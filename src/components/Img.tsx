import type { CSSProperties } from 'react';
import { isRaster, variantPath, variantWidths } from '../config/images.ts';
import { imageUrl } from '../config/registry.ts';
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

/** <img> with intrinsic width/height, WebP srcset, and lazy loading by default. */
export function Img({ path, alt, sizes, className, style, priority, ...data }: ImgProps) {
  const { cafe, images } = useCafe();
  const meta = images[path];
  const src = imageUrl(cafe.slug, path);
  const srcSet =
    meta && isRaster(path)
      ? [...variantWidths(meta.w).map((w) => `${imageUrl(cafe.slug, variantPath(path, w))} ${w}w`), `${src} ${meta.w}w`].join(', ')
      : undefined;
  return (
    <img
      src={src}
      srcSet={srcSet}
      sizes={srcSet ? sizes : undefined}
      width={meta?.w}
      height={meta?.h}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding={priority ? 'sync' : 'async'}
      fetchPriority={priority ? 'high' : undefined}
      className={className}
      style={style}
      {...data}
    />
  );
}

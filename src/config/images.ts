/**
 * Responsive image conventions shared by the app, the Vite dev server and the post-build pipeline
 * (pure, no DOM / Node APIs).
 *
 *   source (any size):  cafes/<slug>/images/hero.jpg            ← drop raw phone photos here
 *   served fallback:    /<slug>/images/hero.jpg                  ← re-encoded, ≤ MAX_WIDTH, EXIF-rotated
 *   variants:           /<slug>/images/_r/hero.jpg.800w.avif     ← AVIF + WebP at RESPONSIVE_WIDTHS (+ full)
 */

export interface ImageMeta {
  w: number;
  h: number;
}
/** Intrinsic sizes of the *source* files, keyed by config path ("images/hero.jpg"). */
export type ImageManifest = Record<string, ImageMeta>;

export const MAX_WIDTH = 2000;
export const RESPONSIVE_WIDTHS = [480, 800, 1200, 1600] as const;
export const FORMATS = ['avif', 'webp'] as const;
export type VariantFormat = (typeof FORMATS)[number];

export const isRaster = (path: string) => /\.(?:jpe?g|png|webp|avif)$/i.test(path);

/** Size actually served for the fallback (sources wider than MAX_WIDTH are scaled down). */
export const outputSize = (m: ImageMeta): ImageMeta =>
  m.w <= MAX_WIDTH ? m : { w: MAX_WIDTH, h: Math.round((m.h * MAX_WIDTH) / m.w) };

/** Variant widths for an image: the standard steps below its served width, plus the served width itself. */
export const variantWidths = (sourceWidth: number): number[] => {
  const full = Math.min(sourceWidth, MAX_WIDTH);
  return [...RESPONSIVE_WIDTHS.filter((w) => w < full * 0.9), full];
};

/** "images/hero.jpg" + 800 + avif → "images/_r/hero.jpg.800w.avif" */
export const variantPath = (path: string, width: number, format: VariantFormat) =>
  path.replace(/^images\//, 'images/_r/') + `.${width}w.${format}`;

export const VARIANT_RE = /^images\/_r\/([A-Za-z0-9._-]+)\.(\d+)w\.(avif|webp)$/;

/** Image paths in config are relative to the cafe folder ("images/x.jpg") and served at /<slug>/images/x.jpg. */
export const imageUrl = (slug: string, path: string) => `/${slug}/${path}`;

/** Everything a <picture> needs for one image (null for SVG/GIF or unknown files: plain <img>). */
export function pictureSources(slug: string, path: string, meta: ImageMeta | undefined) {
  if (!meta || !isRaster(path)) return null;
  const out = outputSize(meta);
  const widths = variantWidths(meta.w);
  const set = (f: VariantFormat) => widths.map((w) => `${imageUrl(slug, variantPath(path, w, f))} ${w}w`).join(', ');
  return {
    avif: set('avif'),
    webp: set('webp'),
    src: imageUrl(slug, path),
    width: out.w,
    height: out.h,
  };
}

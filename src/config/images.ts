/**
 * Responsive image conventions shared by the app, the Vite dev server and the
 * post-build script (pure, no DOM / Node APIs).
 *
 *   original:  /<slug>/images/hero.jpg
 *   variants:  /<slug>/images/_r/hero.jpg.800w.webp   (generated, never committed)
 */

export interface ImageMeta {
  w: number;
  h: number;
}
/** Intrinsic sizes keyed by config path ("images/hero.jpg"). */
export type ImageManifest = Record<string, ImageMeta>;

export const RESPONSIVE_WIDTHS = [480, 800, 1200, 1600] as const;

export const isRaster = (path: string) => /\.(?:jpe?g|png|webp|avif)$/i.test(path);

/** Variant widths to generate for an image of the given intrinsic width. */
export const variantWidths = (originalWidth: number): number[] => RESPONSIVE_WIDTHS.filter((w) => w < originalWidth * 0.9);

/** "images/hero.jpg" + 800 → "images/_r/hero.jpg.800w.webp" */
export const variantPath = (path: string, width: number) => path.replace(/^images\//, 'images/_r/') + `.${width}w.webp`;

export const VARIANT_RE = /^images\/_r\/([A-Za-z0-9._-]+)\.(\d+)w\.webp$/;

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { imageSize } from 'image-size';
import sharp from 'sharp';
import { MAX_WIDTH, type ImageManifest, type VariantFormat } from '../../src/config/images.ts';

/** Intrinsic size of every image in a cafe's images/ folder (EXIF orientation applied), keyed "images/<file>". */
export function readImageManifest(cafeDir: string): ImageManifest {
  const dir = path.join(cafeDir, 'images');
  const out: ImageManifest = {};
  if (!existsSync(dir)) return out;
  for (const file of readdirSync(dir)) {
    const full = path.join(dir, file);
    if (!statSync(full).isFile() || file.startsWith('.')) continue;
    try {
      const { width, height, orientation } = imageSize(readFileSync(full));
      // EXIF orientations 5–8 are rotated 90°: phone photos report landscape sizes for portrait shots.
      const swap = orientation !== undefined && orientation >= 5;
      if (width && height) out[`images/${file}`] = swap ? { w: height, h: width } : { w: width, h: height };
    } catch {
      /* not an image */
    }
  }
  return out;
}

const QUALITY = { avif: 50, webp: 74, jpeg: 78 };
const VERSION = 'v2'; // bump to invalidate the encode cache when settings change

/** Resize to `width` and encode (used by the dev server and the post-build). EXIF-rotated, metadata stripped. */
export function renderVariant(source: string | Buffer, width: number, format: VariantFormat): Promise<Buffer> {
  const img = sharp(source).rotate().resize({ width, withoutEnlargement: true });
  return format === 'avif'
    ? img.avif({ quality: QUALITY.avif, effort: 3 }).toBuffer()
    : img.webp({ quality: QUALITY.webp, effort: 4 }).toBuffer();
}

/** The served fallback: same file name and format as the source, ≤ MAX_WIDTH, EXIF-rotated, re-encoded small. */
export function renderFallback(source: string | Buffer, ext: string): Promise<Buffer> {
  const img = sharp(source).rotate().resize({ width: MAX_WIDTH, withoutEnlargement: true });
  switch (ext.toLowerCase()) {
    case '.png':
      return img.png({ compressionLevel: 9, palette: true, quality: 90 }).toBuffer();
    case '.webp':
      return img.webp({ quality: QUALITY.webp }).toBuffer();
    case '.avif':
      return img.avif({ quality: QUALITY.avif }).toBuffer();
    default:
      return img.jpeg({ quality: QUALITY.jpeg, mozjpeg: true, progressive: true }).toBuffer();
  }
}

/** Content-addressed encode cache (node_modules/.cache survives between Vercel builds). */
export function encodeCache(root: string) {
  const dir = path.join(root, 'node_modules', '.cache', 'cafe-images');
  mkdirSync(dir, { recursive: true });
  return async (
    input: Buffer,
    label: string,
    encode: () => Promise<Buffer>,
  ): Promise<{ buf: Buffer; hit: boolean }> => {
    const key = createHash('sha1').update(VERSION).update(label).update(input).digest('hex');
    const file = path.join(dir, key);
    if (existsSync(file)) return { buf: readFileSync(file), hit: true };
    const buf = await encode();
    writeFileSync(file, buf);
    return { buf, hit: false };
  };
}

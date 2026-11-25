import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { imageSize } from 'image-size';
import sharp from 'sharp';
import type { ImageManifest } from '../../src/config/images.ts';

/** Intrinsic size of every image in a cafe's images/ folder, keyed "images/<file>". */
export function readImageManifest(cafeDir: string): ImageManifest {
  const dir = path.join(cafeDir, 'images');
  const out: ImageManifest = {};
  if (!existsSync(dir)) return out;
  for (const file of readdirSync(dir)) {
    const full = path.join(dir, file);
    if (!statSync(full).isFile()) continue;
    try {
      const { width, height } = imageSize(readFileSync(full));
      if (width && height) out[`images/${file}`] = { w: width, h: height };
    } catch {
      /* not an image */
    }
  }
  return out;
}

/** Resize to `width` and encode as WebP (used by the dev server and the post-build). */
export function renderVariant(source: string, width: number): Promise<Buffer> {
  return sharp(source).rotate().resize({ width, withoutEnlargement: true }).webp({ quality: 76, effort: 4 }).toBuffer();
}

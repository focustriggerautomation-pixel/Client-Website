/**
 * npm run placeholders [-- <slug> ...]
 *
 * Draws branded placeholder photos for every image a cafe's config references but that doesn't exist yet, so a
 * cafe can be previewed before the real photos arrive. `npm run check` lists them until they are replaced.
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { referencedImages } from '../src/config/model.ts';
import type { CafeConfig } from '../src/config/schema.ts';
import { CAFES_DIR, cafeSlugs } from './lib/cafes.ts';
import { writePlaceholders } from './lib/placeholders.ts';

const only = process.argv.slice(2).filter((a) => !a.startsWith('--'));
let made = 0;
for (const slug of only.length ? only : cafeSlugs()) {
  const dir = path.join(CAFES_DIR, slug);
  const file = path.join(dir, 'config.json');
  if (!existsSync(file)) {
    console.error(`✖ cafes/${slug}/config.json not found`);
    process.exitCode = 1;
    continue;
  }
  const config = JSON.parse(readFileSync(file, 'utf8')) as CafeConfig;
  const label = (img: string) =>
    path
      .basename(img, path.extname(img))
      .replace(/[-_]+/g, ' ')
      .replace(/\b\w/g, (m) => m.toUpperCase());
  const written = await writePlaceholders(
    dir,
    referencedImages(config).map((p) => ({ path: p, label: label(p) })),
    { a: config.brand?.primary ?? '#666666', b: config.brand?.accent ?? config.brand?.primary ?? '#999999' },
  );
  for (const w of written) console.log(`  + cafes/${slug}/${w}`);
  made += written.length;
}
console.log(
  `✓ ${made} placeholder image${made === 1 ? '' : 's'} drawn${made ? '' : ' (every referenced image already exists)'}`,
);

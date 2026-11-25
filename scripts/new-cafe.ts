/**
 * npm run new-cafe -- <new-slug> [--from <existing-slug>]
 *
 * Copies an existing cafe folder (config + images) as a starting point and sets
 * the new slug. Then edit cafes/<new-slug>/config.json and swap the images.
 */
import { cpSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { RESERVED_SLUGS } from '../src/config/schema.ts';
import { CAFES_DIR, cafeSlugs } from './lib/cafes.ts';

const args = process.argv.slice(2);
const slug = args.find((a) => !a.startsWith('--'));
const fromIdx = args.indexOf('--from');
const from = fromIdx >= 0 ? args[fromIdx + 1] : cafeSlugs()[0];

if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || RESERVED_SLUGS.includes(slug)) {
  console.error('Usage: npm run new-cafe -- <slug> [--from <existing-slug>]\n  slug: lowercase letters, numbers, hyphens (e.g. "blue-tokai")');
  process.exit(1);
}
const target = path.join(CAFES_DIR, slug);
if (existsSync(target)) {
  console.error(`✖ cafes/${slug} already exists.`);
  process.exit(1);
}
if (!from || !existsSync(path.join(CAFES_DIR, from, 'config.json'))) {
  console.error(`✖ Source cafe "${from}" not found. Existing: ${cafeSlugs().join(', ')}`);
  process.exit(1);
}

cpSync(path.join(CAFES_DIR, from), target, { recursive: true });
const configPath = path.join(target, 'config.json');
const config = JSON.parse(readFileSync(configPath, 'utf8'));
config.slug = slug;
delete config.reviews; // never carry reviews over from another business
writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');

console.log(`✓ Created cafes/${slug} (copied from ${from}).
  Next:
   1. Edit cafes/${slug}/config.json (name, tagline, mood, brand, content, contact…)
   2. Replace the files in cafes/${slug}/images/ with the cafe's photos
   3. npm run validate   →   npm run dev and open http://localhost:5173/${slug}`);

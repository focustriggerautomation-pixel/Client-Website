/**
 * Runs after `vite build`. For every cafe:
 *   - copies cafes/<slug>/images → dist/<slug>/images
 *   - writes dist/<slug>/index.html with that cafe's <title>, description,
 *     Open Graph + Twitter tags (og:image = hero image), fonts and theme colours,
 *     so WhatsApp / Instagram / iMessage link previews show the right cafe.
 * Also writes dist/404.html and checks the noindex safeguards are in place.
 */
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { imageSize } from 'image-size';
import { buildTheme } from '../src/theme/buildTheme.ts';
import { loadAllCafes, printErrorsAndExit, ROOT, type LoadedCafe } from './lib/cafes.ts';

const DIST = path.join(ROOT, 'dist');
const HEAD_MARKER = '<!--cafe-head-->';
const WHATSAPP_MAX_BYTES = 600 * 1024;

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

/**
 * Absolute base URL for og:image / og:url (crawlers need absolute URLs).
 * Set SITE_URL for a custom domain; on Vercel the production domain is used automatically.
 */
function siteUrl(): string | null {
  const explicit = process.env.SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, '');
  const host = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  return host ? `https://${host.replace(/\/+$/, '')}` : null;
}

const warnings: string[] = [];

function headFor({ slug, dir, config: c }: LoadedCafe, base: string | null): { title: string; head: string; ogImage: string } {
  const theme = buildTheme(c);
  const title = c.seo?.title ?? `${c.name} — ${c.tagline}`;
  const description = c.seo?.description ?? c.hero.subheadline;

  const heroFile = path.join(dir, c.hero.heroImage);
  const heroBytes = readFileSync(heroFile);
  const version = createHash('sha1').update(heroBytes).digest('hex').slice(0, 10);
  const heroPath = `/${slug}/${c.hero.heroImage}`;
  const ogImage = `${base ?? ''}${heroPath}?v=${version}`; // ?v= busts WhatsApp/FB caches when the image changes
  const pageUrl = `${base ?? ''}/${slug}`;

  const ext = path.extname(heroFile).toLowerCase();
  if (ext === '.svg') warnings.push(`${slug}: hero image is SVG — WhatsApp/Instagram/Facebook previews can't show SVG. Use JPG or PNG.`);
  if (heroBytes.length > WHATSAPP_MAX_BYTES)
    warnings.push(`${slug}: hero image is ${(heroBytes.length / 1024).toFixed(0)} KB — WhatsApp may skip preview images over ~600 KB. Compress it.`);

  let dims: { width?: number; height?: number } = {};
  try {
    dims = imageSize(heroBytes);
  } catch {
    /* unknown format: omit dimensions */
  }
  const imageType = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif', '.avif': 'image/avif' }[ext];

  const tags = [
    `<meta name="description" content="${esc(description)}" />`,
    `<meta name="theme-color" content="${theme.colors.background}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${esc(c.name)}" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta property="og:url" content="${esc(pageUrl)}" />`,
    `<meta property="og:image" content="${esc(ogImage)}" />`,
    ogImage.startsWith('https://') ? `<meta property="og:image:secure_url" content="${esc(ogImage)}" />` : '',
    imageType ? `<meta property="og:image:type" content="${imageType}" />` : '',
    dims.width ? `<meta property="og:image:width" content="${dims.width}" />` : '',
    dims.height ? `<meta property="og:image:height" content="${dims.height}" />` : '',
    `<meta property="og:image:alt" content="${esc(`${c.name} — ${c.hero.headline}`)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(title)}" />`,
    `<meta name="twitter:description" content="${esc(description)}" />`,
    `<meta name="twitter:image" content="${esc(ogImage)}" />`,
    `<link rel="preload" as="image" href="${esc(heroPath)}" fetchpriority="high" />`,
    `<link id="cafe-fonts" rel="stylesheet" href="${esc(theme.fonts.href)}" />`,
    // Paint the cafe's colours before JS runs (no white flash, correct preview screenshots).
    `<style>html{background:${theme.colors.background};color:${theme.colors.ink}}</style>`,
  ].filter(Boolean);

  return { title, head: tags.join('\n    '), ogImage };
}

function render(template: string, title: string, head: string): string {
  return template.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`).replace(HEAD_MARKER, head);
}

// ---------------------------------------------------------------------------

const templatePath = path.join(DIST, 'index.html');
if (!existsSync(templatePath)) {
  console.error('✖ dist/index.html not found — run `vite build` first.');
  process.exit(1);
}
const template = readFileSync(templatePath, 'utf8');
if (!template.includes(HEAD_MARKER)) {
  console.error(`✖ dist/index.html has no ${HEAD_MARKER} marker — did index.html change?`);
  process.exit(1);
}
if (!/<meta name="robots" content="noindex/.test(template)) {
  console.error('✖ index.html is missing <meta name="robots" content="noindex, nofollow"> — refusing to build public-indexable demos.');
  process.exit(1);
}
if (!existsSync(path.join(DIST, 'robots.txt')) || !/Disallow: \/\s*$/m.test(readFileSync(path.join(DIST, 'robots.txt'), 'utf8'))) {
  console.error('✖ dist/robots.txt missing or does not disallow everything.');
  process.exit(1);
}

const { cafes, errors } = loadAllCafes();
if (errors.length) printErrorsAndExit(errors);

const base = siteUrl();
if (!base) {
  warnings.push(
    'No SITE_URL (or Vercel URL) set — og:image/og:url are relative, so link previews only work once deployed on Vercel or built with SITE_URL=https://your-domain.',
  );
}

const rows: string[] = [];
for (const cafe of cafes) {
  const outDir = path.join(DIST, cafe.slug);
  mkdirSync(outDir, { recursive: true });

  const imagesSrc = path.join(cafe.dir, 'images');
  if (existsSync(imagesSrc) && statSync(imagesSrc).isDirectory()) {
    cpSync(imagesSrc, path.join(outDir, 'images'), { recursive: true });
  }

  const { title, head, ogImage } = headFor(cafe, base);
  writeFileSync(path.join(outDir, 'index.html'), render(template, title, head));
  rows.push(`  /${cafe.slug.padEnd(24)} ${cafe.config.mood.padEnd(16)} ${ogImage}`);
}

// Root index + 404: no cafe data, just a sensible title.
writeFileSync(templatePath, render(template, 'Demo index (private)', ''));
writeFileSync(path.join(DIST, '404.html'), render(template, 'Not found', ''));

console.log(`\n✓ Generated ${cafes.length} cafe page${cafes.length === 1 ? '' : 's'}:`);
console.log(rows.join('\n'));
for (const w of warnings) console.warn(`⚠ ${w}`);
console.log('');

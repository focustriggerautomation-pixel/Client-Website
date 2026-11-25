/**
 * Runs after `vite build`. For every cafe:
 *   - image pipeline: every photo in cafes/<slug>/images is EXIF-rotated, capped at 2000px and re-encoded as the
 *     served fallback (same file name), plus AVIF + WebP variants in several widths (content-cached)
 *   - favicons from the logo (if square) or a monogram of the initials, in brand colours
 *   - prerenders the first screen (header + hero + intro splash) into the HTML, so it paints before any JS
 *   - writes dist/<slug>/index.html with that cafe's <title>, description, Open Graph + Twitter tags
 *     (og:image = optimised hero), theme colours, non-blocking fonts and a hero image preload
 * Also writes the private index + 404 and refuses to build if the noindex safeguards are missing.
 */
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { FORMATS, isRaster, outputSize, pictureSources, variantPath, variantWidths } from '../src/config/images.ts';
import type { Mood } from '../src/config/model.ts';
import { renderShell, themeVars } from '../src/prerender.tsx';
import { buildTheme } from '../src/theme/buildTheme.ts';
import { loadAllCafes, printErrorsAndExit, ROOT, type LoadedCafe } from './lib/cafes.ts';
import { buildFavicons } from './lib/favicon.ts';
import { encodeCache, readImageManifest, renderFallback, renderVariant } from './lib/images.ts';
import { shellIntroCss } from './lib/shellIntro.ts';

const DIST = path.join(ROOT, 'dist');
const HEAD_MARKER = '<!--cafe-head-->';
const WHATSAPP_MAX_BYTES = 600 * 1024;
const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const kb = (n: number) => `${Math.round(n / 1024)} KB`;
const warnings: string[] = [];

/** Must match the `sizes` each mood's hero passes to its <Img>, so the preload fetches the same file. */
const HERO_SIZES: Record<Mood, string> = {
  'dark-premium': '100vw',
  'bright-cafe': '(min-width: 1024px) 45vw, (min-width: 640px) 28rem, 90vw',
  'warm-restaurant': '(min-width: 1024px) 55vw, 100vw',
};

/**
 * Absolute base URL for og:image / og:url (crawlers need absolute URLs).
 * SITE_URL for a custom domain; on Vercel: production domain for production builds, the branch URL for previews.
 */
function siteUrl(): string | null {
  const explicit = process.env.SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, '');
  const env = process.env;
  const host =
    env.VERCEL_ENV === 'preview'
      ? env.VERCEL_BRANCH_URL || env.VERCEL_URL
      : env.VERCEL_PROJECT_PRODUCTION_URL || env.VERCEL_URL;
  return host ? `https://${host.replace(/\/+$/, '')}` : null;
}

/* ── image pipeline ─────────────────────────────────────────────────────────────────────────────── */

const cache = encodeCache(ROOT);
const stats = { sourceBytes: 0, servedBytes: 0, encodes: 0, cached: 0 };

async function processImages(cafe: LoadedCafe, outDir: string) {
  const srcDir = path.join(cafe.dir, 'images');
  if (!existsSync(srcDir)) return;
  const manifest = readImageManifest(cafe.dir);
  const jobs: Promise<void>[] = [];
  const queue: (() => Promise<void>)[] = [];
  for (const file of readdirSync(srcDir)) {
    const full = path.join(srcDir, file);
    if (file.startsWith('.') || !statSync(full).isFile()) continue;
    const rel = `images/${file}`;
    const dest = path.join(outDir, rel);
    mkdirSync(path.dirname(dest), { recursive: true });
    const input = readFileSync(full);
    stats.sourceBytes += input.length;
    const meta = manifest[rel];
    if (!isRaster(rel) || !meta) {
      copyFileSync(full, dest); // SVG / GIF / anything else: served as-is
      stats.servedBytes += input.length;
      continue;
    }
    const run = async (label: string, out: string, encode: () => Promise<Buffer>) => {
      const { buf, hit } = await cache(input, label, encode);
      mkdirSync(path.dirname(out), { recursive: true });
      writeFileSync(out, buf);
      stats.servedBytes += buf.length;
      if (hit) stats.cached++;
      else stats.encodes++;
    };
    queue.push(() => run('fallback', dest, () => renderFallback(input, path.extname(file))));
    for (const w of variantWidths(meta.w))
      for (const f of FORMATS)
        queue.push(() => run(`${w}.${f}`, path.join(outDir, variantPath(rel, w, f)), () => renderVariant(input, w, f)));
  }
  // bounded parallelism: sharp already uses a thread pool; this just keeps memory flat on big photo sets
  const workers = Array.from({ length: 4 }, async () => {
    for (let job = queue.shift(); job; job = queue.shift()) await job();
  });
  jobs.push(...workers);
  await Promise.all(jobs);
}

/* ── page head ──────────────────────────────────────────────────────────────────────────────────── */

function headFor(
  cafe: LoadedCafe,
  base: string | null,
  faviconLinks: string,
): { title: string; head: string; ogImage: string } {
  const { slug, config: c } = cafe;
  const theme = buildTheme(c);
  const title = c.seo?.title ?? `${c.name} — ${c.tagline}`;
  const description = c.seo?.description ?? c.hero.subheadline;

  const heroOut = path.join(DIST, slug, c.hero.heroImage); // the optimised file that is actually served
  const heroBytes = readFileSync(heroOut);
  const version = createHash('sha1').update(heroBytes).digest('hex').slice(0, 10);
  const heroPath = `/${slug}/${c.hero.heroImage}`;
  const ogImage = `${base ?? ''}${heroPath}?v=${version}`; // ?v= busts WhatsApp/FB caches when the image changes
  const pageUrl = `${base ?? ''}/${slug}`;

  const ext = path.extname(heroOut).toLowerCase();
  if (ext === '.svg')
    warnings.push(`${slug}: hero image is SVG — WhatsApp/Instagram/Facebook previews can't show SVG. Use JPG or PNG.`);
  if (heroBytes.length > WHATSAPP_MAX_BYTES)
    warnings.push(`${slug}: hero image is ${kb(heroBytes.length)} even after optimisation — WhatsApp may skip it.`);

  const meta = readImageManifest(cafe.dir)[c.hero.heroImage];
  const dims = meta ? outputSize(meta) : null;
  const pic = pictureSources(slug, c.hero.heroImage, meta);
  const imageType = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.avif': 'image/avif',
  }[ext];
  const { css } = themeVars(c);
  const font = esc(theme.fonts.href);

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
    dims ? `<meta property="og:image:width" content="${dims.w}" />` : '',
    dims ? `<meta property="og:image:height" content="${dims.h}" />` : '',
    `<meta property="og:image:alt" content="${esc(`${c.name} — ${c.hero.headline}`)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(title)}" />`,
    `<meta name="twitter:description" content="${esc(description)}" />`,
    `<meta name="twitter:image" content="${esc(ogImage)}" />`,
    faviconLinks,
    // the LCP image: same AVIF candidates and sizes as the hero <picture>, so nothing is fetched twice
    pic
      ? `<link rel="preload" as="image" type="image/avif" imagesrcset="${esc(pic.avif)}" imagesizes="${esc(HERO_SIZES[theme.mood])}" fetchpriority="high" />`
      : `<link rel="preload" as="image" href="${esc(heroPath)}" fetchpriority="high" />`,
    // fonts never block the first paint (text shows in the fallback font, swaps when loaded)
    `<link id="cafe-fonts" rel="preload" as="style" href="${font}" onload="this.onload=null;this.rel='stylesheet'" />`,
    `<noscript><link rel="stylesheet" href="${font}" /></noscript>`,
    // the cafe's theme, so the prerendered first screen paints in brand colours before the CSS bundle applies
    `<style>${css}html{background:${theme.colors.background};color:${theme.colors.ink}}` +
      // first-load intro as CSS on the prerendered screen (starts at first paint, ends visible)
      shellIntroCss(theme.mood).css +
      `</style>`,
  ].filter(Boolean);
  return { title, head: tags.join('\n    '), ogImage };
}

/**
 * Inline, before first paint. Decides how the prerendered first screen starts:
 *   - ?mood= / ?preview= → drop the prerender (it is built for the cafe's own mood); the app renders live
 *   - intro won't play (seen this session, deep link, reduced motion, ?motion=off|reduced) → no splash, hero static
 *   - otherwise → html.shell-intro: the CSS intro runs now; the app hydrates when it has finished (__shellIntroUntil)
 */
const shellScript = (slug: string, t: { mountAtMs: number; endsAtMs: number }) =>
  `<script>(function(){try{var r=document.getElementById('root'),o=document.getElementById('shell-intro'),u=new URLSearchParams(location.search);` +
  `if(u.has('mood')||u.has('preview')){r.innerHTML='';r.removeAttribute('data-shell');o.remove();return}` +
  `var q=u.get('motion'),seen=false;try{seen=!!sessionStorage.getItem(${JSON.stringify(`intro-seen:${slug}`)})}catch(e){}` +
  `if(location.hash||seen||q==='off'||q==='reduced'||matchMedia('(prefers-reduced-motion: reduce)').matches){o.remove();return}` +
  `document.documentElement.classList.add('shell-intro');window.__shellIntroUntil=performance.now()+${t.mountAtMs};window.__shellIntroEnds=performance.now()+${t.endsAtMs}}catch(e){}})()</script>`;

function render(
  template: string,
  opts: {
    title: string;
    head: string;
    mood?: string;
    shell?: { app: string; intro: string };
    slug?: string;
  },
): string {
  let html = template
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(opts.title)}</title>`)
    .replace(HEAD_MARKER, opts.head);
  if (opts.mood) html = html.replace('<html lang="en">', `<html lang="en" data-mood="${opts.mood}">`);
  if (opts.shell !== undefined && opts.slug && opts.mood)
    html = html.replace(
      '<div id="root"></div>',
      `<div id="root" data-shell>${opts.shell.app}</div><div id="shell-intro">${opts.shell.intro}</div>${shellScript(opts.slug, shellIntroCss(opts.mood as Mood))}`,
    );
  return html;
}

/* ── main ───────────────────────────────────────────────────────────────────────────────────────── */

const templatePath = path.join(DIST, 'index.html');
if (!existsSync(templatePath)) {
  console.error('✖ dist/index.html not found — run `vite build` first.');
  process.exit(1);
}
const template = readFileSync(templatePath, 'utf8');
if (!template.includes(HEAD_MARKER) || !template.includes('<div id="root"></div>')) {
  console.error(`✖ dist/index.html is missing ${HEAD_MARKER} or an empty <div id="root"> — did index.html change?`);
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
if (!base)
  warnings.push(
    'No SITE_URL (or Vercel URL) set — og:image/og:url are relative, so link previews only work once deployed on Vercel or built with SITE_URL=https://your-domain.',
  );

const started = Date.now();
const rows: string[] = [];
for (const cafe of cafes) {
  const outDir = path.join(DIST, cafe.slug);
  mkdirSync(outDir, { recursive: true });
  await processImages(cafe, outDir);

  const theme = buildTheme(cafe.config);
  const fav = await buildFavicons({
    urlBase: `/${cafe.slug}`,
    name: cafe.config.name,
    logoFile: cafe.config.brand.logo ? path.join(cafe.dir, cafe.config.brand.logo) : null,
    bg: theme.colors.primary,
    fg: theme.colors.onPrimary,
  });
  for (const [file, data] of Object.entries(fav.files)) writeFileSync(path.join(outDir, file), data);

  const shell = await renderShell(cafe.config, readImageManifest(cafe.dir));
  const { title, head, ogImage } = headFor(cafe, base, fav.links);
  writeFileSync(
    path.join(outDir, 'index.html'),
    render(template, { title, head, mood: theme.mood, shell, slug: cafe.slug }),
  );
  rows.push(`  /${cafe.slug.padEnd(24)} ${cafe.config.mood.padEnd(16)} ${ogImage}`);
}

// Private index + 404: no cafe data, neutral favicon.
const rootFav = await buildFavicons({
  urlBase: '',
  name: 'Demos',
  logoFile: null,
  bg: '#1c1917',
  fg: '#fafaf9',
});
for (const [file, data] of Object.entries(rootFav.files)) writeFileSync(path.join(DIST, file), data);
writeFileSync(templatePath, render(template, { title: 'Demo index (private)', head: rootFav.links }));
writeFileSync(path.join(DIST, '404.html'), render(template, { title: 'Not found', head: rootFav.links }));

console.log(
  `\n✓ Generated ${cafes.length} cafe page${cafes.length === 1 ? '' : 's'} (prerendered first screen, favicons):`,
);
console.log(rows.join('\n'));
console.log(
  `✓ Images: ${kb(stats.sourceBytes)} of source photos → ${kb(stats.servedBytes)} served (fallbacks + AVIF/WebP variants); ` +
    `${stats.encodes} encoded, ${stats.cached} from cache, ${((Date.now() - started) / 1000).toFixed(1)}s`,
);
for (const w of warnings) console.warn(`⚠ ${w}`);
console.log('');

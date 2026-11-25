/**
 * npm run check [-- <slug> ...] [--strict]
 *
 * The pre-deploy check for every cafe (or the ones named):
 *   ✖ errors   — broken config fields, missing or unreadable photos, unsupported formats, enormous files.
 *                The build would fail or the page would break: fix these first. (exit code 1)
 *   ⚠ warnings — fine to deploy, not yet fine to pitch: placeholder photos, template text, placeholder phone
 *                numbers, photos too small to look sharp, very large files. (--strict turns them into errors)
 *   · notes    — files in images/ that nothing uses, reminders.
 */
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { dayIntervals, referencedImages, storyParagraphs, type Mood } from '../src/config/model.ts';
import { CafeConfigError, parseCafeConfig, type CafeConfig } from '../src/config/schema.ts';
import { CAFES_DIR, cafeSlugs } from './lib/cafes.ts';
import { readPlaceholderList } from './lib/placeholders.ts';
import { DEFAULT_HOURS, templateCopy } from './lib/template.ts';

const args = process.argv.slice(2);
const strict = args.includes('--strict');
const only = args.filter((a) => !a.startsWith('--'));

const MB = 1024 * 1024;
const LIMITS = {
  /** above this a photo is worth exporting smaller (the build copes, but the repo and builds get heavy) */
  bigFile: 12 * MB,
  /** above this, refuse: GitHub rejects files over 100 MB, and nothing needs to be this big */
  hugeFile: 40 * MB,
  heroMinWidth: 1400,
  minLongSide: 900,
};
const SUPPORTED = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.svg', '.gif']);
const CONVERT_HINT: Record<string, string> = {
  '.heic':
    'iPhone HEIC photos aren’t supported by browsers — export as JPG (Photos → Export, or set Camera → Formats → Most Compatible)',
  '.heif': 'HEIF isn’t supported by browsers — export as JPG',
  '.tif': 'TIFF isn’t supported by browsers — export as JPG',
  '.tiff': 'TIFF isn’t supported by browsers — export as JPG',
  '.bmp': 'BMP isn’t supported — export as JPG or PNG',
  '.psd': 'Photoshop files aren’t images browsers can show — export as JPG or PNG',
};

type Report = { errors: string[]; warnings: string[]; notes: string[] };

const color = {
  red: (s: string) => `\x1b[31m${s}\x1b[0m`,
  yellow: (s: string) => `\x1b[33m${s}\x1b[0m`,
  green: (s: string) => `\x1b[32m${s}\x1b[0m`,
  dim: (s: string) => `\x1b[2m${s}\x1b[0m`,
  bold: (s: string) => `\x1b[1m${s}\x1b[0m`,
};
const mb = (n: number) => `${(n / MB).toFixed(1)} MB`;

async function checkCafe(slug: string): Promise<Report> {
  const r: Report = { errors: [], warnings: [], notes: [] };
  const dir = path.join(CAFES_DIR, slug);
  const file = path.join(dir, 'config.json');
  if (!existsSync(file)) {
    r.errors.push('config.json is missing');
    return r;
  }

  // 1. Config fields
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(file, 'utf8'));
  } catch (e) {
    r.errors.push(
      `config.json is not valid JSON — ${(e as Error).message} (a missing comma or quote is the usual cause)`,
    );
    return r;
  }
  let config: CafeConfig;
  try {
    config = parseCafeConfig(raw, `cafes/${slug}/config.json`, slug);
  } catch (e) {
    if (!(e instanceof CafeConfigError)) throw e;
    r.errors.push(...e.problems);
    return r;
  }

  // 2. Photos the config uses
  const placeholders = readPlaceholderList(dir);
  const used = referencedImages(config);
  const usedSet = new Set(used);
  for (const rel of used) {
    const abs = path.join(dir, rel);
    const ext = path.extname(rel).toLowerCase();
    if (!existsSync(abs)) {
      const near = existsSync(path.dirname(abs))
        ? readdirSync(path.dirname(abs)).find((f) => f.toLowerCase() === path.basename(rel).toLowerCase())
        : undefined;
      r.errors.push(
        `missing photo: ${rel}` +
          (near
            ? ` — there is "${near}": names are case-sensitive, rename it to "${path.basename(rel)}"`
            : ' (referenced in config.json — add the file or fix the name)'),
      );
      continue;
    }
    if (!SUPPORTED.has(ext)) {
      r.errors.push(`${rel}: ${CONVERT_HINT[ext] ?? `"${ext}" files aren’t supported — use .jpg, .png or .webp`}`);
      continue;
    }
    const size = statSync(abs).size;
    if (size > LIMITS.hugeFile)
      r.errors.push(`${rel} is ${mb(size)} — too big to deploy; export it smaller (under ~10 MB)`);
    else if (size > LIMITS.bigFile)
      r.warnings.push(`${rel} is ${mb(size)} — works, but slows builds; consider exporting it smaller`);

    const buf = readFileSync(abs);
    if (placeholders[rel] && placeholders[rel] === createHash('sha1').update(buf).digest('hex')) {
      r.warnings.push(`${rel} is still a placeholder — drop in the real photo`);
      continue;
    }
    if (ext === '.svg') continue;
    try {
      const m = await sharp(buf).metadata();
      const [w, h] = (m.orientation ?? 1) >= 5 ? [m.height ?? 0, m.width ?? 0] : [m.width ?? 0, m.height ?? 0];
      if (rel === config.hero.heroImage && w < LIMITS.heroMinWidth)
        r.warnings.push(
          `${rel} is only ${w}×${h} — the hero fills the screen, so it will look soft (use ${LIMITS.heroMinWidth}+ px wide)`,
        );
      else if (rel !== config.brand.logo && Math.max(w, h) < LIMITS.minLongSide)
        r.warnings.push(
          `${rel} is only ${w}×${h} — may look soft on large screens (aim for ${LIMITS.minLongSide}+ px on the long side)`,
        );
      if (rel === config.hero.heroImage && h > w * 1.1)
        r.notes.push(`${rel} is portrait — a landscape hero photo usually crops better`);
    } catch {
      r.errors.push(`${rel} can’t be read as an image — the file may be damaged or have the wrong extension`);
    }
  }

  // 3. Files in images/ that nothing uses
  const imagesDir = path.join(dir, 'images');
  if (existsSync(imagesDir)) {
    for (const f of readdirSync(imagesDir)) {
      if (f.startsWith('.') || statSync(path.join(imagesDir, f)).isDirectory()) continue;
      const rel = `images/${f}`;
      if (usedSet.has(rel)) continue;
      const ext = path.extname(f).toLowerCase();
      if (CONVERT_HINT[ext]) r.warnings.push(`${rel}: ${CONVERT_HINT[ext]}`);
      else r.notes.push(`${rel} isn’t used by config.json (it won’t be published)`);
    }
  }

  // 4. Text and details still from the template or obviously placeholder
  const t = templateCopy(config.mood as Mood, config.name);
  const same = (a: string | undefined, b: string) => a?.trim() === b.trim();
  const generic: string[] = [];
  if (same(config.tagline, t.tagline)) generic.push('tagline');
  if (same(config.hero.headline, t.headline)) generic.push('hero.headline');
  if (same(config.hero.subheadline, t.subheadline)) generic.push('hero.subheadline');
  if (same(config.about.title, t.aboutTitle)) generic.push('about.title');
  const story = storyParagraphs(config);
  if (story.some((p) => t.story.some((s) => same(p, s)) || /\(replace this|placeholder/i.test(p)))
    generic.push('about.story');
  const templateItems = new Set(t.menu.flatMap((c) => c.items.map(([n]) => n as string)));
  const items = config.menu.categories.flatMap((c) => c.items);
  const leftover = items.filter((i) => templateItems.has(i.name)).length;
  if (leftover) generic.push(`menu (${leftover} of ${items.length} items are template dishes)`);
  if (same(config.cta.text, t.cta))
    r.notes.push('cta.text is the default — fine, or make it theirs (e.g. "Book a table")');
  if (generic.length) r.warnings.push(`template text still in: ${generic.join(', ')}`);

  if (JSON.stringify(config.hours) === JSON.stringify(DEFAULT_HOURS))
    r.warnings.push(
      'opening hours are the template’s 9 am–10 pm every day — copy their real hours (Google Maps listing)',
    );
  else if (Object.values(config.hours).every((d) => dayIntervals(d).length === 0))
    r.warnings.push('every day is marked "closed"');

  for (const [k, v] of [
    ['contact.phone', config.contact.phone],
    ['contact.whatsapp', config.contact.whatsapp],
  ] as const)
    if (/0{5}|12345|98765 ?43210/.test(v)) r.warnings.push(`${k} looks like a placeholder number (${v})`);
  if (/sample|placeholder|no\. 00\b/i.test(config.contact.address))
    r.warnings.push('contact.address looks like a placeholder');
  if (/placeholder|example/i.test(config.contact.instagram))
    r.warnings.push('contact.instagram looks like a placeholder');
  if (!/\/maps\/embed\?pb=/.test(config.contact.mapsEmbedUrl))
    r.notes.push(
      'map uses an address search — for the exact pin: Google Maps → Share → Embed a map → copy the src="…" link',
    );

  if (config.reviews?.length)
    r.notes.push(`${config.reviews.length} review(s) shown — make sure each one is real and quoted word for word`);
  return r;
}

/* ── run ──────────────────────────────────────────────────────────────────────────────────────── */

const slugs = only.length ? only : cafeSlugs();
if (!slugs.length) {
  console.error('✖ No cafes found in /cafes. Create one with: npm run new-cafe');
  process.exit(1);
}
let errors = 0;
let warnings = 0;
console.log('');
for (const slug of slugs) {
  if (!existsSync(path.join(CAFES_DIR, slug))) {
    console.log(`${color.red('✖')} ${color.bold(slug)}\n    ${color.red('✖')} no folder cafes/${slug}\n`);
    errors++;
    continue;
  }
  const r = await checkCafe(slug);
  errors += r.errors.length;
  warnings += r.warnings.length;
  const icon = r.errors.length ? color.red('✖') : r.warnings.length ? color.yellow('⚠') : color.green('✓');
  const status = r.errors.length
    ? color.red('not deployable')
    : r.warnings.length
      ? color.yellow('deployable, not pitch-ready')
      : color.green('ready');
  console.log(`${icon} ${color.bold(slug)}  ${color.dim('/' + slug)}  ${status}`);
  for (const e of r.errors) console.log(`    ${color.red('✖')} ${e}`);
  for (const w of r.warnings) console.log(`    ${color.yellow('⚠')} ${w}`);
  for (const n of r.notes) console.log(`    ${color.dim('· ' + n)}`);
  console.log('');
}
const summary = `${slugs.length} cafe${slugs.length === 1 ? '' : 's'} checked: ${errors} error${errors === 1 ? '' : 's'}, ${warnings} warning${warnings === 1 ? '' : 's'}`;
if (errors || (strict && warnings)) {
  console.log(color.red(`✖ ${summary}${errors ? ' — fix the errors before deploying' : ' (--strict)'}`));
  process.exit(1);
}
console.log(
  warnings
    ? color.yellow(`⚠ ${summary} — fine to deploy; fix the warnings before pitching`)
    : color.green(`✓ ${summary}`),
);

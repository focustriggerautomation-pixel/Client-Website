/**
 * npm run new-cafe
 *
 * Asks a few questions (name, link, mood, colours, phone/WhatsApp, address, Instagram) and creates
 * cafes/<slug>/ with a filled config.json, an images/ folder with branded placeholder photos, and prints the list
 * of photos to drop in. Every answer can also be given as a flag, e.g. --name="Blue Door" --mood=bright-cafe
 * (--yes accepts the defaults for anything not given).
 */
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { createInterface } from 'node:readline';
import { MOODS, RESERVED_SLUGS, type Mood } from '../src/config/model.ts';
import { CafeConfigError, parseCafeConfig } from '../src/config/schema.ts';
import { CAFES_DIR } from './lib/cafes.ts';
import { writePlaceholders } from './lib/placeholders.ts';
import { DEFAULT_HOURS, MOOD_INFO, PHOTO_PLAN, templateCopy } from './lib/template.ts';

/* ── input: flags first, then questions (works typed or piped) ─────────────────────────────────── */

const flags = new Map<string, string>();
for (const a of process.argv.slice(2)) {
  const m = /^--([a-z-]+)(?:=(.*))?$/.exec(a);
  if (m) flags.set(m[1], m[2] ?? 'true');
}
const acceptDefaults = flags.has('yes');

const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: process.stdin.isTTY });
const queue: string[] = [];
const waiting: ((line: string | null) => void)[] = [];
let closed = false;
rl.on('line', (l) => (waiting.length ? waiting.shift()!(l) : queue.push(l)));
rl.on('close', () => {
  closed = true;
  while (waiting.length) waiting.shift()!(null);
});
const nextLine = () =>
  new Promise<string | null>((resolve) => {
    if (queue.length) resolve(queue.shift()!);
    else if (closed) resolve(null);
    else waiting.push(resolve);
  });

const c = {
  dim: (s: string) => `\x1b[2m${s}\x1b[0m`,
  bold: (s: string) => `\x1b[1m${s}\x1b[0m`,
  red: (s: string) => `\x1b[31m${s}\x1b[0m`,
};

/** Ask until `check` accepts the answer (it returns the cleaned value, or an error message prefixed with "!"). */
async function ask(
  flag: string,
  question: string,
  def: string,
  check: (v: string) => string = (v) => v,
): Promise<string> {
  const given = flags.get(flag);
  if (given !== undefined) {
    const r = check(given.trim() || def);
    if (r.startsWith('!')) fail(`--${flag}: ${r.slice(1)}`);
    return r;
  }
  if (acceptDefaults && def) return check(def);
  for (;;) {
    process.stdout.write(`${c.bold(question)}${def ? c.dim(` (${def})`) : ''}: `);
    const line = await nextLine();
    if (line === null) fail(`no answer for "${question}"`);
    if (!process.stdin.isTTY) process.stdout.write(`${line}\n`);
    const r = check(line.trim() || def);
    if (!r.startsWith('!')) return r;
    console.log(c.red(`  ${r.slice(1)}`));
  }
}

function fail(msg: string): never {
  console.error(`✖ ${msg}`);
  process.exit(1);
}

/* ── answer checks ──────────────────────────────────────────────────────────────────────────────── */

const slugify = (s: string) =>
  s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/, '');

const required = (what: string) => (v: string) => (v ? v : `!${what} is required`);

function checkSlug(v: string): string {
  const s = v.toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s))
    return '!use lowercase letters, numbers and single hyphens, e.g. blue-door-cafe';
  if ((RESERVED_SLUGS as readonly string[]).includes(s)) return `!"${s}" is reserved, pick another`;
  if (existsSync(path.join(CAFES_DIR, s))) return `!cafes/${s} already exists`;
  return s;
}

function checkMood(v: string): string {
  const n = Number(v);
  if (Number.isInteger(n) && n >= 1 && n <= MOODS.length) return MOODS[n - 1];
  return (MOODS as readonly string[]).includes(v) ? v : `!type 1, 2 or 3`;
}

function checkColor(v: string): string {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(v.trim());
  if (!m) return '!a hex colour like #C8A26B (tip: pick it from their logo or Instagram with any colour picker)';
  const hex = m[1].length === 3 ? [...m[1]].map((x) => x + x).join('') : m[1];
  return `#${hex.toUpperCase()}`;
}

function checkPhone(v: string): string {
  const s = v.replace(/[^\d+]/g, '');
  if (!/^\+?\d{8,15}$/.test(s)) return '!a phone number with country code, e.g. +91 98765 43210';
  const digits = s.replace(/^\+/, '');
  // Indian numbers read best as +91 98765 43210; leave other countries as typed (digits only)
  if (/^91\d{10}$/.test(digits)) return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
  if (/^\d{10}$/.test(digits)) return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  return `+${digits}`;
}

function checkInstagram(v: string): string {
  const h = v
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, '')
    .replace(/^@/, '')
    .replace(/[/?#].*$/, '');
  return /^[A-Za-z0-9._]{1,30}$/.test(h) ? h : '!an Instagram handle like bluedoorcafe (or the profile link)';
}

/* ── questions ──────────────────────────────────────────────────────────────────────────────────── */

console.log(`\n${c.bold('New cafe demo')} ${c.dim('— press Enter to accept the suggestion in brackets.')}\n`);

const name = await ask('name', 'Cafe name', '', required('the name'));
const slug = await ask('slug', `Link name (site.com/…)`, slugify(name), checkSlug);
console.log(c.dim(MOODS.map((m, i) => `  ${i + 1}. ${MOOD_INFO[m].label} — ${MOOD_INFO[m].feel}`).join('\n')));
const mood = (await ask('mood', 'Mood (1, 2 or 3)', '', checkMood)) as Mood;
const defaults = MOOD_INFO[mood].colors;
console.log(c.dim('  Colours: hex codes from their logo/signage. Enter keeps the mood’s own palette.'));
const primary = await ask('primary', 'Main brand colour', defaults.primary, checkColor);
const accent = await ask('accent', 'Second colour', defaults.accent, checkColor);
const background = await ask('background', 'Background colour', defaults.background, checkColor);
const phone = await ask('phone', 'Phone number', '', checkPhone);
const whatsapp = await ask('whatsapp', 'WhatsApp number', phone, checkPhone);
const address = await ask('address', 'Full address', '', required('the address'));
const instagram = await ask('instagram', 'Instagram handle', '', checkInstagram);
rl.close();

/* ── write the cafe ─────────────────────────────────────────────────────────────────────────────── */

const copy = templateCopy(mood, name);
const signature = (i: number) => `images/menu-${i}.jpg`;
let sig = 0;
const config = {
  slug,
  name,
  tagline: copy.tagline,
  mood,
  brand: { primary, accent, background },
  hero: { headline: copy.headline, subheadline: copy.subheadline, heroImage: 'images/hero.jpg' },
  about: { title: copy.aboutTitle, story: copy.story, images: ['images/about-1.jpg', 'images/about-2.jpg'] },
  menu: {
    categories: copy.menu.map((cat) => ({
      name: cat.name,
      items: cat.items.map(([n, description, price, tag]) => ({
        name: n,
        description,
        price,
        ...(tag ? { tag } : {}),
        // the first two signature/bestseller dishes get a photo
        ...((tag === 'Signature' || tag === 'Bestseller') && sig < 2 ? { image: signature(++sig) } : {}),
      })),
    })),
  },
  gallery: [1, 2, 3, 4, 5, 6].map((n) => `images/gallery-${n}.jpg`),
  hours: DEFAULT_HOURS,
  contact: {
    address,
    mapsEmbedUrl: `https://www.google.com/maps?q=${encodeURIComponent(`${name}, ${address}`)}&output=embed`,
    phone,
    whatsapp,
    instagram,
  },
  cta: { text: copy.cta, action: mood === 'warm-restaurant' ? 'call' : 'whatsapp' },
};

try {
  parseCafeConfig(config, `cafes/${slug}/config.json`);
} catch (e) {
  fail(e instanceof CafeConfigError ? e.message : String(e));
}

const dir = path.join(CAFES_DIR, slug);
mkdirSync(path.join(dir, 'images'), { recursive: true });
try {
  writeFileSync(path.join(dir, 'config.json'), JSON.stringify(config, null, 2) + '\n');
  const labels = new Map(PHOTO_PLAN.map((p) => [`images/${p.file}`, p.what.split(' — ')[0].split(' (')[0]]));
  await writePlaceholders(
    dir,
    PHOTO_PLAN.map((p) => ({ path: `images/${p.file}`, label: labels.get(`images/${p.file}`)! })),
    { a: primary, b: accent },
  );
} catch (e) {
  rmSync(dir, { recursive: true, force: true });
  throw e;
}

const w = Math.max(...PHOTO_PLAN.map((p) => p.file.length));
console.log(`
✓ Created cafes/${slug}/  (config.json + images/ with placeholder photos — it previews right away)

${c.bold(`Drop these photos into cafes/${slug}/images/`)} ${c.dim('(same file names, replacing the placeholders):')}
${PHOTO_PLAN.map((p) => `  ${p.file.padEnd(w)}  ${p.what}\n  ${' '.repeat(w)}  ${c.dim(p.size)}`).join('\n')}
  ${'logo.png'.padEnd(w)}  Optional: their logo (.png or .svg), transparent background → add "logo": "images/logo.png" under "brand"
  ${' '.repeat(w)}  ${c.dim('square-ish logos also become the browser-tab icon')}

  ${c.dim('Raw phone photos or Instagram downloads are fine: the build resizes and compresses them.')}
  ${c.dim('Use .jpg/.png/.webp (export iPhone HEIC as JPG). Keep each under ~15 MB.')}

${c.bold('Then edit cafes/' + slug + '/config.json')}: tagline, headline, story, menu and prices, opening hours.
  ${c.dim('Everything is pre-filled with template text so the demo looks complete — `npm run check` lists what is still generic.')}

Next:  npm run check   →   npm run dev  and open  http://localhost:5173/${slug}
`);

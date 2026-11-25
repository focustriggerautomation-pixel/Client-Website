/**
 * npm run placeholders [-- <slug> ...] [--force]
 *
 * Renders labelled gradient placeholders (JPG) for every image a cafe config
 * references but that doesn't exist yet, using the cafe's brand colours.
 * Lets you preview a new cafe before the real photos arrive. No downloads.
 *
 * Needs Playwright with Chromium (dev machine only, not used by the build):
 *   npm i -D playwright && npx playwright install chromium
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require('playwright'));
} catch {
  console.error('Playwright not found. Install it with: npm i -D playwright && npx playwright install chromium');
  process.exit(1);
}

const ROOT = path.resolve(import.meta.dirname, '..');
const CAFES = path.join(ROOT, 'cafes');
const args = process.argv.slice(2);
const force = args.includes('--force');
const only = args.filter((a) => !a.startsWith('--'));

const slugs = readdirSync(CAFES).filter(
  (s) => !s.startsWith('_') && !s.startsWith('.') && statSync(path.join(CAFES, s)).isDirectory() && (!only.length || only.includes(s)),
);

/** [width, height, role label] per kind of image. */
function jobsFor(c) {
  const jobs = [[c.hero.heroImage, 1600, 1000, 'Hero photo']];
  c.about.images.forEach((p, i) => jobs.push([p, 1000, 1250, `About photo ${i + 1}`]));
  c.gallery.forEach((p, i) => jobs.push([p, 1200, 1200, `Gallery ${i + 1}`]));
  for (const cat of c.menu.categories) for (const it of cat.items) if (it.image) jobs.push([it.image, 800, 800, it.name]);
  return jobs.filter(([p]) => !p.endsWith('.svg'));
}

const html = ({ w, h, a, b, ink, label, sub, seed }) => `<!doctype html><html><body style="margin:0">
<div style="width:${w}px;height:${h}px;position:relative;overflow:hidden;font-family:ui-sans-serif,system-ui,sans-serif;
  background:radial-gradient(${60 + (seed % 30)}% ${70 + (seed % 20)}% at ${(seed * 37) % 100}% ${(seed * 53) % 100}%, ${b} 0%, transparent 70%),
  linear-gradient(${(seed * 47) % 360}deg, ${a}, ${b});">
  <div style="position:absolute;inset:0;background:repeating-linear-gradient(135deg, rgba(255,255,255,.05) 0 2px, transparent 2px 22px)"></div>
  <div style="position:absolute;right:${label === 'Hero photo' ? 30 : 6}%;bottom:${label === 'Hero photo' ? 10 : 7}%;text-align:right;color:${ink}">
    <div style="font-size:${Math.round(Math.min(w, h) / 13)}px;font-weight:700;letter-spacing:-.01em">${label}</div>
    <div style="margin-top:.6em;font-size:${Math.round(Math.min(w, h) / 32)}px;opacity:.7;letter-spacing:.2em;text-transform:uppercase">${sub}</div>
  </div>
</div></body></html>`;

const lum = (hex) => {
  const n = parseInt(hex.replace('#', '').replace(/^(.)(.)(.)$/, '$1$1$2$2$3$3'), 16);
  return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
};

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });
let made = 0;
for (const slug of slugs) {
  const c = JSON.parse(readFileSync(path.join(CAFES, slug, 'config.json'), 'utf8'));
  const a = c.brand.background ?? '#222222';
  const b = c.brand.primary;
  const alt = c.brand.accent ?? c.brand.primary;
  let seed = 1;
  for (const [rel, w, h, label] of jobsFor(c)) {
    seed++;
    const out = path.join(CAFES, slug, rel);
    if (existsSync(out) && !force) continue;
    mkdirSync(path.dirname(out), { recursive: true });
    const [c1, c2] = label === 'Hero photo' ? [alt, b] : seed % 3 === 0 ? [b, alt] : seed % 3 === 1 ? [a, b] : [alt, a];
    const ink = lum(c1) + lum(c2) > 1.1 ? '#1a1a1a' : '#ffffff';
    await page.setViewportSize({ width: w, height: h });
    await page.setContent(html({ w, h, a: c1, b: c2, ink, label, sub: `${c.name} · placeholder`, seed }));
    await page.screenshot({ path: out, type: out.endsWith('.png') ? 'png' : 'jpeg', quality: out.endsWith('.png') ? undefined : 82 });
    made++;
    console.log(`  + cafes/${slug}/${rel} (${w}×${h})`);
  }
}
await browser.close();
console.log(`✓ ${made} placeholder image${made === 1 ? '' : 's'} generated${made ? '' : ' (all images already exist; use --force to regenerate)'}`);

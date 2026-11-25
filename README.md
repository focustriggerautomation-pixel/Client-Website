# Cafe demo sites

Static, no-backend pitch demos for cafes and restaurants. Each prospect gets
their own private link (`/<slug>`) with their branding, photos and content.
All per-cafe content lives in **one config file**, so you never touch code.

Vite + React + TypeScript + Tailwind CSS v4 → fully static `dist/` → Vercel.

## Add a new cafe (~10 minutes)

```bash
npm run new-cafe -- blue-tokai            # copies an existing cafe as a starting point
# edit cafes/blue-tokai/config.json
# drop their photos into cafes/blue-tokai/images/ (or `npm run placeholders` for stand-ins)
npm run validate                          # lists every missing / invalid field
npm run dev                               # http://localhost:5173/blue-tokai
```

Commit and push: Vercel rebuilds and the demo is live at `https://<your-domain>/blue-tokai`.

Tip: append `?mood=warm-restaurant` (or `dark-premium`, `bright-cafe`) to any demo URL
to preview the same content in another mood.

## Folder structure

```
cafes/
  <slug>/
    config.json          ← everything about this cafe (validated by zod)
    images/              ← served at /<slug>/images/…
src/
  config/schema.ts       ← the config schema + types (single source of truth)
  config/registry.ts     ← finds cafes, lazy-loads one config per page
  theme/moods.ts         ← the three mood token sets
  theme/buildTheme.ts    ← mood + brand colours → CSS variables
  components/<section>/  ← one variant per mood, picked by the active mood:
                            hero, about, menu, signature, gallery, reviews,
                            visit (hours + map), contact (CTA band), footer
  components/header/     ← sticky header + mobile menu (shared, mood-styled)
  lib/                   ← shared data logic: hours / open-now, prices, signature items
  motion/                ← animation layer: MotionProvider (Lenis, reduced motion, intro),
                            MotionLayer (reveals, parallax, tilt, magnets, header), GalleryStage, Lightbox
  pages/                 ← cafe page, private index, 404, config-error page
scripts/
  validate.ts            ← `npm run validate`
  postbuild.ts           ← per-slug index.html with title / OG / Twitter tags
  new-cafe.ts            ← `npm run new-cafe -- <slug>`
tests/                   ← `npm test` (open-now cases) + browser QA scripts
  make-placeholders.mjs  ← `npm run placeholders` (gradient stand-in images)
public/robots.txt        ← disallow all
vercel.json
```

## Config reference

See `src/config/schema.ts` for every field with comments, and the two samples
in `cafes/` for complete examples. Notes:

- **Image paths** are relative to the cafe folder: `"images/hero.jpg"`. The build fails if a file is missing.
- **brand**: `primary` required; `accent`, `background` fall back to the mood's palette; no `logo` → styled text logo.
- **fonts** (optional): `{ "display": { "family": "Playfair Display", "weights": [400, 700], "italic": true } }`. Any Google Font; the weights must exist for that family.
- **menu prices**: a number gets `menu.currency` (default `₹`) prepended; a string is shown as-is.
- **menu tags**: items tagged `Bestseller` or `Signature` also appear in the Signature section (hidden if none).
  `Veg` / `Non-veg` / `Vegan` show the Indian veg/non-veg mark.
- **reviews**: optional. Only real reviews, copied verbatim with author and source. Never invent reviews. Omit the field if there are none.
- **hours**: all seven days (`mon`…`sun`), each `{ "open": "08:00", "close": "22:00" }`, a list of those for
  split days (lunch + dinner), or `"closed"`. `"23:59"` reads as midnight; a close time earlier than the open time
  runs past midnight.
- **timezone** (optional, default `"Asia/Kolkata"`): IANA name like `"Asia/Dubai"` or `"Europe/London"`.
  "Open now / Closed" and today's highlighted row use the cafe's zone, not the visitor's.
- **headings** (optional): override any section's kicker and/or title, e.g.
  `"headings": { "menu": { "kicker": "Carta", "title": "Tonight’s menu" } }`. Sections: `about`, `menu`,
  `signatures`, `gallery`, `reviews`, `visit`, `contact`. Anything omitted keeps the mood's default copy
  (`about.title` and `cta.headline` remain the defaults for those two).
- **contact.mapsEmbedUrl**: Google Maps → Share → Embed a map → copy the iframe `src`.
- **cta.action**: `whatsapp` (uses `contact.whatsapp` + optional `cta.message`), `call`, or `maps`.
  Optional `cta.headline` sets the contact band's headline; `cta.labels.{call,whatsapp,maps}` rename the
  secondary buttons (defaults depend on the mood, e.g. warm-restaurant says "Call to reserve" / "Order on WhatsApp").
- **hero image** doubles as the link-preview image: use JPG/PNG under ~600 KB (WhatsApp skips bigger images and can't show SVG).

## Motion

GSAP + ScrollTrigger + Lenis, in `src/motion/`. Sections stay plain markup and opt in with `data-*` attributes
(documented at the top of `src/motion/MotionLayer.tsx`). Each mood's motion profile lives with its tokens in
`src/theme/moods.ts` (`motion.gsap`): dark-premium is slow and cinematic (3D fly-through gallery, heavy scroll),
bright-cafe bouncy (overshoot eases, springy magnets, tilting strip), warm-restaurant soft and calm. `?mood=`
swaps motion too.

- Hidden start states are set by JS only — no CSS hides content, and if the motion layer throws it reverts itself.
- `prefers-reduced-motion`: no intro, parallax, pinning, tilt, magnets or smooth scroll; simple fades only.
- Debug: `?motion=reduced` forces reduced motion, `?motion=off` disables the motion layer (static page).
- Performance notes (measured on an emulated phone at 4× CPU throttle): scroll reveals run as compositor CSS
  transitions triggered by an IntersectionObserver; Lenis is used for mouse/trackpad only (phones keep native
  momentum scrolling); headings are split in idle time, never inside a scroll event.

## QA scripts

`npm test` (open-now logic) needs nothing extra. The browser checks in `tests/browser/` need Playwright
(`npm i -D playwright && npx playwright install chromium`) and a running `npm run preview`:
`layout.cjs` (overflow, images, every section visible after scrolling), `interaction.cjs`, `reduced-motion.cjs`,
`contrast.cjs`, and `perf.cjs <slug> mobile` (frame timing under 4× CPU throttle).

## Images

Put originals in `cafes/<slug>/images/` (JPG/PNG/WebP, ideally ≤ 2000px wide). The build reads each image's
size (for `width`/`height`) and generates WebP variants at 480/800/1200/1600px for `srcset`; the dev server
renders the same variants on the fly. All below-the-fold images are lazy-loaded.

## Link previews (WhatsApp / Instagram)

`npm run build` writes a real `dist/<slug>/index.html` per cafe with that cafe's
`<title>`, description, Open Graph and Twitter tags. `og:image` needs an absolute
URL: on Vercel the production domain is used automatically; for a custom domain
set the env var `SITE_URL=https://demos.yourstudio.com` in the Vercel project.

## Keeping demos out of Google

These are pitch demos, not the businesses' real sites:

- every page has `<meta name="robots" content="noindex, nofollow, noarchive">`
- every response has an `X-Robots-Tag: noindex, nofollow, noarchive` header (vercel.json)
- `robots.txt` disallows all crawlers; only link-preview bots (WhatsApp, Facebook/Instagram,
  X, Slack, LinkedIn, Telegram, Discord) may fetch pages so shared links show a preview
- the build refuses to run if the noindex meta or robots.txt is missing

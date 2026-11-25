# Technical reference

Vite + React 19 + TypeScript + Tailwind CSS v4, built to a fully static `dist/` and hosted on Vercel. No backend.
The plain-language guide is the [README](../README.md).

## Folder structure

```
cafes/
  <slug>/
    config.json            ← everything about this cafe (validated at build time with zod)
    images/                ← originals; the build publishes optimised copies at /<slug>/images/…
    .placeholders.json     ← stand-in photos written by new-cafe/placeholders (so `check` can flag them)
src/
  config/model.ts          ← constants, types-free helpers shared by browser and build (no zod)
  config/schema.ts         ← the zod schema + CafeConfig type (build/Node only; single source of truth)
  config/registry.ts       ← finds cafes, lazy-loads one validated config per page
  config/images.ts         ← responsive variant naming, <picture> sources
  theme/                   ← moods (token sets), brand colours → CSS variables, fonts
  components/<section>/    ← one variant per mood: hero, about, menu, signature, gallery, reviews,
                              visit (hours + map), contact (CTA band), footer; header is shared
  hero3d/                  ← Hero3D slot + illustrated fallbacks (main bundle), scene/ (lazy 3D chunk)
  motion/                  ← MotionProvider (Lenis, reduced motion, intro), MotionLayer (reveals, parallax,
                              tilt, magnets, header), GalleryStage, Lightbox, Intro
  pages/                   ← CafePage (data) + CafeView (markup, also prerendered), IndexPage (QR codes),
                              PhonePreview (?preview=mobile), 404, config-error page
  prerender.tsx            ← build-time render of a cafe's first screen
scripts/
  new-cafe.ts              ← `npm run new-cafe` (interactive; flags: --name= --mood= … --yes)
  check.ts                 ← `npm run check` (errors / warnings / notes; --strict)
  validate.ts              ← schema-only check, first step of `npm run build`
  placeholders.ts          ← `npm run placeholders`
  postbuild.ts             ← per-slug HTML (prerender, OG tags, favicons, preload) + image pipeline
  lib/                     ← cafes loader, image encoding + cache, favicon monograms, CSS intro, template copy
tests/                     ← `npm test` (open-now cases) + browser QA scripts
public/robots.txt          ← disallow all except link-preview bots
vercel.json                ← build settings, rewrites, X-Robots-Tag + cache headers
```

## Config reference

`src/config/schema.ts` documents every field; the samples in `cafes/` are complete examples.

- **Image paths** are relative to the cafe folder: `"images/hero.jpg"`. The build fails if a file is missing.
- **brand**: `primary` is required; `accent` and `background` fall back to the mood's palette. Without `logo`, a styled
  text logo is used. A square-ish logo (aspect ≤ 1.3) also becomes the favicon; otherwise the favicon is a monogram of
  the cafe's initials in the brand colours.
- **fonts** (optional): `{ "display": { "family": "Playfair Display", "weights": [400, 700], "italic": true } }`.
  Any Google Font; the weights must exist for that family.
- **menu prices**: a number gets `menu.currency` (default `₹`) prepended; a string is shown as-is.
- **menu tags**: items tagged `Bestseller` or `Signature` also appear in the Signature section (hidden if none).
  `Veg` / `Non-veg` / `Vegan` show the Indian veg/non-veg mark.
- **reviews**: optional. Only real reviews, copied verbatim with author and source. Never invent reviews. Omit the
  field if there are none.
- **hours**: all seven days (`mon`…`sun`), each `{ "open": "08:00", "close": "22:00" }`, a list of those for split
  days, or `"closed"`. `"23:59"` reads as midnight; a close time earlier than the open time runs past midnight.
- **timezone** (default `"Asia/Kolkata"`): IANA name. "Open now" and today's row use the cafe's zone.
- **hero3d** (default `true`): real-time 3D object in the hero; `false` removes it.
- **headings**: override any section's kicker and/or title, e.g.
  `"headings": { "menu": { "kicker": "Carta", "title": "Tonight’s menu" } }`. Sections: `about`, `menu`,
  `signatures`, `gallery`, `reviews`, `visit`, `contact`.
- **contact.mapsEmbedUrl**: Google Maps → Share → Embed a map → copy the iframe `src`. (`new-cafe` writes an
  address-search embed, which also works.)
- **cta.action**: `whatsapp` (uses `contact.whatsapp` + optional `cta.message`), `call`, or `maps`. Optional
  `cta.headline` and `cta.labels.{call,whatsapp,maps}`.

## Images

Drop originals of any size into `cafes/<slug>/images/` (JPG/PNG/WebP/AVIF; SVG and GIF are copied as-is). At build
time `scripts/postbuild.ts`:

- writes an optimised fallback at the original path (EXIF-rotated, ≤ 2000 px wide, mozjpeg/palette PNG);
- writes AVIF + WebP variants at 480/800/1200/1600 px and full width to `images/_r/`;
- caches every encode by content hash in `node_modules/.cache/cafe-images` (a rebuild with unchanged photos
  takes well under a second locally; on Vercel it lasts as long as the build cache does).

`<Img>` renders `<picture>` with AVIF/WebP `srcset`s and intrinsic `width`/`height`; everything below the first
screen is lazy-loaded. The dev server serves the same variants on the fly.

## First load

The page is meant to be readable before any JavaScript runs:

1. **Prerender.** `src/prerender.tsx` renders the cafe's header and hero to HTML at build time (React `prerender`);
   sections below the hero are left for the browser (`Deferred` in `CafeView`, marked with a `client-only`
   digest). Theme colours, a non-blocking font stylesheet and an AVIF preload for the hero photo are inlined in
   `<head>`.
2. **CSS intro.** An inline script decides, before first paint, whether the first-visit intro plays (not for repeat
   visits in the session, deep links, reduced motion or `?motion=off|reduced`). If it does, it adds
   `html.shell-intro` and the splash → hero entrance runs as pure CSS from the first frame
   (`scripts/lib/shellIntro.ts`, per mood, transform/opacity only). Every animation ends in the visible state, and the
   splash is only shown when that script ran, so no JavaScript means no intro, not a hidden page.
3. **Hydration.** When the intro has finished (~1.7–1.9 s) the app hydrates the prerendered DOM (`hydrateRoot`),
   keeping the same elements, and renders the rest of the page. The GSAP hero entrance is skipped because the hero is
   already visible. Then the 3D object loads (see below).

Output that depends on the visitor (open-now status, the 3D device check) renders a neutral version until hydration
is complete (`useHydrated`), so server and client markup match.

`?mood=` and desktop `?preview=mobile` skip the prerender (it is built for the cafe's own mood) and render live.

## Motion

GSAP + ScrollTrigger + Lenis, in `src/motion/`. Sections opt in with `data-*` attributes (documented at the top of
`MotionLayer.tsx`). Each mood's motion profile lives with its tokens in `src/theme/moods.ts` (`motion.gsap`):
dark-premium is slow and cinematic, bright-cafe bouncy, warm-restaurant soft. `?mood=` swaps motion too.

- Hidden start states are set by JavaScript only; if the motion layer throws it reverts itself.
- `prefers-reduced-motion`: no intro, parallax, pinning, tilt, magnets or smooth scroll.
- Debug: `?motion=reduced`, `?motion=off`.
- Scroll reveals run as compositor CSS transitions triggered by an IntersectionObserver. Lenis runs for
  mouse/trackpad only; phones keep native scrolling.

## Hero 3D

Three.js via @react-three/fiber + drei, in `src/hero3d/`. Models are procedural (no model or HDR files) and coloured
from the brand. The 3D code is a separate lazy chunk; the hero first shows an illustrated, CSS-animated version.

- Loads only after the intro and hydration, in idle time, while the hero is on screen.
- Falls back to the illustration on: reduced motion, Save-Data, < 4 CPU cores, < 4 GB memory, no WebGL, software
  WebGL (SwiftShader/llvmpipe), context loss, any error, or < 30 fps over its first second (rendered invisibly).
- Renders from GSAP's ticker; pauses off-screen and in hidden tabs; DPR capped at 1.5 on touch screens.
- Debug: `?hero3d=fallback`, `?hero3d=3d`. The stage reports `data-hero3d` (`3d`, `loading`, `fallback:<reason>`).

## Pitch helpers

- `/` lists every demo with a QR code (uqr, lazy-loaded, never part of a cafe page), open / phone preview / copy link.
- `/<slug>?preview=mobile` on screens ≥ 760 px: the live site in a 390×844 phone frame with a status bar in the site's
  colour, a replay-intro button (`R`) and a QR code. On narrow screens it is the normal site.

## Link previews (WhatsApp / Instagram)

Each `dist/<slug>/index.html` has the cafe's `<title>`, description, Open Graph and Twitter tags. `og:image` is the
optimised hero photo with a content hash. It needs an absolute URL: on Vercel the deployment/production URL is used
automatically; for a custom domain set `SITE_URL=https://demos.yourstudio.com` in the Vercel project.

## Keeping demos out of Google

- every page has `<meta name="robots" content="noindex, nofollow, noarchive">`;
- every response has `X-Robots-Tag: noindex, nofollow, noarchive` (vercel.json);
- `robots.txt` disallows all crawlers except link-preview bots (WhatsApp, Facebook/Instagram, X, Slack, LinkedIn,
  Telegram, Discord);
- the build refuses to run if the noindex meta or robots.txt is missing.

## QA

`npm test` (open-now logic) needs nothing extra. Browser checks in `tests/browser/` need Playwright and a running
`npm run preview`; pass the base URL first (and an output folder second where screenshots are written):
`layout.cjs` (overflow, images, every section visible), `interaction.cjs`, `reduced-motion.cjs`, `contrast.cjs`,
`hero3d.cjs`, `perf.cjs <slug> mobile` (frame timing under 4× CPU throttle).

Lighthouse (mobile, simulated throttling) on the three samples, local production build: Performance 97–100,
Accessibility 100, LCP 0.9–2.3 s, CLS ≤ 0.012.

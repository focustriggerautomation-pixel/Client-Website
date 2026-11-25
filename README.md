# Cafe demo sites

Pitch demos for cafes and restaurants. Each business gets its own private link, like
`your-site.vercel.app/blue-door-cafe`, showing a polished website with their name, colours, menu and photos.

Everything about one cafe lives in **one folder**: a settings file (`config.json`) and its photos. You never
need to touch the code.

> **Before you start (once):** install [Node.js 22](https://nodejs.org), then in this folder run `npm install`.

---

## Add a new cafe in 10 minutes

**1. Create it (1 minute).** In a terminal in this folder:

```bash
npm run new-cafe
```

It asks a few questions: the cafe's name, its link name, a mood (see below), brand colours, phone and
WhatsApp numbers, address and Instagram handle. Press Enter to accept a suggestion. It then creates the folder
`cafes/<link-name>/` with everything filled in, including stand-in photos, so the demo works straight away.

**2. Add their photos (5 minutes).** Put the cafe's photos into `cafes/<link-name>/images/`, using the
file names it printed (`hero.jpg`, `about-1.jpg`, `menu-1.jpg`, `gallery-1.jpg` … `gallery-6.jpg`), replacing the
stand-ins.

- Photos straight from a phone or saved from Instagram are fine. They are resized and compressed automatically
  when the site is built; you don't need to shrink anything.
- Use **.jpg**, **.png** or **.webp**. iPhone **HEIC** photos don't work in browsers: export them as JPG first
  (or set iPhone → Settings → Camera → Formats → *Most Compatible*).
- `hero.jpg` is the big first photo and the picture shown when you share the link on WhatsApp. Pick their
  best wide shot: storefront, interior or signature dish.
- Optional: add their logo as `logo.png` or `logo.svg` and add `"logo": "images/logo.png"` under `"brand"` in
  the settings file. Without one, the name is shown in a styled font and the browser-tab icon uses their
  initials.

**3. Fill in their details (4 minutes).** Open `cafes/<link-name>/config.json` in any text editor and replace
the template text with theirs: tagline, headline, story, menu items and prices, and opening hours. Copy their real
hours from their Google Maps listing.

**4. Check it.**

```bash
npm run check
```

This lists anything that is broken (must fix) or still generic (fix before pitching): missing photos,
stand-in photos still in place, template text, placeholder phone numbers, photos too small to look sharp,
files too big, or a typo in the settings file. Then look at it:

```bash
npm run dev
```

and open the link it shows (for example `http://localhost:5173/blue-door-cafe`).

**5. Put it online:** see [Deploying](#deploying) below.

---

## Changing the look

### Mood

`"mood"` in `config.json` sets the whole personality of the site: layout, fonts, animation style and 3D object.

| Mood | Feels like | Good for |
|---|---|---|
| `dark-premium` | moody, elegant, slow cinematic motion | specialty coffee bars, cocktail cafes, late-night spots |
| `bright-cafe` | playful, sunny, bouncy motion | bakeries, brunch places, dessert and bubble-tea shops |
| `warm-restaurant` | homely, traditional, calm motion | family restaurants, regional kitchens, thali places |

**Try a different mood without changing anything:** add `?mood=` to the link, for example
`/blue-door-cafe?mood=dark-premium`. This is handy for showing a client two options on a call.

### Colours

Under `"brand"` in `config.json`:

```json
"brand": { "primary": "#1F6FEB", "accent": "#F6C445", "background": "#FFF7E8" }
```

- `primary` is their main brand colour (buttons, highlights). Take it from their logo or signage. Any colour
  picker works, including the one built into most screenshot tools.
- `accent` is a second colour. `background` is the page colour. You can delete either line to use the mood's
  own palette.
- Text colours adjust automatically so everything stays readable.

### Other options

| In `config.json` | What it does |
|---|---|
| `"hero3d": false` | turns off the 3D object at the top (a drawn version shows instead) |
| `"reviews": [...]` | adds a reviews section. **Only real reviews, copied word for word**, with name and source. Never make reviews up. Leave the field out if they have none. |
| `"headings": { "menu": { "title": "Tonight's menu" } }` | renames a section heading |
| `"cta": { "text": "Book a table", "action": "call" }` | the main button: `whatsapp`, `call` or `maps` |
| `"timezone": "Asia/Dubai"` | for cafes outside India, so "Open now" is correct |

Every option is described in [docs/TECHNICAL.md](docs/TECHNICAL.md#config-reference).

---

## Pitching

- **Private index:** the home page of the site (`/`) lists every demo with a **QR code**. Show it on a call,
  or print it for a walk-in pitch: they scan it and the demo opens on their own phone.
- **Phone preview:** add `?preview=mobile` to a demo link on your laptop
  (`/blue-door-cafe?preview=mobile`) to show the site inside a phone frame while screen-sharing. Press **R**
  to replay the opening animation. On a phone the link just opens the normal site.
- **Sharing on WhatsApp:** the link shows a preview card with their name and hero photo.
- The opening animation plays once per visit. To see it again, open the link in a new tab.

## Deploying

The site is hosted on **Vercel**, connected to this GitHub repository.

- **To publish:** commit your changes and push to the main branch. Vercel rebuilds automatically and the new
  or updated demo is live in about a minute, at `https://<your-vercel-domain>/<link-name>`.
- **To try something first:** push to any other branch. Vercel builds a separate preview link and the live
  demos are not affected.
- **Before pushing,** run `npm run check`. If it shows errors (✖), the build would fail, so fix them first.
- Using your own domain? In Vercel → Project → Settings → Environment Variables, set
  `SITE_URL=https://demos.yourdomain.com` so link previews use it.

First-time setup on a new Vercel account: *Add New → Project → Import* this GitHub repository. The settings are
read from `vercel.json`, so nothing needs changing. Then make sure *Settings → Deployment Protection* is
**off**, otherwise clients get a Vercel login page and WhatsApp can't show link previews.

## Privacy: demos stay out of Google

These are pitch demos, not the businesses' real websites. Every page tells search engines not to list
it, the site blocks crawlers, and only link-preview bots (WhatsApp, Instagram, etc.) may read it. People only
find a demo if you send them the link.

## ⚠ When a client signs

Demos are often built with photos taken from the business's Instagram or Google listing. **Once a client
signs, replace every photo with files they send you (or that you shoot)** and get written permission
for anything you keep. Also replace any copy you wrote for them with text they approve. Run `npm run check`
afterwards: it should show no warnings.

---

## Command cheat sheet

| Command | What it does |
|---|---|
| `npm run new-cafe` | create a new cafe (asks questions) |
| `npm run check` | check every cafe before deploying (`npm run check -- blue-door-cafe` for one) |
| `npm run dev` | preview on your computer, updates as you edit |
| `npm run placeholders` | draw stand-in photos for any image listed in a config that doesn't exist yet |
| `npm run build` | build the whole site (Vercel does this for you) |

Developer documentation (structure, animation, 3D, performance, tests) is in
[docs/TECHNICAL.md](docs/TECHNICAL.md).

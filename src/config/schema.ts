import { z } from 'zod';

/**
 * Cafe config schema — the single source of truth for every per-cafe field.
 * Used at runtime (browser) and at build time (scripts/), so keep it free of
 * DOM / Node APIs.
 */

export const MOODS = ['dark-premium', 'bright-cafe', 'warm-restaurant'] as const;
export type Mood = (typeof MOODS)[number];

export const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
export type Day = (typeof DAYS)[number];

/** Folder names under /cafes that can never be slugs (they clash with build output). */
export const RESERVED_SLUGS = ['assets', 'images', 'fonts', 'api', 'index', '404'];

const nonEmpty = (what: string) => z.string({ error: `${what} is required` }).trim().min(1, `${what} must not be empty`);

const hex = (what: string) =>
  z
    .string({ error: `${what} is required (hex colour like "#1F3A2E")` })
    .regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, `${what} must be a hex colour like "#1F3A2E" or "#FA0"`);

/**
 * Image paths are relative to the cafe folder, e.g. "images/hero.jpg".
 * They are served at /<slug>/images/hero.jpg.
 */
export const imagePath = z
  .string({ error: 'image path is required, e.g. "images/hero.jpg"' })
  .regex(
    /^images\/[A-Za-z0-9._-]+\.(?:jpe?g|png|webp|avif|svg|gif)$/,
    'image must be a file inside this cafe\'s images/ folder, e.g. "images/hero.jpg" (jpg, png, webp, avif, svg or gif; no spaces)',
  );

const time = z
  .string({ error: 'time is required as "HH:MM" (24h)' })
  .regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, 'time must be "HH:MM" in 24h format, e.g. "08:30" or "23:00"');

const interval = z.strictObject({ open: time, close: time });
export type Interval = z.infer<typeof interval>;

/**
 * "closed", one interval, or several (e.g. lunch + dinner).
 * A close time earlier than the open time runs past midnight ("18:00"–"02:00").
 */
const dayHours = z.union([z.literal('closed'), interval, z.array(interval).min(1)], {
  error: 'each day must be { "open": "HH:MM", "close": "HH:MM" }, a list of those (e.g. lunch + dinner), or "closed"',
});
export type DayHours = z.infer<typeof dayHours>;

export const isValidTimeZone = (tz: string) => {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
};

/** Override a section's small kicker line and/or its title. Omitted parts use the mood's default copy. */
const heading = z.strictObject({
  kicker: z.string().trim().min(1, 'heading kicker must not be empty').optional(),
  title: z.string().trim().min(1, 'heading title must not be empty').optional(),
});
export const HEADING_SECTIONS = ['about', 'menu', 'signatures', 'gallery', 'reviews', 'visit', 'contact'] as const;
export type HeadingSection = (typeof HEADING_SECTIONS)[number];

const googleFont = z.strictObject({
  /** Google Fonts family name exactly as on fonts.google.com, e.g. "Playfair Display". */
  family: nonEmpty('fonts.*.family'),
  /** Weights to load. Every weight must exist for that family on Google Fonts. Default [400, 700]. */
  weights: z.array(z.number().int().min(100).max(900)).min(1).optional(),
  /** Also load italic styles. Default false. */
  italic: z.boolean().optional(),
});
export type GoogleFont = z.infer<typeof googleFont>;

const menuItem = z.strictObject({
  name: nonEmpty('menu item name'),
  description: z.string().trim().default(''),
  /** A number is shown with menu.currency (e.g. 320 -> "₹320"); a string is shown as-is (e.g. "₹320 / ₹420"). */
  price: z.union([z.number().nonnegative(), nonEmpty('price')], { error: 'price is required (number or text)' }),
  image: imagePath.optional(),
  /**
   * Short label, e.g. "Bestseller", "Signature", "Veg", "Non-veg", "Vegan", "New", "Spicy".
   * Items tagged "Bestseller" or "Signature" also appear in the Signature section.
   */
  tag: z.string().trim().min(1).max(24, 'tag should be a short label (max 24 characters)').optional(),
});

const review = z.strictObject({
  /** Must be a real review, copied verbatim. Never invent reviews. */
  text: nonEmpty('review text'),
  author: nonEmpty('review author'),
  /** Where the review came from, e.g. "Google", "Zomato", "TripAdvisor". */
  source: nonEmpty('review source'),
});

export const cafeConfigSchema = z.strictObject({
  slug: z
    .string({ error: 'slug is required' })
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug must be lowercase letters, numbers and single hyphens, e.g. "blue-tokai"')
    .refine((s) => !RESERVED_SLUGS.includes(s), { message: `slug cannot be one of: ${RESERVED_SLUGS.join(', ')}` }),
  name: nonEmpty('name'),
  tagline: nonEmpty('tagline'),
  mood: z.enum(MOODS, { error: `mood must be one of: ${MOODS.map((m) => `"${m}"`).join(', ')}` }),

  /** Optional SEO / link-preview overrides. Defaults: "<name> — <tagline>" and hero.subheadline. */
  seo: z
    .strictObject({
      title: z.string().trim().min(1).optional(),
      description: z.string().trim().min(1).optional(),
    })
    .optional(),

  brand: z.strictObject(
    {
      /** Main brand colour — buttons, highlights. */
      primary: hex('brand.primary'),
      /** Secondary highlight colour. Falls back to the mood's accent. */
      accent: hex('brand.accent').optional(),
      /** Page background. Falls back to the mood's background. */
      background: hex('brand.background').optional(),
      /** Logo image. If omitted, a styled text logo is rendered from `name`. */
      logo: imagePath.optional(),
    },
    { error: 'brand is required: { "primary": "#hex", "accent"?: "#hex", "background"?: "#hex", "logo"?: "images/logo.svg" }' },
  ),

  /** Override the mood's default font pair. Either or both. */
  fonts: z
    .strictObject({
      display: googleFont.optional(),
      body: googleFont.optional(),
    })
    .optional(),

  /**
   * Real-time 3D object in the hero (cup / iced latte / plate, by mood), coloured from the brand.
   * Weak devices automatically get an animated illustration of the same object instead. Default true.
   */
  hero3d: z.boolean({ error: 'hero3d must be true or false' }).default(true),

  hero: z.strictObject(
    {
      headline: nonEmpty('hero.headline'),
      subheadline: nonEmpty('hero.subheadline'),
      heroImage: imagePath,
    },
    { error: 'hero is required: { "headline", "subheadline", "heroImage" }' },
  ),

  about: z.strictObject(
    {
      title: nonEmpty('about.title'),
      /** One paragraph (string) or several (array of strings). */
      story: z.union([nonEmpty('about.story'), z.array(nonEmpty('about.story paragraph')).min(1)], {
        error: 'about.story is required (a string or an array of paragraphs)',
      }),
      images: z.array(imagePath).min(2, 'about.images needs 2–3 images').max(3, 'about.images needs 2–3 images'),
    },
    { error: 'about is required: { "title", "story", "images" }' },
  ),

  menu: z.strictObject(
    {
      /** Prefix for numeric prices. Default "₹". */
      currency: z.string().default('₹'),
      categories: z
        .array(
          z.strictObject({
            name: nonEmpty('menu category name'),
            description: z.string().trim().optional(),
            items: z.array(menuItem).min(1, 'each menu category needs at least one item'),
          }),
        )
        .min(1, 'menu needs at least one category'),
    },
    { error: 'menu is required: { "categories": [...] }' },
  ),

  gallery: z.array(imagePath, { error: 'gallery is required (array of image paths)' }).min(1, 'gallery needs at least one image'),

  /** Only real reviews, copied verbatim with author and source. Omit entirely if you have none. */
  reviews: z.array(review).min(1, 'omit "reviews" entirely instead of leaving it empty').optional(),

  /**
   * IANA time zone of the cafe, e.g. "Asia/Kolkata", "Asia/Dubai", "Europe/London".
   * "Open now" and today's row in the hours table are computed in this zone. Default "Asia/Kolkata".
   */
  timezone: z
    .string()
    .trim()
    .refine(isValidTimeZone, { message: 'timezone must be an IANA time zone name like "Asia/Kolkata" or "Europe/London"' })
    .default('Asia/Kolkata'),

  /**
   * Optional per-section heading overrides: { "menu": { "kicker": "Carta", "title": "Tonight's menu" } }.
   * about.title defaults to about.title; contact.title defaults to cta.headline.
   */
  headings: z
    .strictObject(Object.fromEntries(HEADING_SECTIONS.map((k) => [k, heading.optional()])) as Record<HeadingSection, z.ZodOptional<typeof heading>>)
    .optional(),

  hours: z.strictObject(
    Object.fromEntries(DAYS.map((d) => [d, dayHours])) as Record<Day, typeof dayHours>,
    { error: `hours is required with all seven days: ${DAYS.join(', ')}` },
  ),

  contact: z.strictObject(
    {
      address: nonEmpty('contact.address'),
      /** The src="" of Google Maps' "Share → Embed a map" iframe. */
      mapsEmbedUrl: z
        .string({ error: 'contact.mapsEmbedUrl is required' })
        .regex(/^https:\/\/(?:www\.)?google\.[a-z.]+\/maps/, 'contact.mapsEmbedUrl must be a Google Maps embed URL (https://www.google.com/maps/embed?pb=...)'),
      /** As dialled, with country code, e.g. "+91 98765 43210". */
      phone: z.string({ error: 'contact.phone is required' }).regex(/^\+?[0-9 ()-]{6,20}$/, 'contact.phone must be a phone number like "+91 98765 43210"'),
      /** International format, digits only or with +/spaces, e.g. "+91 98765 43210". */
      whatsapp: z
        .string({ error: 'contact.whatsapp is required' })
        .regex(/^\+?[0-9 ()-]{8,20}$/, 'contact.whatsapp must be a number with country code, e.g. "+91 98765 43210"'),
      /** Handle without the @, e.g. "bluetokaicoffee". */
      instagram: z
        .string({ error: 'contact.instagram is required' })
        .transform((s) => s.trim().replace(/^@/, ''))
        .pipe(z.string().regex(/^[A-Za-z0-9._]{1,30}$/, 'contact.instagram must be a handle like "bluetokaicoffee" (no URL)')),
    },
    { error: 'contact is required: { "address", "mapsEmbedUrl", "phone", "whatsapp", "instagram" }' },
  ),

  cta: z.strictObject(
    {
      text: nonEmpty('cta.text'),
      action: z.enum(['whatsapp', 'call', 'maps'], { error: 'cta.action must be "whatsapp", "call" or "maps"' }),
      /** Pre-filled WhatsApp message (used by every WhatsApp button on the page). */
      message: z.string().trim().optional(),
      /** Headline of the contact band near the bottom of the page. Defaults to a mood-specific line with the cafe name. */
      headline: z.string().trim().min(1).optional(),
      /** Labels for the secondary contact buttons. Defaults depend on the mood (e.g. "Call to reserve"). */
      labels: z
        .strictObject({
          call: z.string().trim().min(1).optional(),
          whatsapp: z.string().trim().min(1).optional(),
          maps: z.string().trim().min(1).optional(),
        })
        .optional(),
    },
    { error: 'cta is required: { "text", "action": "whatsapp" | "call" | "maps" }' },
  ),

  /** Small "Concept by …" ribbon. */
  agencyCredit: z.strictObject({ name: nonEmpty('agencyCredit.name'), url: z.url('agencyCredit.url must be a full URL') }).optional(),
});

/** Shape as written in config.json (before defaults/transforms). */
export type CafeConfigInput = z.input<typeof cafeConfigSchema>;
/** Shape after validation (defaults applied). */
export type CafeConfig = z.output<typeof cafeConfigSchema>;

export class CafeConfigError extends Error {
  constructor(
    public readonly source: string,
    public readonly problems: string[],
  ) {
    super(`Invalid cafe config ${source}:\n${problems.map((p) => `  • ${p}`).join('\n')}`);
    this.name = 'CafeConfigError';
  }
}

/** Turn zod issues into one human-readable line each: `brand.primary: must be a hex colour …` */
export function formatIssues(issues: readonly z.core.$ZodIssue[]): string[] {
  return issues.map((issue) => {
    const path = issue.path.length ? issue.path.map((p) => (typeof p === 'number' ? `[${p}]` : `.${String(p)}`)).join('').replace(/^\./, '') : '(root)';
    let msg = issue.message;
    if (issue.code === 'invalid_type' && /received undefined/.test(msg)) msg = 'is required but missing';
    if (issue.code === 'unrecognized_keys') msg = `unknown field(s) ${issue.keys.map((k) => `"${k}"`).join(', ')} — check spelling`;
    return `${path}: ${msg}`;
  });
}

/**
 * Validate raw JSON. `expectedSlug` is the folder name; the slug field must match it
 * so URLs and image paths always line up.
 */
export function parseCafeConfig(raw: unknown, source: string, expectedSlug?: string): CafeConfig {
  const result = cafeConfigSchema.safeParse(raw);
  if (!result.success) throw new CafeConfigError(source, formatIssues(result.error.issues));
  if (expectedSlug && result.data.slug !== expectedSlug) {
    throw new CafeConfigError(source, [`slug: "${result.data.slug}" must match its folder name "${expectedSlug}"`]);
  }
  return result.data;
}

/** All image paths a config references (for build-time existence checks). */
export function referencedImages(c: CafeConfig): string[] {
  const out = [c.hero.heroImage, ...c.about.images, ...c.gallery];
  if (c.brand.logo) out.push(c.brand.logo);
  for (const cat of c.menu.categories) for (const item of cat.items) if (item.image) out.push(item.image);
  return [...new Set(out)];
}

/** Normalise a day's hours to a list of intervals ([] = closed). */
export function dayIntervals(d: DayHours): Interval[] {
  if (d === 'closed') return [];
  return Array.isArray(d) ? d : [d];
}

export function storyParagraphs(c: CafeConfig): string[] {
  return Array.isArray(c.about.story) ? c.about.story : [c.about.story];
}

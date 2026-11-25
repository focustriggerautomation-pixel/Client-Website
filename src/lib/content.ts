import type { CafeConfig, Mood } from '../config/schema.ts';
import { mapsHref, telHref, whatsappHref } from './cta.ts';

export type MenuItem = CafeConfig['menu']['categories'][number]['items'][number];
export type MenuCategory = CafeConfig['menu']['categories'][number];
export type Action = 'whatsapp' | 'call' | 'maps';

export function formatPrice(price: MenuItem['price'], currency: string): string {
  return typeof price === 'number' ? `${currency}${price.toLocaleString('en-IN')}` : price;
}

const SIGNATURE_TAG = /^(?:bestseller|best seller|best-seller|signature|chef'?s special|house special)$/i;
export const isSignatureTag = (tag?: string) => !!tag && SIGNATURE_TAG.test(tag.trim());

/** Items tagged "Bestseller" / "Signature", in menu order. */
export function signatureItems(c: CafeConfig): { item: MenuItem; category: string }[] {
  return c.menu.categories.flatMap((cat) => cat.items.filter((i) => isSignatureTag(i.tag)).map((item) => ({ item, category: cat.name })));
}

/** Indian veg / non-veg marks get a dedicated symbol. */
export function dietOf(tag?: string): 'veg' | 'nonveg' | 'vegan' | null {
  const t = tag?.trim().toLowerCase();
  if (!t) return null;
  if (t === 'vegan') return 'vegan';
  if (/^(?:non[- ]?veg|non[- ]?vegetarian)$/.test(t)) return 'nonveg';
  if (/^(?:veg|vegetarian|pure veg)$/.test(t)) return 'veg';
  return null;
}

export const SECTION_IDS = {
  top: 'top',
  about: 'about',
  menu: 'menu',
  signatures: 'signatures',
  gallery: 'gallery',
  reviews: 'reviews',
  visit: 'visit',
  contact: 'contact',
} as const;

/** Sections actually rendered for this cafe, in page order (Signatures / Reviews are conditional). */
export function presentSections(c: CafeConfig): string[] {
  return [
    SECTION_IDS.about,
    SECTION_IDS.menu,
    ...(signatureItems(c).length ? [SECTION_IDS.signatures] : []),
    SECTION_IDS.gallery,
    ...(c.reviews ? [SECTION_IDS.reviews] : []),
    SECTION_IDS.visit,
  ];
}

/** "01", "02"… for editorial section numbering. */
export const sectionNumber = (c: CafeConfig, id: string) => String(presentSections(c).indexOf(id) + 1).padStart(2, '0');

export function navItems(c: CafeConfig): { id: string; label: string }[] {
  return [
    { id: SECTION_IDS.about, label: 'Story' },
    { id: SECTION_IDS.menu, label: 'Menu' },
    { id: SECTION_IDS.gallery, label: 'Gallery' },
    ...(c.reviews ? [{ id: SECTION_IDS.reviews, label: 'Reviews' }] : []),
    { id: SECTION_IDS.visit, label: 'Visit' },
  ];
}

const DEFAULT_LABELS: Record<Mood, Record<Action, string>> = {
  'dark-premium': { call: 'Call us', whatsapp: 'Message us', maps: 'Directions' },
  'bright-cafe': { call: 'Call us', whatsapp: 'WhatsApp us', maps: 'Find us' },
  'warm-restaurant': { call: 'Call to reserve', whatsapp: 'Order on WhatsApp', maps: 'Get directions' },
};

/** Label for a contact action: the main CTA keeps its own text, others use cta.labels or mood defaults. */
export function actionLabel(c: CafeConfig, mood: Mood, action: Action): string {
  return c.cta.labels?.[action] ?? DEFAULT_LABELS[mood][action];
}

export function actionHref(c: CafeConfig, action: Action): string {
  if (action === 'whatsapp') return whatsappHref(c.contact.whatsapp, c.cta.message);
  if (action === 'call') return telHref(c.contact.phone);
  return mapsHref(c.name, c.contact.address);
}

export const instagramUrl = (handle: string) => `https://www.instagram.com/${handle}/`;

/** The CTA action first, then the other two. */
export const actionsInOrder = (c: CafeConfig): Action[] => [c.cta.action, ...(['whatsapp', 'call', 'maps'] as const).filter((a) => a !== c.cta.action)];

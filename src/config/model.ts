/**
 * Zod-free runtime side of the config model: constants, the error type and small helpers.
 * The browser imports only this (configs are validated at build/dev time by schema.ts), so zod never ships.
 */
import type { CafeConfig, DayHours, Interval } from './schema.ts';

export const MOODS = ['dark-premium', 'bright-cafe', 'warm-restaurant'] as const;
export type Mood = (typeof MOODS)[number];

export const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
export type Day = (typeof DAYS)[number];

/** Folder names under /cafes that can never be slugs (they clash with build output). */
export const RESERVED_SLUGS = ['assets', 'images', 'fonts', 'api', 'index', '404', 'qr'];

export const HEADING_SECTIONS = ['about', 'menu', 'signatures', 'gallery', 'reviews', 'visit', 'contact'] as const;
export type HeadingSection = (typeof HEADING_SECTIONS)[number];

export class CafeConfigError extends Error {
  constructor(
    public readonly source: string,
    public readonly problems: string[],
  ) {
    super(`Invalid cafe config ${source}:\n${problems.map((p) => `  • ${p}`).join('\n')}`);
    this.name = 'CafeConfigError';
  }
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

/**
 * The starting point `npm run new-cafe` writes for a new cafe: readable, on-brand placeholder copy so the demo
 * looks finished straight away, plus the list of photos to collect. `npm run check` compares a config with these
 * values and lists everything that is still template text — so nothing generic slips into a pitch.
 */
import type { Mood } from '../../src/config/model.ts';

export const MOOD_INFO: Record<
  Mood,
  { label: string; feel: string; colors: { primary: string; accent: string; background: string } }
> = {
  'dark-premium': {
    label: 'Dark premium',
    feel: 'moody, elegant — specialty coffee bars, cocktail cafes, late-night spots',
    colors: { primary: '#C8A26B', accent: '#8C2F1B', background: '#0E0D0C' },
  },
  'bright-cafe': {
    label: 'Bright cafe',
    feel: 'playful, sunny — bakeries, brunch places, dessert and bubble-tea shops',
    colors: { primary: '#E8552D', accent: '#F6C445', background: '#FFF7E8' },
  },
  'warm-restaurant': {
    label: 'Warm restaurant',
    feel: 'homely, traditional — family restaurants, regional kitchens, thali places',
    colors: { primary: '#9E3B22', accent: '#C98B2E', background: '#F4EADB' },
  },
};

/** Template copy per mood. Every string here is reported by `npm run check` until it has been replaced. */
export function templateCopy(mood: Mood, name: string) {
  const byMood = {
    'dark-premium': {
      tagline: 'Specialty coffee, after dark',
      headline: 'Slow coffee for late evenings.',
      subheadline: `Small-batch espresso, careful pour-overs and a quiet corner at ${name}.`,
      aboutTitle: 'Made one cup at a time',
      story: [
        `${name} started with a simple idea: coffee worth slowing down for. (Replace this with the owner's own story — who started it, and why.)`,
        'Tell the reader what makes the place different: where the beans come from, the space, the people behind the counter.',
      ],
      menu: [
        {
          name: 'Coffee',
          items: [
            ['Espresso', 'Double shot, house blend.', 160, 'Signature'],
            ['Cappuccino', 'Silky milk, cocoa dust.', 220],
            ['Pour-over', 'Single origin, brewed to order.', 260, 'Bestseller'],
          ],
        },
        {
          name: 'Bites',
          items: [
            ['Almond croissant', 'Baked in-house every morning.', 180, 'Veg'],
            ['Grilled sandwich', 'Sourdough, cheese, pesto.', 290, 'Veg'],
            ['Dark chocolate tart', 'Sea salt, cream.', 240],
          ],
        },
      ],
      cta: 'Reserve a seat',
    },
    'bright-cafe': {
      tagline: 'Bakery & all-day brunch',
      headline: 'Fresh out of the oven, every morning.',
      subheadline: `Pastries, big brunch plates and good coffee, made from scratch at ${name}.`,
      aboutTitle: 'Baked before the city wakes up',
      story: [
        `${name} is a neighbourhood favourite for breakfast that runs all day. (Replace this with the owner's own story.)`,
        'Say what people come back for: the bestseller, the ovens starting at dawn, the corner table everyone wants.',
      ],
      menu: [
        {
          name: 'From the oven',
          items: [
            ['Butter croissant', 'Flaky, golden, still warm.', 160, 'Bestseller'],
            ['Cinnamon bun', 'Glazed, soft, generous.', 150, 'Veg'],
            ['Sourdough loaf', 'Whole loaf to take home.', 320],
          ],
        },
        {
          name: 'Brunch',
          items: [
            ['Pancake stack', 'Maple, berries, whipped butter.', 340, 'Signature'],
            ['Eggs on toast', 'Any style, sourdough, greens.', 290],
            ['Avocado toast', 'Chilli crunch, lime.', 360, 'Veg'],
          ],
        },
      ],
      cta: 'Order on WhatsApp',
    },
    'warm-restaurant': {
      tagline: 'Home-style family kitchen',
      headline: 'Home-style food, cooked the old way.',
      subheadline: `Slow-cooked recipes and generous plates — the kind of meal that brings families back to ${name}.`,
      aboutTitle: 'Recipes from home',
      story: [
        `${name} serves the food the family grew up with. (Replace this with the owner's own story — whose recipes, since when.)`,
        "Describe the kitchen: what's cooked fresh each morning, the dish regulars order every time, the welcome.",
      ],
      menu: [
        {
          name: 'Mains',
          items: [
            ['Chef’s special thali', 'A full meal, changes daily.', 320, 'Signature'],
            ['House curry', 'Slow-cooked, served with rice.', 280, 'Bestseller'],
            ['Vegetable stew', 'Coconut, seasonal vegetables.', 240, 'Veg'],
          ],
        },
        {
          name: 'Breakfast',
          items: [
            ['Crispy dosa', 'Chutneys and sambar.', 120, 'Veg'],
            ['Soft idli', 'Steamed, three pieces.', 90, 'Veg'],
            ['Filter coffee', 'Strong, frothy, in a tumbler.', 60],
          ],
        },
      ],
      cta: 'Call to book a table',
    },
  }[mood];
  return byMood;
}

export const DEFAULT_HOURS = Object.fromEntries(
  ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map((d) => [d, { open: '09:00', close: '22:00' }]),
) as Record<string, { open: string; close: string }>;

/** The photos a new cafe needs, with what to pick and the size to aim for. */
export const PHOTO_PLAN = [
  {
    file: 'hero.jpg',
    what: 'Hero — the best wide photo (storefront, interior or signature dish)',
    size: 'landscape, 2000+ px wide',
  },
  { file: 'about-1.jpg', what: 'About — the people or the space', size: 'portrait 4:5, 1200+ px wide' },
  {
    file: 'about-2.jpg',
    what: 'About — a detail shot (hands, counter, ingredients)',
    size: 'portrait 4:5, 1200+ px wide',
  },
  {
    file: 'menu-1.jpg',
    what: 'Signature dish #1 (matches the 1st "Signature"/"Bestseller" item)',
    size: 'landscape 4:3, 1200+ px wide',
  },
  { file: 'menu-2.jpg', what: 'Signature dish #2', size: 'landscape 4:3, 1200+ px wide' },
  ...[1, 2, 3, 4, 5, 6].map((n) => ({
    file: `gallery-${n}.jpg`,
    what: `Gallery photo ${n}`,
    size: 'any shape, 1200+ px on the long side',
  })),
] as const;

export const PLACEHOLDER_LIST = '.placeholders.json';

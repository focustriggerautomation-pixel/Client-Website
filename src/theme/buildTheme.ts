import type { CafeConfig, Mood } from '../config/schema.ts';
import { bestOn, contrast, isDark, mix, rgbTriplet } from './color.ts';
import { fontStack, googleFontsHref, withFontDefaults, type FontSpec } from './fonts.ts';
import { MOOD_TOKENS, type MoodTokens } from './moods.ts';

export interface Theme {
  mood: Mood;
  tokens: MoodTokens;
  colors: Record<'background' | 'surface' | 'ink' | 'muted' | 'line' | 'primary' | 'onPrimary' | 'accent' | 'onAccent', string>;
  fonts: { display: FontSpec; body: FontSpec; href: string };
  /** CSS custom properties to put on the cafe root element. */
  vars: Record<string, string>;
}

/** Fluid size: `minPx` at 360px viewport → `maxPx` at 1280px viewport. */
function fluid(minPx: number, maxPx: number): string {
  if (Math.abs(maxPx - minPx) < 0.5) return `${(maxPx / 16).toFixed(4)}rem`;
  const slope = (maxPx - minPx) / (1280 - 360);
  const interceptRem = (minPx - slope * 360) / 16;
  return `clamp(${(minPx / 16).toFixed(4)}rem, ${interceptRem.toFixed(4)}rem + ${(slope * 100).toFixed(4)}vw, ${(maxPx / 16).toFixed(4)}rem)`;
}

/**
 * Merge mood tokens with the cafe's brand. Brand colours win; everything the
 * brand doesn't specify (text, surfaces, lines) is derived so contrast holds.
 */
export function buildTheme(cafe: CafeConfig, moodOverride?: Mood): Theme {
  const mood = moodOverride ?? cafe.mood;
  const t = MOOD_TOKENS[mood];

  // ---- colours
  const background = cafe.brand.background ?? t.palette.background;
  const primary = cafe.brand.primary;
  const accent = cafe.brand.accent ?? t.palette.accent;
  const ink = contrast(t.palette.ink, background) >= 7 ? t.palette.ink : bestOn(background, t.palette.ink, isDark(background) ? '#F5F1EA' : '#16120E', '#FFFFFF', '#000000');
  const surface = mix(background, ink, isDark(background) ? 0.06 : 0.04);
  // Secondary text: as soft as possible while staying ≥ 4.6:1 on both background and surface (WCAG AA).
  let mutedT = 0.4;
  while (mutedT > 0 && Math.min(contrast(mix(ink, background, mutedT), background), contrast(mix(ink, background, mutedT), surface)) < 4.6) mutedT -= 0.02;
  const colors = {
    background,
    surface,
    ink,
    muted: mix(ink, background, Math.max(0, mutedT)),
    line: mix(background, ink, 0.16),
    primary,
    onPrimary: bestOn(primary, '#FFFFFF', '#111111', background, ink),
    accent,
    onAccent: bestOn(accent, '#FFFFFF', '#111111', background, ink),
  };

  // ---- fonts
  const display = withFontDefaults(cafe.fonts?.display ?? t.fonts.display);
  const body = withFontDefaults(cafe.fonts?.body ?? t.fonts.body);
  const custom = cafe.fonts?.display;
  const displayFallback = custom ? (custom.fallback ?? 'serif') : t.fonts.display.fallback;
  const bodyFallback = cafe.fonts?.body ? 'sans-serif' : t.fonts.body.fallback;

  // ---- type scale: step-(-1) … step-7
  const vars: Record<string, string> = {};
  for (let step = -1; step <= 7; step++) {
    const max = t.type.base * t.type.ratio ** step;
    // Small steps barely shrink on mobile; big display steps shrink by mobileShrink.
    const keep = step <= 1 ? 0.94 : 1 - (1 - t.type.mobileShrink) * Math.min(1, (step - 1) / 5);
    vars[`--step-${step < 0 ? `n${-step}` : step}`] = fluid(Math.max(12, max * keep), max);
  }

  Object.assign(vars, {
    '--c-bg': colors.background,
    '--c-surface': colors.surface,
    '--c-ink': colors.ink,
    '--c-muted': colors.muted,
    '--c-line': colors.line,
    '--c-primary': colors.primary,
    '--c-on-primary': colors.onPrimary,
    '--c-accent': colors.accent,
    '--c-on-accent': colors.onAccent,
    '--rgb-bg': rgbTriplet(colors.background),
    '--rgb-ink': rgbTriplet(colors.ink),
    '--rgb-primary': rgbTriplet(colors.primary),

    '--ff-display': fontStack(display.family, displayFallback),
    '--ff-body': fontStack(body.family, bodyFallback),
    '--display-weight': String(custom?.weight ?? t.type.displayWeight),
    '--display-tracking': custom?.tracking !== undefined ? `${custom.tracking}em` : t.type.displayTracking,
    '--display-leading': String(custom?.leading ?? t.type.displayLeading),
    '--display-transform': custom?.uppercase ? 'uppercase' : custom?.uppercase === false ? 'none' : t.type.displayTransform,
    '--display-style': t.type.displayItalic && display.italic ? 'italic' : 'normal',
    '--eyebrow-tracking': t.type.eyebrowTracking,
    '--body-leading': String(t.type.bodyLeading),

    '--space-unit': `${(0.25 * t.space.density).toFixed(4)}rem`,
    '--space-section': t.space.section,
    '--container': t.space.container,

    '--r-sm': t.radius.sm,
    '--r-md': t.radius.md,
    '--r-lg': t.radius.lg,
    '--r-button': t.radius.button,
    '--r-image': t.radius.image,

    '--motion-intensity': String(t.motion.intensity),
    '--motion-duration': `${t.motion.duration}ms`,
    '--motion-ease': t.motion.easing,
    '--motion-distance': `${Math.round(t.motion.distance * t.motion.intensity)}px`,
  });

  return { mood, tokens: t, colors, fonts: { display, body, href: googleFontsHref([display, body]) }, vars };
}

import type { Mood } from '../config/schema.ts';
import { isDark, mix } from '../theme/color.ts';
import type { Theme } from '../theme/buildTheme.ts';

/**
 * Every colour of the 3D object (and of its illustrated fallback) is derived from the cafe's brand colours,
 * so a new cafe gets a matching cup / glass / plate with no extra config. Pure: shared by both bundles.
 */
export interface Palette3D {
  mood: Mood;
  bg: string;
  ink: string;
  primary: string;
  accent: string;
  /** Ceramic body (cup, saucer, plate). */
  ceramic: string;
  ceramicShade: string;
  /** Metallic details: rim line, cutlery. */
  metal: string;
  /** Liquids / food. */
  coffee: string;
  crema: string;
  milk: string;
  food: string;
  garnish: string;
  bean: string;
  glaze: string;
  glass: string;
  ice: string;
  sprinkles: string[];
  steam: string;
  /** Opacity of the steam on this background. */
  steamAlpha: number;
}

export function palette3D(theme: Theme): Palette3D {
  const { background: bg, ink, primary, accent } = theme.colors;
  const darkBg = isDark(bg);
  const base = {
    mood: theme.mood,
    bg,
    ink,
    primary,
    accent,
    steam: darkBg ? mix(ink, '#ffffff', 0.4) : mix(ink, bg, 0.35),
    steamAlpha: darkBg ? 0.55 : 0.35,
    sprinkles: [primary, accent, mix(primary, accent, 0.5), darkBg ? ink : mix(bg, '#ffffff', 0.6)],
  };
  switch (theme.mood) {
    case 'dark-premium':
      return {
        ...base,
        ceramic: mix(ink, primary, 0.12),
        ceramicShade: mix(mix(ink, primary, 0.12), bg, 0.35),
        metal: primary,
        coffee: mix(accent, '#000000', 0.68),
        crema: mix(mix(primary, accent, 0.45), '#000000', 0.25),
        milk: mix(ink, primary, 0.3),
        food: mix(accent, primary, 0.4),
        garnish: primary,
        bean: mix(accent, '#000000', 0.5),
        glaze: mix(ink, primary, 0.12),
        glass: mix(ink, '#ffffff', 0.5),
        ice: '#ffffff',
      };
    case 'bright-cafe':
      return {
        ...base,
        ceramic: mix(bg, '#ffffff', 0.6),
        ceramicShade: mix(bg, ink, 0.12),
        metal: accent,
        coffee: mix(primary, ink, 0.55),
        crema: mix(primary, bg, 0.35),
        milk: mix(bg, accent, 0.12),
        food: mix(primary, accent, 0.4),
        garnish: accent,
        bean: mix(primary, ink, 0.6),
        glaze: primary,
        glass: mix(bg, '#ffffff', 0.7),
        ice: mix(bg, '#ffffff', 0.85),
      };
    case 'warm-restaurant':
      return {
        ...base,
        ceramic: mix(bg, '#ffffff', 0.55),
        ceramicShade: mix(bg, ink, 0.1),
        metal: accent,
        coffee: mix(primary, ink, 0.5),
        crema: mix(accent, bg, 0.3),
        milk: mix(bg, '#ffffff', 0.4),
        food: mix(accent, primary, 0.45),
        garnish: mix(accent, ink, 0.35),
        bean: mix(primary, ink, 0.55),
        glaze: primary,
        glass: mix(bg, '#ffffff', 0.6),
        ice: '#ffffff',
      };
  }
}

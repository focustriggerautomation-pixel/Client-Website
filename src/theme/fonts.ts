import type { GoogleFont } from '../config/schema.ts';

export type FontSpec = Required<GoogleFont>;

export const withFontDefaults = (f: GoogleFont): FontSpec => ({
  family: f.family,
  weights: f.weights ?? [400, 700],
  italic: f.italic ?? false,
});

/** Google Fonts css2 `family=` value, e.g. "Fraunces:ital,wght@0,400;0,600;1,400;1,600". */
function familyParam(f: FontSpec): string {
  const name = f.family.trim().replace(/\s+/g, '+');
  const weights = [...new Set(f.weights)].sort((a, b) => a - b);
  if (f.italic) {
    const tuples = [...weights.map((w) => `0,${w}`), ...weights.map((w) => `1,${w}`)];
    return `${name}:ital,wght@${tuples.join(';')}`;
  }
  return `${name}:wght@${weights.join(';')}`;
}

export function googleFontsHref(fonts: FontSpec[]): string {
  // Merge duplicates (same family used for display + body).
  const byFamily = new Map<string, FontSpec>();
  for (const f of fonts) {
    const prev = byFamily.get(f.family);
    byFamily.set(
      f.family,
      prev ? { family: f.family, weights: [...prev.weights, ...f.weights], italic: prev.italic || f.italic } : f,
    );
  }
  const params = [...byFamily.values()].map((f) => `family=${familyParam(f)}`).join('&');
  return `https://fonts.googleapis.com/css2?${params}&display=swap`;
}

/** CSS font-family stack with a sensible fallback. */
export const fontStack = (family: string, fallback: 'serif' | 'sans-serif') => `"${family}", ${fallback === 'serif' ? 'Georgia, "Times New Roman", serif' : 'system-ui, -apple-system, "Segoe UI", sans-serif'}`;

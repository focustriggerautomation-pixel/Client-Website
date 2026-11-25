import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

/**
 * Favicons from the cafe's logo (if it's roughly square) or a monogram of its initials. Letters are drawn as
 * stroked SVG paths on an 8×12 grid — no fonts involved, so the build machine renders them identically everywhere.
 */
const GLYPHS: Record<string, string> = {
  A: 'M0 12 L4 0 L8 12 M1.4 8 H6.6',
  B: 'M0 12 V0 H4.5 A3 3 0 0 1 4.5 6 H0 M4.5 6 H5 A3 3 0 0 1 5 12 H0',
  C: 'M8 2.2 A5.5 6 0 1 0 8 9.8',
  D: 'M0 0 V12 H3 A5 6 0 0 0 3 0 Z',
  E: 'M8 0 H0 V12 H8 M0 6 H6',
  F: 'M8 0 H0 V12 M0 6 H6',
  G: 'M8 2.2 A5.5 6 0 1 0 8 9.8 V7 H4.5',
  H: 'M0 0 V12 M8 0 V12 M0 6 H8',
  I: 'M4 0 V12 M1.5 0 H6.5 M1.5 12 H6.5',
  J: 'M7 0 V8.5 A3.5 3.5 0 0 1 0 8.5',
  K: 'M0 0 V12 M8 0 L0 7.5 M2.6 5.4 L8 12',
  L: 'M0 0 V12 H8',
  M: 'M0 12 V0 L4 7 L8 0 V12',
  N: 'M0 12 V0 L8 12 V0',
  O: 'M4 0 A4 6 0 1 0 4 12 A4 6 0 1 0 4 0 Z',
  P: 'M0 12 V0 H5 A3 3.25 0 0 1 5 6.5 H0',
  Q: 'M4 0 A4 6 0 1 0 4 12 A4 6 0 1 0 4 0 Z M5 9 L8 12.5',
  R: 'M0 12 V0 H5 A3 3.25 0 0 1 5 6.5 H0 M4.5 6.5 L8 12',
  S: 'M7.5 1.8 C6.5 0.4 1 -0.6 0.6 3 C0.3 6 7.6 5.6 7.6 9 C7.6 12.6 1.6 12.6 0.3 10.2',
  T: 'M0 0 H8 M4 0 V12',
  U: 'M0 0 V8 A4 4 0 0 0 8 8 V0',
  V: 'M0 0 L4 12 L8 0',
  W: 'M0 0 L2 12 L4 4 L6 12 L8 0',
  X: 'M0 0 L8 12 M8 0 L0 12',
  Y: 'M0 0 L4 6 L8 0 M4 6 V12',
  Z: 'M0 0 H8 L0 12 H8',
  '0': 'M4 0 A4 6 0 1 0 4 12 A4 6 0 1 0 4 0 Z',
  '1': 'M2 2 L4.5 0 V12 M2 12 H7',
  '2': 'M0.5 2.5 A3.75 3.2 0 1 1 7 4.5 L0 12 H8',
  '3': 'M0.5 1.2 H7.5 L3.5 5.4 A3.6 3.4 0 1 1 0.4 10.4',
  '4': 'M6 12 V0 L0 8.5 H8',
  '5': 'M7.5 0 H1 L0.5 5.2 A3.8 3.6 0 1 1 0.4 10.6',
  '6': 'M6.8 0.6 C2.5 1 0 4.5 0.2 8.2 A3.9 3.9 0 1 0 0.6 7',
  '7': 'M0 0 H8 L3 12',
  '8': 'M4 6 A3.3 3 0 1 1 4 0 A3.3 3 0 1 1 4 6 A3.8 3 0 1 0 4 12 A3.8 3 0 1 0 4 6 Z',
  '9': 'M1.2 11.4 C5.5 11 8 7.5 7.8 3.8 A3.9 3.9 0 1 0 7.4 5',
};

export function initials(name: string): string {
  const words = name
    .normalize('NFKD')
    .replace(/[^A-Za-z0-9 ]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter((w) => w && !/^(the|and|of|cafe|café|co)$/i.test(w));
  const letters = (words.length > 1 ? words.slice(0, 2).map((w) => w[0]) : [words[0]?.[0] ?? ''])
    .join('')
    .toUpperCase();
  return [...letters].filter((ch) => GLYPHS[ch]).join('');
}

/** Monogram SVG (square). `radius` 0 for full-bleed (Apple touch icon adds its own rounding). */
export function monogramSvg(text: string, bg: string, fg: string, radius = 0.22): string {
  const size = 512;
  const glyphH = text.length > 1 ? 196 : 236;
  const scale = glyphH / 12;
  const glyphW = 8 * scale;
  const gap = 0.34 * glyphW;
  const total = text.length * glyphW + Math.max(0, text.length - 1) * gap;
  const x0 = (size - total) / 2;
  const y0 = (size - glyphH) / 2;
  const paths = [...text]
    .map(
      (ch, i) =>
        `<path transform="translate(${(x0 + i * (glyphW + gap)).toFixed(1)} ${y0.toFixed(1)}) scale(${scale.toFixed(3)})" d="${GLYPHS[ch]}"/>`,
    )
    .join('');
  const mark = text ? paths : `<circle cx="${size / 2}" cy="${size / 2}" r="${size * 0.18}" fill="${fg}"/>`;
  // stroke width is in glyph units (scaled with the letters): ~5% of the tile, legible down to 32px
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}" rx="${size * radius}" fill="${bg}"/><g fill="none" stroke="${fg}" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round">${mark}</g></svg>`;
}

export interface Favicons {
  /** published path → file bytes */
  files: Record<string, Buffer | string>;
  /** <link> tags for the page head */
  links: string;
}

/** Build the favicon set for one cafe (or the private index when `logoFile` is null and name is "Demos"). */
export async function buildFavicons(opts: {
  urlBase: string;
  name: string;
  logoFile: string | null;
  bg: string;
  fg: string;
}): Promise<Favicons> {
  const { urlBase, name, logoFile, bg, fg } = opts;
  let square: Buffer;
  let svg: string | null = null;
  const logo =
    logoFile && existsSync(logoFile)
      ? await sharp(readFileSync(logoFile))
          .metadata()
          .catch(() => null)
      : null;
  if (logoFile && logo?.width && logo.height && Math.max(logo.width / logo.height, logo.height / logo.width) <= 1.3) {
    // roughly square logo: centred on a brand-coloured tile
    const inner = await sharp(readFileSync(logoFile), { density: 300 })
      .resize(380, 380, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toBuffer();
    square = await sharp({
      create: { width: 512, height: 512, channels: 4, background: bg },
    })
      .composite([{ input: inner, gravity: 'center' }])
      .png()
      .toBuffer();
  } else {
    const text = initials(name);
    svg = monogramSvg(text, bg, fg);
    square = await sharp(Buffer.from(monogramSvg(text, bg, fg, 0)))
      .png()
      .toBuffer();
  }
  const rounded = svg ? await sharp(Buffer.from(svg)).png().toBuffer() : square;
  const files: Record<string, Buffer | string> = {
    'favicon-32.png': await sharp(rounded).resize(32, 32).png().toBuffer(),
    'apple-touch-icon.png': await sharp(square).resize(180, 180).png().toBuffer(),
    'icon-512.png': rounded,
  };
  if (svg) files['favicon.svg'] = svg;
  const links = [
    svg ? `<link rel="icon" type="image/svg+xml" href="${urlBase}/favicon.svg" />` : '',
    `<link rel="icon" type="image/png" sizes="32x32" href="${urlBase}/favicon-32.png" />`,
    `<link rel="apple-touch-icon" href="${urlBase}/apple-touch-icon.png" />`,
  ]
    .filter(Boolean)
    .join('\n    ');
  return { files, links };
}

export const faviconLogoPath = (cafeDir: string, logo?: string) => (logo ? path.join(cafeDir, logo) : null);

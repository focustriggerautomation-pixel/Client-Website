/**
 * Labelled gradient placeholder photos in a cafe's brand colours, drawn with sharp (no browser, no downloads).
 * They let a brand-new cafe build and preview at once; `npm run check` keeps listing them until replaced.
 * The files written are recorded (with a hash) in cafes/<slug>/.placeholders.json.
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { PLACEHOLDER_LIST } from './template.ts';

const SIZES: Record<string, [number, number]> = {
  hero: [2000, 1333],
  about: [1200, 1500],
  menu: [1200, 900],
  gallery: [1400, 1050],
};
const sizeFor = (file: string): [number, number] => SIZES[file.split(/[-.]/)[0]] ?? [1400, 1050];
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);

export const sha1 = (buf: Buffer) => createHash('sha1').update(buf).digest('hex');

export async function placeholderJpeg(file: string, label: string, colors: { a: string; b: string }): Promise<Buffer> {
  const [w, h] = sizeFor(file);
  const fs = Math.round(Math.min(w, h) / 14);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${colors.a}"/><stop offset="1" stop-color="${colors.b}"/></linearGradient></defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
  <rect x="${fs}" y="${fs}" width="${w - 2 * fs}" height="${h - 2 * fs}" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="${Math.max(2, fs / 12)}" stroke-dasharray="${fs / 2} ${fs / 3}"/>
  <text x="50%" y="47%" text-anchor="middle" font-family="sans-serif" font-weight="700" font-size="${fs}" fill="#fff" fill-opacity=".9">${esc(label)}</text>
  <text x="50%" y="${47 + 9}%" text-anchor="middle" font-family="sans-serif" font-size="${Math.round(fs * 0.5)}" fill="#fff" fill-opacity=".75">PLACEHOLDER · replace ${esc(file)}</text>
</svg>`;
  return sharp(Buffer.from(svg)).jpeg({ quality: 80, mozjpeg: true }).toBuffer();
}

export function readPlaceholderList(cafeDir: string): Record<string, string> {
  const f = path.join(cafeDir, PLACEHOLDER_LIST);
  if (!existsSync(f)) return {};
  try {
    return JSON.parse(readFileSync(f, 'utf8')) as Record<string, string>;
  } catch {
    return {};
  }
}

/** Write placeholders for the given image paths ("images/x.jpg") that don't exist yet. Returns what was written. */
export async function writePlaceholders(
  cafeDir: string,
  items: { path: string; label: string }[],
  colors: { a: string; b: string },
): Promise<string[]> {
  const list = readPlaceholderList(cafeDir);
  const written: string[] = [];
  for (const { path: rel, label } of items) {
    const out = path.join(cafeDir, rel);
    if (existsSync(out) || !/\.jpe?g$/i.test(rel)) continue;
    const buf = await placeholderJpeg(path.basename(rel), label, colors);
    writeFileSync(out, buf);
    list[rel] = sha1(buf);
    written.push(rel);
  }
  if (written.length) writeFileSync(path.join(cafeDir, PLACEHOLDER_LIST), JSON.stringify(list, null, 2) + '\n');
  return written;
}

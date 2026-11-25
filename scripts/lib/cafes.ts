import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { CafeConfigError, parseCafeConfig, referencedImages, type CafeConfig } from '../../src/config/schema.ts';

export const ROOT = path.resolve(import.meta.dirname, '../..');
export const CAFES_DIR = path.join(ROOT, 'cafes');

export interface LoadedCafe {
  slug: string;
  dir: string;
  config: CafeConfig;
}

/** Cafe folders: every directory in /cafes not starting with "_" or ".". */
export function cafeSlugs(): string[] {
  if (!existsSync(CAFES_DIR)) return [];
  return readdirSync(CAFES_DIR)
    .filter((name) => !name.startsWith('_') && !name.startsWith('.') && statSync(path.join(CAFES_DIR, name)).isDirectory())
    .sort();
}

/** Load + validate one cafe, including that every referenced image file exists. */
export function loadCafeFromDisk(slug: string): LoadedCafe {
  const dir = path.join(CAFES_DIR, slug);
  const source = `cafes/${slug}/config.json`;
  const file = path.join(dir, 'config.json');
  if (!existsSync(file)) throw new CafeConfigError(source, ['config.json is missing']);

  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(file, 'utf8'));
  } catch (e) {
    throw new CafeConfigError(source, [`not valid JSON — ${(e as Error).message}`]);
  }

  const config = parseCafeConfig(raw, source, slug);
  const missing = referencedImages(config).filter((img) => !existsSync(path.join(dir, img)));
  if (missing.length) {
    throw new CafeConfigError(
      source,
      missing.map((img) => `image "${img}" is referenced but cafes/${slug}/${img} does not exist`),
    );
  }
  return { slug, dir, config };
}

export function loadAllCafes(): { cafes: LoadedCafe[]; errors: CafeConfigError[] } {
  const cafes: LoadedCafe[] = [];
  const errors: CafeConfigError[] = [];
  for (const slug of cafeSlugs()) {
    try {
      cafes.push(loadCafeFromDisk(slug));
    } catch (e) {
      if (e instanceof CafeConfigError) errors.push(e);
      else throw e;
    }
  }
  return { cafes, errors };
}

export function printErrorsAndExit(errors: CafeConfigError[]): never {
  console.error(`\n✖ ${errors.length} cafe config${errors.length === 1 ? ' is' : 's are'} invalid:\n`);
  for (const e of errors) console.error(e.message + '\n');
  process.exit(1);
}

import type { ImageManifest } from './images.ts';
import { CafeConfigError } from './model.ts';
import type { CafeConfig } from './schema.ts';

/**
 * Every /cafes/<slug>/config.json becomes its own lazily-loaded chunk, so a cafe page only downloads its own
 * content. The `?cafe` query makes the cafe-config Vite plugin validate it (zod, at build/dev time — zod is not
 * shipped to the browser), apply defaults and attach the intrinsic size of every image. Folders starting with
 * "_" are ignored.
 */
type CafeModule = {
  config: CafeConfig | null;
  images: ImageManifest;
  problems: string[];
};
const loaders = import.meta.glob<CafeModule>(['/cafes/*/config.json', '!/cafes/_*/**'], {
  query: '?cafe',
  import: 'default',
});

export interface LoadedCafe {
  config: CafeConfig;
  images: ImageManifest;
}

const slugFromPath = (p: string) => p.split('/')[2];
const bySlug = new Map(Object.entries(loaders).map(([path, load]) => [slugFromPath(path), load]));

export const listSlugs = (): string[] => [...bySlug.keys()].sort();

export const hasCafe = (slug: string) => bySlug.has(slug);

/** Throws CafeConfigError (with readable problems) if the config is invalid — only reachable in dev. */
export async function loadCafe(slug: string): Promise<LoadedCafe> {
  const load = bySlug.get(slug);
  if (!load) throw new Error(`No cafe "${slug}"`);
  const { config, images, problems } = await load();
  if (!config || problems.length) throw new CafeConfigError(`cafes/${slug}/config.json`, problems);
  return { config, images };
}

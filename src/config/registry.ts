import type { ImageManifest } from './images.ts';
import { parseCafeConfig, type CafeConfig } from './schema.ts';

/**
 * Every /cafes/<slug>/config.json becomes its own lazily-loaded chunk, so a
 * cafe page only downloads its own content. The `?cafe` query makes the
 * cafe-config Vite plugin attach the intrinsic size of every image
 * (for width/height + srcset). Folders starting with "_" are ignored.
 */
const loaders = import.meta.glob<{ config: unknown; images: ImageManifest }>(['/cafes/*/config.json', '!/cafes/_*/**'], {
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

/** Throws CafeConfigError (with readable problems) if the config is invalid. */
export async function loadCafe(slug: string): Promise<LoadedCafe> {
  const load = bySlug.get(slug);
  if (!load) throw new Error(`No cafe "${slug}"`);
  const { config, images } = await load();
  return { config: parseCafeConfig(config, `cafes/${slug}/config.json`, slug), images };
}

/** Image paths in config are relative to the cafe folder ("images/x.jpg") and served at /<slug>/images/x.jpg. */
export const imageUrl = (slug: string, path: string) => `/${slug}/${path}`;

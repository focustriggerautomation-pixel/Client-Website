import { parseCafeConfig, type CafeConfig } from './schema.ts';

/**
 * Every /cafes/<slug>/config.json becomes its own lazily-loaded chunk, so a
 * cafe page only downloads its own content. Folders starting with "_" are ignored.
 */
const loaders = import.meta.glob<unknown>(['/cafes/*/config.json', '!/cafes/_*/**'], { import: 'default' });

const slugFromPath = (p: string) => p.split('/')[2];
const bySlug = new Map(Object.entries(loaders).map(([path, load]) => [slugFromPath(path), { path, load }]));

export const listSlugs = (): string[] => [...bySlug.keys()].sort();

export const hasCafe = (slug: string) => bySlug.has(slug);

/** Throws CafeConfigError (with readable problems) if the config is invalid. */
export async function loadCafe(slug: string): Promise<CafeConfig> {
  const entry = bySlug.get(slug);
  if (!entry) throw new Error(`No cafe "${slug}"`);
  const raw = await entry.load();
  return parseCafeConfig(raw, `cafes/${slug}/config.json`, slug);
}

/** Image paths in config are relative to the cafe folder ("images/x.jpg") and served at /<slug>/images/x.jpg. */
export const imageUrl = (slug: string, path: string) => `/${slug}/${path}`;

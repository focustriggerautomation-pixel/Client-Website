import { useEffect, useState } from 'react';
import { listSlugs, loadCafe } from '../config/registry.ts';
import type { CafeConfig } from '../config/schema.ts';

type Row = { slug: string; cafe?: CafeConfig; error?: string };

/** Plain private index of every demo. Not linked from anywhere, noindex like everything else. */
export function IndexPage() {
  const [rows, setRows] = useState<Row[]>(() => listSlugs().map((slug) => ({ slug })));

  useEffect(() => {
    document.title = 'Demo index (private)';
    Promise.all(
      listSlugs().map((slug) =>
        loadCafe(slug).then(
          (cafe): Row => ({ slug, cafe }),
          (e: unknown): Row => ({ slug, error: e instanceof Error ? e.message.split('\n')[0] : String(e) }),
        ),
      ),
    ).then(setRows);
  }, []);

  return (
    <main className="mx-auto max-w-2xl px-6 py-14 font-body">
      <h1 className="text-step-2 font-semibold">Demo index</h1>
      <p className="mt-1 text-step-n1 text-muted">Private — {rows.length} demo{rows.length === 1 ? '' : 's'}. Not indexed by search engines.</p>
      <ul className="mt-8 divide-y divide-line border-y border-line">
        {rows.map(({ slug, cafe, error }) => (
          <li key={slug}>
            <a href={`/${slug}`} className="flex items-baseline justify-between gap-4 py-3 hover:bg-surface">
              <span>
                <span className="font-mono">/{slug}</span>
                {cafe && <span className="ml-3 text-muted">{cafe.name}</span>}
                {error && <span className="ml-3 text-accent">invalid config</span>}
              </span>
              {cafe && <span className="text-step-n1 text-muted">{cafe.mood}</span>}
            </a>
          </li>
        ))}
      </ul>
    </main>
  );
}

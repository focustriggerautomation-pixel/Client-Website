import type { CafeConfigError } from '../config/schema.ts';

/** Only reachable in dev — `npm run build` refuses to build with an invalid config. */
export function ConfigErrorPage({ error }: { error: CafeConfigError }) {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 font-body">
      <p className="eyebrow text-accent">Config error</p>
      <h1 className="mt-3 text-step-3 font-semibold">{error.source} is invalid</h1>
      <p className="mt-3 text-muted">Fix these fields and save — the page reloads automatically.</p>
      <ul className="mt-8 space-y-2 font-mono text-sm">
        {error.problems.map((p) => (
          <li key={p} className="rounded-md border border-line bg-surface px-4 py-3">
            {p}
          </li>
        ))}
      </ul>
    </main>
  );
}

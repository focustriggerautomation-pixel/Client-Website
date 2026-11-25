import { useEffect, useState } from 'react';
import { QrCode } from '../components/QrCode.tsx';
import { listSlugs, loadCafe } from '../config/registry.ts';
import type { CafeConfig } from '../config/schema.ts';

type Row = { slug: string; cafe?: CafeConfig; error?: string };

const MOOD_LABEL: Record<string, string> = {
  'dark-premium': 'Dark premium',
  'bright-cafe': 'Bright cafe',
  'warm-restaurant': 'Warm restaurant',
};

/**
 * The private index of every demo, at "/". Not linked from anywhere and noindex like everything else.
 * Each demo gets a QR code (show it on a call, or print it for a walk-in pitch), its link and a phone preview.
 */
export function IndexPage() {
  const [rows, setRows] = useState<Row[]>(() => listSlugs().map((slug) => ({ slug })));
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Demo index (private)';
    Promise.all(
      listSlugs().map((slug) =>
        loadCafe(slug).then(
          ({ config }): Row => ({ slug, cafe: config }),
          (e: unknown): Row => ({ slug, error: e instanceof Error ? e.message.split('\n')[0] : String(e) }),
        ),
      ),
    ).then(setRows);
  }, []);

  const copy = (url: string, slug: string) =>
    navigator.clipboard?.writeText(url).then(() => {
      setCopied(slug);
      setTimeout(() => setCopied((s) => (s === slug ? null : s)), 1600);
    });

  return (
    <main className="min-h-screen bg-[#F6F5F2] px-4 py-12 font-body text-[#1C1B19] sm:px-8 sm:py-16">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-[28px] font-semibold tracking-tight sm:text-[34px]">Demo index</h1>
            <p className="mt-1 text-[15px] text-[#5F5B53]">
              Private · {rows.length} demo{rows.length === 1 ? '' : 's'} · hidden from search engines
            </p>
          </div>
          <p className="max-w-xs text-[14px] leading-snug text-[#5F5B53]">
            Scan a code to open a demo on a phone, or use <span className="whitespace-nowrap">“Phone preview”</span>{' '}
            when screen-sharing.
          </p>
        </header>

        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map(({ slug, cafe, error }) => {
            const url = `${window.location.origin}/${slug}`;
            return (
              <li
                key={slug}
                className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-[0_1px_2px_rgba(0,0,0,.06),0_8px_24px_-12px_rgba(0,0,0,.18)]"
              >
                <div
                  aria-hidden
                  className="h-2"
                  style={{
                    background: cafe
                      ? `linear-gradient(90deg, ${cafe.brand.primary}, ${cafe.brand.accent ?? cafe.brand.primary})`
                      : '#ddd',
                  }}
                />
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate text-[19px] font-semibold">{cafe?.name ?? slug}</h2>
                      <p className="mt-0.5 truncate text-[14px] text-[#5F5B53]">
                        {error ? (
                          <span className="text-[#B3261E]">Invalid config — run npm run check</span>
                        ) : cafe ? (
                          MOOD_LABEL[cafe.mood]
                        ) : (
                          '…'
                        )}
                      </p>
                    </div>
                  </div>
                  <a href={`/${slug}`} className="mt-4 block">
                    <QrCode
                      url={url}
                      label={`QR code linking to ${url}`}
                      className="mx-auto w-40 ring-1 ring-black/5"
                    />
                  </a>
                  <p className="mt-3 break-all text-center font-mono text-[13px] text-[#5F5B53]">/{slug}</p>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-[14px]">
                    <a
                      href={`/${slug}`}
                      className="flex items-center justify-center rounded-lg bg-[#1C1B19] px-2 py-2 text-center font-medium leading-tight text-white hover:bg-black"
                    >
                      Open
                    </a>
                    <a
                      href={`/${slug}?preview=mobile`}
                      className="flex items-center justify-center rounded-lg border border-black/15 px-2 py-2 text-center leading-tight hover:bg-black/5"
                    >
                      Phone preview
                    </a>
                    <button
                      type="button"
                      onClick={() => copy(url, slug)}
                      className="rounded-lg border border-black/15 px-2 py-2 leading-tight hover:bg-black/5"
                    >
                      {copied === slug ? 'Copied ✓' : 'Copy link'}
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </main>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { loadCafe, type LoadedCafe } from '../config/registry.ts';
import { CafeConfigError, MOODS, type Mood } from '../config/model.ts';
import { buildTheme } from '../theme/buildTheme.ts';
import { CafeView } from './CafeView.tsx';
import { ConfigErrorPage } from './ConfigErrorPage.tsx';

type State = { status: 'loading' } | { status: 'ready'; data: LoadedCafe } | { status: 'error'; error: unknown };

/** `?mood=warm-restaurant` previews the same content in another mood (handy while pitching). */
function moodFromQuery(): Mood | undefined {
  const m = new URLSearchParams(window.location.search).get('mood');
  return MOODS.find((x) => x === m);
}

export function CafePage({
  slug,
  initial,
}: {
  slug: string;
  /** Already loaded (hydrating the prerendered page). */ initial?: LoadedCafe;
}) {
  const [state, setState] = useState<State>(initial ? { status: 'ready', data: initial } : { status: 'loading' });

  useEffect(() => {
    if (initial) return;
    let alive = true;
    loadCafe(slug).then(
      (data) => alive && setState({ status: 'ready', data }),
      (error) => alive && setState({ status: 'error', error }),
    );
    return () => {
      alive = false;
    };
  }, [slug, initial]);

  const data = state.status === 'ready' ? state.data : null;
  const theme = useMemo(() => (data ? buildTheme(data.config, moodFromQuery()) : null), [data]);

  useEffect(() => {
    if (data) document.title = data.config.seo?.title ?? `${data.config.name} — ${data.config.tagline}`;
  }, [data]);

  // Deep links (/slug#menu) — content renders after the config loads, so scroll once it exists.
  useEffect(() => {
    if (!data || !window.location.hash) return;
    document.getElementById(decodeURIComponent(window.location.hash.slice(1)))?.scrollIntoView();
  }, [data]);

  if (state.status === 'error') {
    if (state.error instanceof CafeConfigError) return <ConfigErrorPage error={state.error} />;
    throw state.error;
  }
  // The prebuilt HTML already paints the cafe's background colour, so "loading" is just an empty page.
  if (!data || !theme) return null;

  return <CafeView data={data} theme={theme} />;
}

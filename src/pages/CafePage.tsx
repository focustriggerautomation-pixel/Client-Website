import { useEffect, useMemo, useState } from 'react';
import { loadCafe } from '../config/registry.ts';
import { CafeConfigError, MOODS, type CafeConfig, type Mood } from '../config/schema.ts';
import { buildTheme } from '../theme/buildTheme.ts';
import { CafeThemeProvider } from '../theme/ThemeProvider.tsx';
import { Hero } from '../components/hero/Hero.tsx';
import { AgencyRibbon } from '../components/AgencyRibbon.tsx';
import { ConfigErrorPage } from './ConfigErrorPage.tsx';

type State = { status: 'loading' } | { status: 'ready'; cafe: CafeConfig } | { status: 'error'; error: unknown };

/** `?mood=warm-restaurant` previews the same content in another mood (handy while pitching). */
function moodFromQuery(): Mood | undefined {
  const m = new URLSearchParams(window.location.search).get('mood');
  return MOODS.find((x) => x === m);
}

export function CafePage({ slug }: { slug: string }) {
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    let alive = true;
    loadCafe(slug).then(
      (cafe) => alive && setState({ status: 'ready', cafe }),
      (error) => alive && setState({ status: 'error', error }),
    );
    return () => {
      alive = false;
    };
  }, [slug]);

  const cafe = state.status === 'ready' ? state.cafe : null;
  const theme = useMemo(() => (cafe ? buildTheme(cafe, moodFromQuery()) : null), [cafe]);

  useEffect(() => {
    if (cafe) document.title = cafe.seo?.title ?? `${cafe.name} — ${cafe.tagline}`;
  }, [cafe]);

  if (state.status === 'error') {
    if (state.error instanceof CafeConfigError) return <ConfigErrorPage error={state.error} />;
    throw state.error;
  }
  // The prebuilt HTML already paints the cafe's background colour, so "loading" is just an empty page.
  if (!cafe || !theme) return null;

  return (
    <CafeThemeProvider cafe={cafe} theme={theme}>
      <main>
        <Hero />
        {/* Later phases: About, Menu, Gallery, Reviews, Hours, Contact */}
      </main>
      <AgencyRibbon />
    </CafeThemeProvider>
  );
}

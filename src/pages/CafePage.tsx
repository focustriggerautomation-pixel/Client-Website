import { useEffect, useMemo, useState } from 'react';
import { loadCafe, type LoadedCafe } from '../config/registry.ts';
import { CafeConfigError, MOODS, type Mood } from '../config/schema.ts';
import { buildTheme } from '../theme/buildTheme.ts';
import { CafeThemeProvider } from '../theme/ThemeProvider.tsx';
import { SiteHeader } from '../components/header/SiteHeader.tsx';
import { Hero } from '../components/hero/Hero.tsx';
import { About } from '../components/about/About.tsx';
import { Menu } from '../components/menu/Menu.tsx';
import { Signature } from '../components/signature/Signature.tsx';
import { Gallery } from '../components/gallery/Gallery.tsx';
import { Reviews } from '../components/reviews/Reviews.tsx';
import { Visit } from '../components/visit/Visit.tsx';
import { ContactBand } from '../components/contact/ContactBand.tsx';
import { Footer } from '../components/footer/Footer.tsx';
import { FloatingWhatsApp } from '../components/FloatingWhatsApp.tsx';
import { ConfigErrorPage } from './ConfigErrorPage.tsx';

type State = { status: 'loading' } | { status: 'ready'; data: LoadedCafe } | { status: 'error'; error: unknown };

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
      (data) => alive && setState({ status: 'ready', data }),
      (error) => alive && setState({ status: 'error', error }),
    );
    return () => {
      alive = false;
    };
  }, [slug]);

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

  return (
    <CafeThemeProvider cafe={data.config} theme={theme} images={data.images}>
      <a href="#main" className="sr-only z-50 rounded-md bg-ink px-4 py-2 text-bg focus:not-sr-only focus:fixed focus:left-3 focus:top-3">
        Skip to content
      </a>
      <SiteHeader />
      <main id="main">
        <Hero />
        <About />
        <Menu />
        <Signature />
        <Gallery />
        <Reviews />
        <Visit />
        <ContactBand />
      </main>
      <Footer />
      <FloatingWhatsApp />
    </CafeThemeProvider>
  );
}

/**
 * Build-time prerender of a cafe page's first screen, injected into dist/<slug>/index.html by
 * scripts/postbuild.ts. The browser paints it straight from HTML — before any JavaScript — and React hydrates
 * it (keeps the same DOM) once the bundle has loaded. Everything below the hero is left for the browser.
 */
import { renderToString } from 'react-dom/server';
import { prerender } from 'react-dom/static';
import type { ImageManifest } from './config/images.ts';
import type { CafeConfig } from './config/schema.ts';
import { Intro } from './motion/Intro.tsx';
import { MotionProvider } from './motion/MotionProvider.tsx';
import { CafeView, CLIENT_ONLY } from './pages/CafeView.tsx';
import { buildTheme } from './theme/buildTheme.ts';
import { CafeThemeProvider } from './theme/ThemeProvider.tsx';

const noop = () => {};

export async function renderShell(config: CafeConfig, images: ImageManifest): Promise<{ app: string; intro: string }> {
  const theme = buildTheme(config);
  // The deferred sections throw CLIENT_ONLY here; their boundaries are marked for the browser to render,
  // tagged with that digest so the app can tell them apart from real errors.
  const { prelude } = await prerender(<CafeView data={{ config, images }} theme={theme} />, {
    onError: (e: unknown) => {
      if (e instanceof Error && e.message === CLIENT_ONLY) return CLIENT_ONLY;
      throw e;
    },
  });
  const app = await new Response(prelude).text();
  // The first-load splash sits outside the React root: it is animated by CSS alone and removed on hydration.
  const intro = renderToString(
    <CafeThemeProvider cafe={config} theme={theme} images={images}>
      <MotionProvider>
        <Intro onHandOver={noop} onDone={noop} />
      </MotionProvider>
    </CafeThemeProvider>,
  );
  return { app, intro };
}

/** CSS variables of the cafe's theme, for an inline <style> (the app sets the same ones on mount). */
export function themeVars(config: CafeConfig): { css: string; mood: string } {
  const theme = buildTheme(config);
  return {
    css: `:root{${Object.entries(theme.vars)
      .map(([k, v]) => `${k}:${v}`)
      .join(';')}}`,
    mood: theme.mood,
  };
}

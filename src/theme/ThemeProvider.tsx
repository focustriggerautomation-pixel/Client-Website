import { createContext, useContext, useLayoutEffect, type ReactNode } from 'react';
import type { ImageManifest } from '../config/images.ts';
import type { CafeConfig } from '../config/schema.ts';
import type { Theme } from './buildTheme.ts';

interface CafeContextValue {
  cafe: CafeConfig;
  theme: Theme;
  /** Intrinsic image sizes, for width/height + srcset. */
  images: ImageManifest;
}

const CafeContext = createContext<CafeContextValue | null>(null);

export function useCafe(): CafeContextValue {
  const ctx = useContext(CafeContext);
  if (!ctx) throw new Error('useCafe() must be used inside <CafeThemeProvider>');
  return ctx;
}

const FONT_LINK_ID = 'cafe-fonts';

/**
 * Applies the theme's CSS variables to <html> (so body/background pick them up)
 * and makes sure the Google Fonts stylesheet is present. The prebuilt
 * /<slug>/index.html already ships the same <link>, so in production this is a no-op.
 */
export function CafeThemeProvider({ cafe, theme, images, children }: CafeContextValue & { children: ReactNode }) {
  useLayoutEffect(() => {
    const root = document.documentElement;
    for (const [k, v] of Object.entries(theme.vars)) root.style.setProperty(k, v);
    root.dataset.mood = theme.mood;

    let link = document.getElementById(FONT_LINK_ID) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.id = FONT_LINK_ID;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    if (link.href !== theme.fonts.href) link.href = theme.fonts.href;

    return () => {
      for (const k of Object.keys(theme.vars)) root.style.removeProperty(k);
      delete root.dataset.mood;
    };
  }, [theme]);

  return <CafeContext.Provider value={{ cafe, theme, images }}>{children}</CafeContext.Provider>;
}

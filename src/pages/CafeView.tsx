import { Suspense, type ReactNode } from 'react';
import type { LoadedCafe } from '../config/registry.ts';
import type { Theme } from '../theme/buildTheme.ts';
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
import { MotionLayer } from '../motion/MotionLayer.tsx';
import { MotionProvider } from '../motion/MotionProvider.tsx';

/** Thrown during the build-time prerender by everything below the first screen (see Deferred). */
export const CLIENT_ONLY = 'client-only';

function ClientOnly({ children }: { children: ReactNode }) {
  if (typeof window === 'undefined') throw Object.assign(new Error(CLIENT_ONLY), { digest: CLIENT_ONLY });
  return children;
}

/**
 * Content below the first screen. The prerender stops here (the boundary is left for the browser to render),
 * so the prebuilt HTML stays small while React hydrates — reuses, not replaces — the header and hero.
 */
const Deferred = ({ children }: { children: ReactNode }) => (
  <Suspense fallback={null}>
    <ClientOnly>{children}</ClientOnly>
  </Suspense>
);

/** The cafe page itself; also rendered at build time for the prerendered first screen (src/prerender.tsx). */
export function CafeView({ data, theme }: { data: LoadedCafe; theme: Theme }) {
  return (
    <CafeThemeProvider cafe={data.config} theme={theme} images={data.images}>
      <MotionProvider>
        <MotionLayer>
          <a
            href="#main"
            className="sr-only z-50 rounded-md bg-ink px-4 py-2 text-bg focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
          >
            Skip to content
          </a>
          <SiteHeader />
          <main id="main">
            <Hero />
            <Deferred>
              <About />
              <Menu />
              <Signature />
              <Gallery />
              <Reviews />
              <Visit />
              <ContactBand />
            </Deferred>
          </main>
          <Deferred>
            <Footer />
            <FloatingWhatsApp />
          </Deferred>
        </MotionLayer>
      </MotionProvider>
    </CafeThemeProvider>
  );
}

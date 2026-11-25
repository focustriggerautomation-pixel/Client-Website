import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { createContext, useContext, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react';
import type { MotionProfile } from '../theme/moods.ts';
import { useCafe } from '../theme/ThemeProvider.tsx';
import { gsap, ScrollTrigger } from './gsap.ts';
import { Intro, shouldPlayIntro } from './Intro.tsx';

interface MotionContextValue {
  /** prefers-reduced-motion (or ?motion=reduced): no intro, parallax, pinning, tilt or smooth scroll — simple fades only. */
  reduced: boolean;
  /** ?motion=off: no animation layer at all (static page; used as a performance baseline). */
  off: boolean;
  /** Mouse/trackpad (hover-capable) vs touch. */
  finePointer: boolean;
  profile: MotionProfile;
  lenis: Lenis | null;
  /** Resolves when the intro starts handing over to the hero (immediately if there is no intro). */
  introDone: Promise<void>;
}

const MotionContext = createContext<MotionContextValue | null>(null);

export function useMotion(): MotionContextValue {
  const ctx = useContext(MotionContext);
  if (!ctx) throw new Error('useMotion() must be used inside <MotionProvider>');
  return ctx;
}

function useMedia(query: string): boolean {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(query);
      m.addEventListener('change', cb);
      return () => m.removeEventListener('change', cb);
    },
    () => window.matchMedia(query).matches,
  );
}

const motionParam = () => new URLSearchParams(window.location.search).get('motion');

export function MotionProvider({ children }: { children: ReactNode }) {
  const { cafe, theme } = useCafe();
  const profile = theme.tokens.motion.gsap; // follows ?mood= overrides
  const off = motionParam() === 'off';
  const reduced = useMedia('(prefers-reduced-motion: reduce)') || motionParam() === 'reduced' || off;
  const finePointer = useMedia('(hover: hover) and (pointer: fine)');
  const [lenis, setLenis] = useState<Lenis | null>(null);

  // Intro: decided once per page load.
  const [intro] = useState(() => {
    const play = !reduced && shouldPlayIntro(cafe.slug);
    let resolve!: () => void;
    const promise = new Promise<void>((r) => (resolve = r));
    if (!play) resolve();
    return { play, promise, resolve };
  });
  const [introMounted, setIntroMounted] = useState(intro.play);

  // Lenis smooth scroll for mouse/trackpad only, driven by GSAP's ticker so ScrollTrigger and Lenis share one frame
  // loop. Phones keep native momentum scrolling: Lenis doesn't smooth touch anyway, and its per-frame scrollTo()
  // forced a style flush every frame in the throttled-phone profile.
  useEffect(() => {
    if (reduced || !finePointer) return;
    const l = new Lenis({
      lerp: profile.lerp,
      autoRaf: false,
      anchors: true, // offset comes from html { scroll-padding-top }, which Lenis honours
      // Let the lightbox and the mobile menu scroll natively.
      prevent: (node) => !!node.closest('[data-lenis-prevent]'),
    });
    l.on('scroll', ScrollTrigger.update);
    const tick = (time: number) => l.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    setLenis(l);
    return () => {
      gsap.ticker.remove(tick);
      gsap.ticker.lagSmoothing(500, 33);
      l.destroy();
      setLenis(null);
    };
  }, [reduced, finePointer, profile.lerp]);

  // Webfonts change line heights: re-measure every trigger once they're in.
  useEffect(() => {
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
  }, []);

  const value = useMemo<MotionContextValue>(
    () => ({ reduced, off, finePointer, profile, lenis, introDone: intro.promise }),
    [reduced, off, finePointer, profile, lenis, intro.promise],
  );

  return (
    <MotionContext.Provider value={value}>
      {children}
      {introMounted && <Intro onHandOver={intro.resolve} onDone={() => setIntroMounted(false)} />}
    </MotionContext.Provider>
  );
}

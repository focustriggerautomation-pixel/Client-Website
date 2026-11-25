import { Component, lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useMotion } from '../motion/MotionProvider.tsx';
import { useCafe } from '../theme/ThemeProvider.tsx';
import { decide3D } from './capability.ts';
import { CupFallback, GlassFallback, PlateFallback } from './Fallbacks.tsx';
import { palette3D } from './palette.ts';

// The 3D chunk (three + @react-three/fiber + drei). Never part of the main bundle.
const Scene = lazy(() => import('./scene/Scene.tsx'));

type Status = { kind: 'loading' } | { kind: '3d'; fps: number } | { kind: 'fallback'; reason: string };

class Boundary extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(err: unknown) {
    console.warn('[hero3d] falling back:', err);
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

const FALLBACKS = { 'dark-premium': CupFallback, 'bright-cafe': GlassFallback, 'warm-restaurant': PlateFallback };

/**
 * The hero's 3D object slot. Renders the illustrated (CSS-animated) version immediately — so the hero is
 * complete and readable with zero 3D code — then, on capable devices, lazy-loads the real-time scene after
 * first paint + the intro, keeps it invisible while it proves it can hold a decent frame rate, and crossfades.
 * Any failure (old device, no WebGL, chunk/load error, lost context, low fps) settles on the illustration.
 */
export function Hero3D({ className = '' }: { className?: string }) {
  const { cafe, theme } = useCafe();
  const { reduced, introDone } = useMotion();
  const palette = useMemo(() => palette3D(theme), [theme]);
  const decision = useMemo(() => decide3D(reduced), [reduced]);
  const [status, setStatus] = useState<Status>(() => (decision.try3d ? { kind: 'loading' } : { kind: 'fallback', reason: decision.reason }));
  const [mount, setMount] = useState(false);

  const stage = useRef<HTMLDivElement>(null);

  // The illustration's CSS animations animate SVG internals, which Chrome runs on the main thread (not the
  // compositor): pause them whenever the hero is off screen. Measured: ~5–6 points of dropped scroll frames.
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => el.toggleAttribute('data-paused', !e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!decision.try3d || !cafe.hero3d) return;
    let alive = true;
    let io: IntersectionObserver | undefined;
    const idle = (fn: () => void, timeout: number) =>
      'requestIdleCallback' in window ? window.requestIdleCallback(fn, { timeout }) : globalThis.setTimeout(fn, 300);
    // Fetch the chunk early (network only), so mounting later costs just parse/setup — but strictly after the
    // first paint: idle callbacks can run before the first frame, so wait for two animation frames first.
    introDone.then(() =>
      requestAnimationFrame(() =>
        requestAnimationFrame(() =>
          idle(() => {
            if (alive) void import('./scene/Scene.tsx').catch(() => {});
          }, 2000),
        ),
      ),
    );
    // Mount only after the intro has fully finished and the hero entrance has played (~1.4s), in idle time,
    // and only while the hero is on screen: the intro and the headline animation never compete with 3D setup.
    introDone.then(() =>
      globalThis.setTimeout(() => {
        if (!alive || !stage.current) return;
        io = new IntersectionObserver(([e]) => {
          if (!e.isIntersecting) return;
          io?.disconnect();
          idle(() => alive && setMount(true), 1500);
        });
        io.observe(stage.current);
      }, 1400),
    );
    return () => {
      alive = false;
      io?.disconnect();
    };
  }, [decision, introDone, cafe.hero3d]);

  // Stable callbacks: a status change here must never re-render the 3D scene (that re-ran its effects and
  // regenerated the environment map — an ~8s stall in software WebGL).
  const fail = useCallback((reason: string) => setStatus({ kind: 'fallback', reason }), []);
  const ready = useCallback((fps: number) => setStatus({ kind: '3d', fps }), []);
  const gate = !(decision.try3d && decision.forced);

  if (!cafe.hero3d) return null;
  const Fallback = FALLBACKS[theme.mood];
  const show3d = status.kind === '3d';

  return (
    <div
      ref={stage}
      aria-hidden
      data-hero3d={status.kind === 'fallback' ? `fallback:${status.reason}` : status.kind}
      data-hero3d-fps={status.kind === '3d' ? status.fps : undefined}
      className={`pointer-events-none select-none ${className}`}
    >
      <div
        className="absolute inset-0"
        style={{ opacity: show3d ? 0 : 1, visibility: show3d ? 'hidden' : 'visible', transition: 'opacity .8s ease, visibility 0s linear .8s' }}
      >
        <Fallback p={palette} />
      </div>
      {mount && status.kind !== 'fallback' && (
        <Boundary onError={() => fail('error')}>
          <Suspense fallback={null}>
            {/* 0.01, not 0, while measuring: an opacity:0 layer can skip compositing, which would flatter the fps check. */}
            <div className="absolute inset-0" style={{ opacity: show3d ? 1 : 0.01, transition: 'opacity .8s ease' }}>
              <Scene palette={palette} gate={gate} onReady={ready} onFail={fail} />
            </div>
          </Suspense>
        </Boundary>
      )}
    </div>
  );
}

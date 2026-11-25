import { useRef } from 'react';
import { imageUrl } from '../config/registry.ts';
import { useCafe } from '../theme/ThemeProvider.tsx';
import { gsap, SplitText, useGSAP } from './gsap.ts';

const key = (slug: string) => `intro-seen:${slug}`;

/** Once per browser session, only when landing at the top of the page. Read-only (safe to call twice). */
export function shouldPlayIntro(slug: string): boolean {
  if (window.location.hash || window.scrollY > 0) return false;
  try {
    return !sessionStorage.getItem(key(slug));
  } catch {
    return true; // storage blocked: still play
  }
}

const markSeen = (slug: string) => {
  try {
    sessionStorage.setItem(key(slug), '1');
  } catch {
    /* ignore */
  }
};

/**
 * Branded loader: the cafe name (or logo) reveals, then the curtain hands over to the hero.
 * Whole sequence ≤ 1.5s, tap to skip, and a hard 2.2s fail-safe so it can never trap the page.
 */
export function Intro({ onHandOver, onDone }: { onHandOver: () => void; onDone: () => void }) {
  const { cafe, theme } = useCafe();
  const p = theme.tokens.motion.gsap;
  const root = useRef<HTMLDivElement>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);

  useGSAP(
    () => {
      markSeen(cafe.slug);
      const el = root.current!;
      const name = el.querySelector<HTMLElement>('[data-intro-name]')!;
      const line = el.querySelector<HTMLElement>('[data-intro-line]')!;
      let handed = false;
      const handOver = () => {
        if (!handed) {
          handed = true;
          onHandOver();
        }
      };
      const split = name.tagName === 'IMG' ? null : SplitText.create(name, { type: 'chars,words', mask: p.intro === 'curtain' ? 'chars' : undefined });
      const parts = split ? (p.intro === 'pop' ? split.words : split.chars) : [name];

      // Created paused and started on the next frame: started inside the boot task, its first ~300ms were
      // swallowed by that long task on a throttled phone (visible jump). Hidden states are already applied.
      const t = gsap.timeline({
        paused: true,
        defaults: { ease: p.ease },
        onComplete: () => {
          handOver();
          onDone();
        },
      });
      if (p.intro === 'curtain') {
        // dark-premium: letters rise out of a mask, a hairline draws, the curtain lifts.
        t.from(parts, { yPercent: 110, duration: 0.5, stagger: 0.02, ease: 'expo.out' })
          .from(line, { scaleX: 0, duration: 0.55, ease: 'expo.inOut' }, 0.05)
          .add(handOver, 0.62)
          .to(el, { yPercent: -100, duration: 0.5, ease: 'expo.inOut' }, 0.6);
      } else if (p.intro === 'pop') {
        // bright-cafe: words pop and wobble, then the panel shrinks away.
        t.from(parts, { scale: 0.3, rotate: () => gsap.utils.random(-14, 14), opacity: 0, duration: 0.45, stagger: 0.06, ease: 'back.out(2.2)' })
          .from(line, { scaleX: 0, duration: 0.35, ease: 'back.out(2)' }, 0.2)
          .add(handOver, 0.6)
          .to(el, { opacity: 0, scale: 1.04, duration: 0.35, ease: 'power2.in' }, 0.65);
      } else {
        // warm-restaurant: a soft fade-up and the ornament line, then a gentle dissolve.
        t.from(parts, { opacity: 0, y: 14, duration: 0.5, stagger: 0.015, ease: 'power2.out' })
          .from(line, { scaleX: 0, duration: 0.55, ease: 'power2.inOut' }, 0.1)
          .add(handOver, 0.62)
          .to(el, { opacity: 0, duration: 0.45, ease: 'power1.inOut' }, 0.62);
      }
      tl.current = t;
      const raf = requestAnimationFrame(() => t.play());

      // Never hold the page hostage.
      const failSafe = gsap.delayedCall(2.2, () => t.progress(1));
      return () => {
        cancelAnimationFrame(raf);
        failSafe.kill();
        split?.revert();
        handOver();
      };
    },
    { scope: root },
  );

  const skip = () => tl.current?.progress(1);

  return (
    <div ref={root} onPointerDown={skip} data-intro aria-hidden className="fixed inset-0 z-[80] grid place-items-center bg-bg text-ink will-change-transform">
      <div className="flex flex-col items-center gap-5 px-6 text-center">
        {cafe.brand.logo ? (
          <img data-intro-name src={imageUrl(cafe.slug, cafe.brand.logo)} alt="" className="h-14 w-auto sm:h-16" />
        ) : (
          <p data-intro-name className="display text-step-5">
            {cafe.name}
          </p>
        )}
        <span data-intro-line className="block h-px w-24 origin-left bg-primary" />
      </div>
    </div>
  );
}

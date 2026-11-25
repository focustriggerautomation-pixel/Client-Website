import type { Mood } from '../../src/config/model.ts';

/**
 * The first-load intro as pure CSS on the prerendered first screen: splash → name reveal → hand-over → hero
 * entrance, starting at first paint instead of after the JS bundle. Mirrors each mood's GSAP choreography
 * (src/motion/Intro.tsx + MotionLayer hero timeline), transform/opacity only. Enabled by the inline script
 * adding `.shell-intro` to <html> (so JS — not CSS — opts content into a hidden start state), and every
 * animation ends visible: nothing can stay hidden even if the main bundle never loads.
 */
const EASE = {
  expoOut: 'cubic-bezier(0.16, 1, 0.3, 1)',
  expoInOut: 'cubic-bezier(0.87, 0, 0.13, 1)',
  backOut: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  softOut: 'cubic-bezier(0.25, 0.8, 0.25, 1)',
  in: 'cubic-bezier(0.55, 0, 1, 0.45)',
};

type Step = {
  sel: string;
  from: string;
  dur: number;
  at: number;
  ease: string;
  stagger?: number;
};

// Timings: the splash hands over at ~0.6s and everything has settled by ~1.8s. Only the splash and the headline
// words fade; the rest moves with transforms alone, already in motion as the splash lifts, so it is painted —
// and counted by the browser as content — from the first frame, underneath the splash.
const PLAN: Record<
  Mood,
  { steps: Step[]; overlay: { to: string; at: number; dur: number; ease: string }; mountAt: number }
> = {
  'dark-premium': {
    overlay: { to: 'transform:translateY(-100%)', at: 0.55, dur: 0.45, ease: EASE.expoInOut },
    steps: [
      { sel: '[data-intro-name]', from: 'opacity:0;transform:translateY(40%)', at: 0, dur: 0.45, ease: EASE.expoOut },
      { sel: '[data-intro-line]', from: 'transform:scaleX(0)', at: 0.05, dur: 0.5, ease: EASE.expoInOut },
      { sel: '[data-hero=media]', from: 'transform:scale(1.16)', at: 0.55, dur: 2.2, ease: EASE.expoOut },
      { sel: '[data-hero=kicker]', from: 'transform:translateX(-24px)', at: 0.6, dur: 0.8, ease: EASE.expoOut },
      {
        sel: '[data-hero=title] .sw',
        from: 'opacity:0;transform:translateY(0.6em)',
        at: 0.75,
        dur: 0.8,
        ease: EASE.expoOut,
        stagger: 0.05,
      },
      { sel: '[data-hero=sub]', from: 'transform:translateY(22px)', at: 0.65, dur: 0.95, ease: EASE.expoOut },
      { sel: '[data-hero=cta]', from: 'transform:translateY(22px)', at: 0.7, dur: 0.95, ease: EASE.expoOut },
      { sel: '[data-hero=object]', from: 'transform:scale(0.94)', at: 0.8, dur: 1.0, ease: EASE.expoOut },
    ],
    mountAt: 1.9,
  },
  'bright-cafe': {
    overlay: { to: 'opacity:0;transform:scale(1.04)', at: 0.6, dur: 0.3, ease: EASE.in },
    steps: [
      {
        sel: '[data-intro-name]',
        from: 'opacity:0;transform:scale(0.3) rotate(-8deg)',
        at: 0,
        dur: 0.45,
        ease: EASE.backOut,
      },
      { sel: '[data-intro-line]', from: 'transform:scaleX(0)', at: 0.2, dur: 0.3, ease: EASE.backOut },
      { sel: '[data-hero=kicker]', from: 'transform:scale(0.4) rotate(-16deg)', at: 0.6, dur: 0.6, ease: EASE.backOut },
      {
        sel: '[data-hero=title] .sw',
        from: 'opacity:0;transform:translateY(0.55em) rotate(7deg) scale(0.85)',
        at: 0.62,
        dur: 0.7,
        ease: EASE.backOut,
        stagger: 0.04,
      },
      {
        sel: '[data-hero=media]',
        from: 'transform:translateY(70px) rotate(-8deg) scale(0.88)',
        at: 0.6,
        dur: 0.9,
        ease: EASE.backOut,
      },
      { sel: '[data-hero=deco]', from: 'transform:scale(0)', at: 0.8, dur: 0.7, ease: EASE.backOut, stagger: 0.1 },
      { sel: '[data-hero=sub]', from: 'transform:translateY(20px)', at: 0.62, dur: 0.7, ease: EASE.backOut },
      {
        sel: '[data-hero=cta]',
        from: 'transform:translateY(22px) scale(0.9)',
        at: 0.68,
        dur: 0.7,
        ease: EASE.backOut,
        stagger: 0.06,
      },
      { sel: '[data-hero=object]', from: 'transform:scale(0.6)', at: 0.75, dur: 0.8, ease: EASE.backOut },
    ],
    mountAt: 1.7,
  },
  'warm-restaurant': {
    overlay: { to: 'opacity:0', at: 0.55, dur: 0.4, ease: EASE.softOut },
    steps: [
      { sel: '[data-intro-name]', from: 'opacity:0;transform:translateY(14px)', at: 0, dur: 0.45, ease: EASE.softOut },
      { sel: '[data-intro-line]', from: 'transform:scaleX(0)', at: 0.1, dur: 0.5, ease: EASE.softOut },
      { sel: '[data-hero=media]', from: 'transform:scale(1.06)', at: 0.45, dur: 1.8, ease: EASE.softOut },
      { sel: '[data-hero=kicker]', from: 'transform:translateY(12px)', at: 0.55, dur: 0.9, ease: EASE.softOut },
      {
        sel: '[data-hero=title] .sw',
        from: 'opacity:0;transform:translateY(0.4em)',
        at: 0.7,
        dur: 0.85,
        ease: EASE.softOut,
        stagger: 0.05,
      },
      { sel: '[data-hero=deco]', from: 'transform:scaleX(0)', at: 0.9, dur: 0.8, ease: EASE.softOut },
      { sel: '[data-hero=sub]', from: 'transform:translateY(14px)', at: 0.6, dur: 1.0, ease: EASE.softOut },
      {
        sel: '[data-hero=cta]',
        from: 'transform:translateY(14px)',
        at: 0.65,
        dur: 1.0,
        ease: EASE.softOut,
        stagger: 0.08,
      },
      {
        sel: '[data-hero=object]',
        from: 'transform:translateY(16px) scale(0.96)',
        at: 0.8,
        dur: 0.9,
        ease: EASE.softOut,
      },
    ],
    mountAt: 1.8,
  },
};

const MAX_STAGGERED = 14; // headline words / repeated elements

export function shellIntroCss(mood: Mood): {
  css: string;
  mountAtMs: number;
  endsAtMs: number;
} {
  const plan = PLAN[mood];
  const R = 'html.shell-intro';
  const rules: string[] = [];
  plan.steps.forEach((s, i) => {
    rules.push(`@keyframes si${i}{from{${s.from}}}`);
    const base = `${R} ${s.sel}{animation:si${i} ${s.dur}s ${s.ease} ${s.at}s ${s.sel.startsWith('[data-intro') ? 'both' : 'backwards'}}`;
    rules.push(base);
    if (s.stagger) {
      // headline words sit one per wrapper span (src/components/hero/Words.tsx)
      const nth = (n: number) =>
        s.sel === '[data-hero=title] .sw'
          ? `[data-hero=title] > span:nth-of-type(${n}) .sw`
          : `${s.sel}:nth-of-type(${n})`;
      for (let n = 1; n < MAX_STAGGERED; n++)
        rules.push(`${R} ${nth(n + 1)}{animation-delay:${(s.at + n * s.stagger).toFixed(3)}s}`);
    }
  });
  const o = plan.overlay;
  rules.push(`@keyframes siOut{to{${o.to};visibility:hidden}}`);
  rules.push(`${R} [data-intro]{animation:siOut ${o.dur}s ${o.ease} ${o.at}s both}`);
  rules.push(`${R} [data-hero=title] .sw{display:inline-block}`);
  // The splash exists only while the CSS intro runs: without JavaScript (no .shell-intro) it never shows.
  const always = `#shell-intro{display:none}html.shell-intro #shell-intro{display:block}`;
  // never animate for people who asked for less motion (the inline script also skips the splash for them)
  return {
    css: `${always}@media (prefers-reduced-motion:no-preference){${rules.join('')}}`,
    mountAtMs: Math.round(plan.mountAt * 1000),
    endsAtMs: Math.round(
      Math.max(...plan.steps.map((s) => s.at + s.dur + (s.stagger ?? 0) * (MAX_STAGGERED - 1))) * 1000,
    ),
  };
}

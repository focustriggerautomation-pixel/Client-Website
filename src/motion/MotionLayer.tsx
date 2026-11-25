import { useRef, type ReactNode } from 'react';
import { useCafe } from '../theme/ThemeProvider.tsx';
import { gsap, ScrollTrigger, SplitText, useGSAP } from './gsap.ts';
import { useMotion } from './MotionProvider.tsx';

/** Cached: Intl formatting via toLocaleString showed up in the profile (it builds a formatter per call). */
const INR = new Intl.NumberFormat('en-IN');

/**
 * The animation layer. Sections stay plain markup; they opt in with data attributes:
 *
 *   data-hero="media|kicker|title|sub|cta|deco"  hero intro timeline (after the loader)
 *   data-anim="kicker|title|fade"                 reveal on scroll (titles split into lines/words)
 *   data-anim="stagger" | "text"                  children reveal in a stagger, batched as they enter
 *   data-parallax="<speed>"                       scroll-scrubbed depth (+ = slower/background, − = faster/foreground)
 *   data-parallax-scale="1.08"  data-parallax-fade  extra depth cues
 *   data-tilt                                     3D tilt: pointer on desktop, scroll velocity on touch
 *   data-magnetic                                 magnetic pull on desktop
 *   data-count                                    numbers count up on reveal
 *   data-header                                   hides on scroll down, returns on scroll up
 *
 * Hidden start states are applied here (in a layout effect, before paint) — never in CSS —
 * so if JS fails or hasn't run, everything is simply visible. All tweens/triggers live in
 * one gsap.context via useGSAP and are reverted on unmount or when the mood changes.
 */
export function MotionLayer({ children }: { children: ReactNode }) {
  const scope = useRef<HTMLDivElement>(null);
  const { reduced, finePointer, profile: P, introDone, off } = useMotion();
  const { theme } = useCafe();
  const distance = theme.tokens.motion.distance;

  useGSAP(
    (ctx, contextSafe) => {
      if (off) return;
      try {
        return setup(contextSafe!);
      } catch (err) {
        // Fail open: undo every hidden state so the page is simply static and fully visible.
        console.error('[motion] disabled after an error:', err);
        queueMicrotask(() => ctx.revert());
      }
    },
    { scope, dependencies: [reduced, finePointer, P, off], revertOnUpdate: true },
  );

  function setup(cs: <T extends (...args: never[]) => unknown>(fn: T) => T) {
    const root = scope.current!;
    const $ = <T extends Element = HTMLElement>(sel: string, within: Element = root) => gsap.utils.toArray<T>(sel, within);
    const cleanups: (() => void)[] = [];
    const on = <K extends keyof HTMLElementEventMap>(el: HTMLElement, type: K, fn: (e: HTMLElementEventMap[K]) => void) => {
      const h = cs(fn as (...args: unknown[]) => void) as (e: Event) => void;
      el.addEventListener(type, h);
      cleanups.push(() => el.removeEventListener(type, h));
    };
    // One-shot "has it entered the viewport?" → a single IntersectionObserver, not ScrollTriggers. ScrollTrigger
    // updates every live trigger synchronously inside each scroll event; ~60 waiting reveal triggers made that
    // the top cost on a throttled phone. IO is computed by the browser once per frame, off the scroll path.
    const pending = new Map<Element, () => void>();
    const io = new IntersectionObserver(
      cs((entries: IntersectionObserverEntry[]) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          io.unobserve(e.target);
          const fn = pending.get(e.target);
          pending.delete(e.target);
          fn?.();
        }
      }),
      { rootMargin: '0px 0px -10% 0px' },
    );
    cleanups.push(() => io.disconnect());
    const once = (el: Element, fn: () => void) => {
      pending.set(el, fn);
      io.observe(el);
    };

    // ── Split-text reveal (also used by the hero). Splits at reveal time so fonts and widths are final,
    //    and reverts afterwards so the heading reflows naturally on resize.
    const revealText = (el: HTMLElement) => {
      gsap.set(el, { opacity: 1 });
      if (reduced) return gsap.from(el, { opacity: 0, duration: 0.5 });
      const words = P.split === 'words';
      const split = SplitText.create(el, { type: words ? 'words' : 'lines', mask: words ? undefined : 'lines' });
      return gsap.from(words ? split.words : split.lines, {
        ...(words ? { y: '0.55em', rotate: 7, scale: 0.85, opacity: 0, transformOrigin: '0% 100%' } : { yPercent: 115 }),
        duration: P.reveal,
        ease: P.textEase,
        stagger: words ? P.stagger * 0.8 : P.stagger,
        onComplete: () => split.revert(),
      });
    };

    // ── 1. Hero: hidden now (behind the loader), played when the intro hands over.
    const hero = root.querySelector<HTMLElement>('#top');
    if (hero) {
      const pick = (k: string) => $(`[data-hero="${k}"]`, hero);
      const [media, kicker, sub, cta, deco] = ['media', 'kicker', 'sub', 'cta', 'deco'].map(pick);
      const title = pick('title')[0];
      const tl = gsap.timeline({ paused: true, defaults: { ease: P.ease } });
      if (title) gsap.set(title, { opacity: 0 });
      if (reduced) {
        tl.from([...media, ...kicker, ...sub, ...cta, ...deco], { opacity: 0, duration: 0.6, stagger: 0.04, ease: 'none' }, 0);
        if (title) tl.call(() => void revealText(title), [], 0);
      } else if (P.intro === 'curtain') {
        tl.from(media, { scale: P.heroScale, opacity: 0, duration: 2.6, ease: 'expo.out' }, 0) // ends at the photo's designed opacity
          .from(kicker, { opacity: 0, x: -28, duration: 1.2 }, 0.25)
          .from(sub, { opacity: 0, y: 26, duration: 1.3 }, 0.8)
          .from(cta, { opacity: 0, y: 26, duration: 1.2, stagger: 0.12 }, 0.95);
        if (title) tl.call(() => void revealText(title), [], 0.35);
      } else if (P.intro === 'pop') {
        tl.from(kicker, { opacity: 0, scale: 0.4, rotate: -16, duration: 0.7, ease: 'back.out(2.6)' }, 0)
          .from(media, { opacity: 0, y: 90, rotate: -9, scale: 0.85, duration: 1.05, ease: 'back.out(1.5)' }, 0.1)
          .from(deco, { scale: 0, duration: 0.8, stagger: 0.12, ease: 'back.out(2.6)' }, 0.35)
          .from(sub, { opacity: 0, y: 22, duration: 0.7 }, 0.45)
          .from(cta, { opacity: 0, y: 26, scale: 0.9, duration: 0.75, stagger: 0.08 }, 0.55);
        if (title) tl.call(() => void revealText(title), [], 0.12);
      } else {
        tl.from(media, { opacity: 0, scale: P.heroScale, duration: 1.9, ease: 'power2.out' }, 0)
          .from(kicker, { opacity: 0, y: 14, duration: 1 }, 0.2)
          .from(deco, { opacity: 0, scaleX: 0, duration: 1 }, 0.6)
          .from(sub, { opacity: 0, y: 16, duration: 1 }, 0.65)
          .from(cta, { opacity: 0, y: 16, duration: 1, stagger: 0.1 }, 0.8);
        if (title) tl.call(() => void revealText(title), [], 0.3);
      }
      introDone.then(cs(() => tl.play()));
    }

    // ── 2–3. Scroll reveals (headings, blocks, lists).
    // ScrollTrigger decides WHEN; the motion itself is a CSS transition on transform/opacity, which Chrome runs on
    // the compositor thread. Driving these with per-frame GSAP tweens was the biggest source of dropped frames
    // on a 4×-throttled phone (main-thread style writes on every revealing element, every frame, mid-scroll).
    // Hidden start states are still written here, by JS, and all writes happen before any trigger reads layout.
    const ease = reduced ? 'linear' : theme.tokens.motion.easing; // the mood's CSS curve: expo-ish / overshoot / soft
    const dur = reduced ? 0.45 : P.reveal;
    const touched = new Set<HTMLElement>();
    const hide = (el: HTMLElement, transform: string) => {
      touched.add(el);
      el.style.transition = 'none';
      el.style.opacity = '0';
      if (!reduced) el.style.transform = transform;
    };
    const show = (els: HTMLElement[], stagger: number, d = dur) =>
      els.forEach((el, i) => {
        const delay = (i * stagger).toFixed(3);
        el.style.transition = `opacity ${d}s ${ease} ${delay}s, transform ${d}s ${ease} ${delay}s`;
        el.style.opacity = '';
        el.style.transform = '';
        const done = () => (el.style.transition = '');
        el.addEventListener('transitionend', done, { once: true });
      });
    cleanups.push(() =>
      touched.forEach((el) => {
        el.style.removeProperty('transition');
        el.style.removeProperty('opacity');
        el.style.removeProperty('transform');
      }),
    );

    const blocks = $('[data-anim="kicker"], [data-anim="fade"]');
    const listEls = $('[data-anim="stagger"], [data-anim="text"]')
      .map((l) => ({ l, items: gsap.utils.toArray<HTMLElement>(l.children) }))
      .filter(({ items }) => items.length);
    const lists = listEls.map(({ items }) => items);
    const titles = $('[data-anim="title"]');
    // write phase
    blocks.forEach((el) => hide(el, 'translateY(18px)'));
    lists.flat().forEach((el) => hide(el, `translateY(${distance}px)`));
    titles.forEach((el) => {
      touched.add(el);
      el.style.opacity = '0';
    });
    // read phase (trigger creation)
    for (const el of blocks) once(el, () => show([el], 0, dur * 0.8));
    // Items that enter in the same frame are revealed together, staggered (like ScrollTrigger.batch).
    let batch: HTMLElement[] = [];
    let flush = 0;
    // A horizontal swipe row (e.g. bright signature cards on phones) reveals as a whole when the row enters:
    // cards parked off-screen to the side would otherwise stay hidden until swiped into view.
    const horizontal = listEls.filter(({ l }) => l.scrollWidth > l.clientWidth + 1);
    for (const { l, items } of horizontal) once(l, () => show(items, reduced ? 0.03 : P.stagger));
    const inHorizontal = new Set(horizontal.flatMap(({ items }) => items));
    for (const item of lists.flat().filter((i) => !inHorizontal.has(i))) {
      once(item, () => {
        batch.push(item);
        if (!flush)
          flush = requestAnimationFrame(() => {
            show(batch, reduced ? 0.03 : P.stagger);
            batch = [];
            flush = 0;
          });
      });
    }
    cleanups.push(() => cancelAnimationFrame(flush));

    // Headings: split during idle time (never inside a scroll event), reveal parts with compositor transitions.
    const words = P.split === 'words';
    const splits = new Map<HTMLElement, { split: SplitText; parts: HTMLElement[]; revealed: boolean }>();
    const hidePart = words ? 'translateY(0.55em) rotate(7deg) scale(0.85)' : 'translateY(115%)';
    const prepare = (el: HTMLElement) => {
      if (splits.has(el) || reduced) return;
      const entry = { split: null as unknown as SplitText, parts: [] as HTMLElement[], revealed: false };
      entry.split = SplitText.create(el, {
        type: words ? 'words' : 'lines',
        mask: words ? undefined : 'lines',
        autoSplit: !words, // line breaks depend on width/fonts: re-split until it has played
        onSplit: (self: SplitText) => {
          if (entry.revealed) return;
          entry.parts = (words ? self.words : self.lines) as HTMLElement[];
          entry.parts.forEach((part) => {
            part.style.transformOrigin = '0% 100%';
            part.style.opacity = words ? '0' : '';
            part.style.transform = hidePart;
          });
          el.style.opacity = '1'; // the heading box is visible; its parts are hidden (masked / transparent)
        },
      });
      splits.set(el, entry);
    };
    const revealTitle = (el: HTMLElement) => {
      if (reduced) return show([el], 0);
      prepare(el);
      const entry = splits.get(el)!;
      // next frame: the hidden part styles must be committed before transitions start
      requestAnimationFrame(() => {
        entry.revealed = true;
        entry.parts.forEach((part, i) => {
          const delay = (i * (words ? P.stagger * 0.8 : P.stagger)).toFixed(3);
          part.style.transition = `opacity ${P.reveal}s ${ease} ${delay}s, transform ${P.reveal}s ${ease} ${delay}s`;
          part.style.opacity = '';
          part.style.transform = '';
        });
        const total = (P.reveal + entry.parts.length * P.stagger) * 1000 + 100;
        window.setTimeout(() => entry.split.revert(), total); // plain text again: reflows naturally afterwards
      });
    };
    for (const el of titles) once(el, () => revealTitle(el));
    cleanups.push(() => splits.forEach((e) => e.split.revert()));

    // Pre-split the remaining headings one per idle slice once the intro is done.
    if (!reduced) {
      const idle = (fn: () => void) => ('requestIdleCallback' in window ? window.requestIdleCallback(fn, { timeout: 500 }) : globalThis.setTimeout(fn, 50));
      let alive = true;
      cleanups.push(() => void (alive = false));
      introDone.then(() =>
        document.fonts.ready.then(() => {
          const queue = [...titles];
          const next = cs(() => {
            if (!alive) return;
            const el = queue.shift();
            if (!el) return;
            prepare(el);
            idle(next);
          });
          idle(next);
        }),
      );
    }

    // ── 4. Counters (prices in the Signature section).
    if (!reduced) {
      for (const el of $('[data-count]')) {
        const original = el.textContent ?? '';
        const nums = [...original.matchAll(/\d[\d,]*/g)].map((m) => Number(m[0].replace(/,/g, '')));
        if (!nums.length) continue;
        const render = (p: number) => {
          let i = 0;
          el.textContent = original.replace(/\d[\d,]*/g, () => INR.format(Math.round(nums[i++] * p)));
        };
        once(el, () => {
          const o = { p: 0 };
          gsap.to(o, { p: 1, duration: 1.2, ease: 'power3.out', onUpdate: () => render(o.p), onComplete: () => void (el.textContent = original) });
        });
        cleanups.push(() => void (el.textContent = original));
      }
    }

    if (reduced) return () => cleanups.forEach((f) => f());

    // ── 5. Parallax depth (transform only, scrubbed). Start states in one batched write, then the triggers.
    const layers = $('[data-parallax]').map((el) => {
      const section = el.closest('section') ?? el;
      const isHero = section.id === 'top';
      const travel = (Number(el.dataset.parallax) || 0) * P.parallax;
      const scale = Number(el.dataset.parallaxScale) || 1;
      return { el, section, isHero, travel, scale, from: { y: isHero ? 0 : -travel / 2, ...(scale !== 1 ? { scale } : {}) } as gsap.TweenVars };
    });
    gsap.set(
      layers.map((l) => l.el),
      { y: (i: number) => layers[i].from.y as number },
    );
    const scaled = layers.filter((l) => l.scale !== 1);
    if (scaled.length)
      gsap.set(
        scaled.map((l) => l.el),
        { scale: (i: number) => scaled[i].scale },
      );
    for (const { el, section, isHero, travel, scale, from } of layers) {
      const to: gsap.TweenVars = {
        immediateRender: false,
        y: isHero ? travel : travel / 2,
        ...(scale !== 1 ? { scale: 1 } : {}),
        ...(el.hasAttribute('data-parallax-fade') ? { opacity: 0.15 } : {}),
        ease: 'none',
        // scrub: true (direct). A numeric scrub restarts a catch-up tween on every scroll event — measurable on phones.
        scrollTrigger: { trigger: section, start: isHero ? 'top top' : 'top bottom', end: 'bottom top', scrub: true },
      };
      gsap.fromTo(el, from, to);
    }

    // ── 6. 3D tilt.
    // Perspective is added only while a card is tilting: setting it up front made every card a permanent 3D
    // compositor layer (Layerize time ×20 in the throttled-phone trace).
    const tilts = $('[data-tilt]');
    if (finePointer) {
      for (const el of tilts) {
        let rect: DOMRect | null = null;
        const rx = gsap.quickTo(el, 'rotationX', { duration: 0.5, ease: 'power3.out' });
        const ry = gsap.quickTo(el, 'rotationY', { duration: 0.5, ease: 'power3.out' });
        on(el, 'pointerenter', () => {
          rect = el.getBoundingClientRect(); // measure once, not per move
          gsap.set(el, { transformPerspective: 900 });
        });
        on(el, 'pointermove', (e) => {
          if (!rect) return;
          ry(((e.clientX - rect.left) / rect.width - 0.5) * 2 * P.tilt);
          rx(-((e.clientY - rect.top) / rect.height - 0.5) * 2 * P.tilt);
        });
        on(el, 'pointerleave', () => {
          rect = null;
          gsap.to(el, {
            rotationX: 0,
            rotationY: 0,
            duration: 0.6,
            ease: P.magnetReturn,
            overwrite: true,
            onComplete: () => gsap.set(el, { clearProps: 'transform' }),
          });
        });
      }
    } else if (tilts.length) {
      // Touch: cards lean with scroll velocity, only while on screen.
      const visible = new Set<Element>();
      const io = new IntersectionObserver((es) => es.forEach((e) => (e.isIntersecting ? visible.add(e.target) : visible.delete(e.target))));
      tilts.forEach((el) => io.observe(el));
      cleanups.push(() => io.disconnect());
      const setters = new Map<Element, (v: number) => void>();
      const setter = (el: Element) => {
        let s = setters.get(el);
        if (!s) {
          gsap.set(el, { transformPerspective: 900 });
          s = gsap.quickTo(el, 'rotationX', { duration: 0.6, ease: 'power3.out' });
          setters.set(el, s);
        }
        return s;
      };
      let last = 0;
      // One reusable timer (creating a delayedCall per scroll frame was per-frame garbage).
      const settle = gsap
        .delayedCall(0.14, () => {
          last = 0;
          visible.forEach((el) => setters.get(el)?.(0));
        })
        .pause();
      ScrollTrigger.create({
        start: 0,
        end: 'max',
        onUpdate: cs((self: ScrollTrigger) => {
          const a = Math.round(gsap.utils.clamp(-P.touchTilt, P.touchTilt, -self.getVelocity() / 260) * 4) / 4;
          if (a !== last) {
            // only when the angle actually changes (¼° steps): no per-frame style writes at steady speed
            last = a;
            visible.forEach((el) => setter(el)(a));
          }
          settle.restart(true);
        }),
      });
    }

    // ── 7. Magnetic CTAs (desktop).
    if (finePointer) {
      for (const el of $('[data-magnetic]')) {
        let rect: DOMRect | null = null;
        let xTo: (v: number) => void = () => {};
        let yTo: (v: number) => void = () => {};
        on(el, 'pointerenter', () => {
          rect = el.getBoundingClientRect();
          xTo = gsap.quickTo(el, 'x', { duration: 0.35, ease: 'power3.out' });
          yTo = gsap.quickTo(el, 'y', { duration: 0.35, ease: 'power3.out' });
        });
        on(el, 'pointermove', (e) => {
          if (!rect) return;
          xTo((e.clientX - (rect.left + rect.width / 2)) * P.magnet);
          yTo((e.clientY - (rect.top + rect.height / 2)) * P.magnet);
        });
        on(el, 'pointerleave', () => {
          rect = null;
          gsap.to(el, { x: 0, y: 0, duration: 0.9, ease: P.magnetReturn, overwrite: true });
        });
      }
    }

    // ── 8. Header: hide on scroll down, return on scroll up (always visible while the menu is open or focused).
    const header = root.querySelector<HTMLElement>('[data-header]');
    if (header) {
      let hidden = false;
      const set = (hide: boolean) => {
        if (hide === hidden) return;
        hidden = hide;
        gsap.to(header, { yPercent: hide ? -130 : 0, duration: hide ? 0.35 : 0.55, ease: hide ? 'power2.in' : 'power3.out', overwrite: true });
      };
      ScrollTrigger.create({
        start: 0,
        end: 'max',
        onUpdate: cs((self: ScrollTrigger) => {
          if (header.hasAttribute('data-menu-open')) return set(false);
          if (self.direction === 1 && self.scroll() > 240) set(true);
          else if (self.direction === -1) set(false);
        }),
      });
      on(header, 'focusin', () => set(false));
    }

    return () => cleanups.forEach((f) => f());
  }

  return <div ref={scope}>{children}</div>;
}

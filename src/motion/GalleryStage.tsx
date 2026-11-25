import { useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { gsap, useGSAP } from './gsap.ts';
import { Lightbox } from './Lightbox.tsx';
import { useMotion } from './MotionProvider.tsx';

/** Where each photo floats in the dark fly-through, as fractions of the viewport (x, y). */
const SPOTS: [number, number][] = [
  [-0.2, -0.04],
  [0.22, 0.06],
  [-0.24, 0.09],
  [0.2, -0.08],
  [-0.16, -0.1],
  [0.24, 0.04],
  [0, 0.02],
];

/**
 * Wraps a gallery's <ul>. Static markup stays the fallback (no JS / reduced motion).
 * With motion on, JS turns it into a pinned, scroll-driven sequence:
 *   fly   — photos hang at different depths and the camera flies through them (dark-premium)
 *   strip — a horizontal strip whose cards turn in perspective as they cross the centre
 * Tapping any photo (in every mode) opens the lightbox.
 */
export function GalleryStage({ images, children }: { images: { path: string; alt: string }[]; children: ReactNode }) {
  const { reduced, finePointer, profile: P } = useMotion();
  const stage = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState<{ index: number; origin: HTMLElement } | null>(null);

  useGSAP(
    (ctx) => {
      if (reduced) return;
      const el = stage.current!;
      try {
        return build(el);
      } catch (err) {
        console.error('[motion] gallery sequence disabled after an error:', err);
        delete el.dataset.stage;
        queueMicrotask(() => ctx.revert());
      }
    },
    { scope: stage, dependencies: [reduced, finePointer, P], revertOnUpdate: true },
  );

  function build(el: HTMLDivElement) {
    const ul = el.querySelector('ul');
    if (!ul) return;
    const items = gsap.utils.toArray<HTMLElement>(ul.children);
    // Read the viewport BEFORE switching the layout: reading after the switch forced a full-page layout mid-setup.
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    el.dataset.stage = P.gallery; // CSS re-lays the list out for the sequence
    const scrub = finePointer ? true : 0.5;

    if (P.gallery === 'fly') {
      const depth = 1000;
      items.forEach((li, i) => {
        const [fx, fy] = SPOTS[i % SPOTS.length];
        gsap.set(li, { xPercent: -50, yPercent: -50, x: fx * vw, y: fy * vh, z: -i * depth, force3D: true });
      });
      const travel = (items.length - 1) * depth + 700;
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: el,
          start: 'top top',
          end: () => `+=${items.length * window.innerHeight * 0.55}`,
          pin: true,
          scrub,
          refreshPriority: 1,
          anticipatePin: 1,
        },
      });
      tl.to(ul, { z: travel, duration: 1 }, 0);
      // Each photo fades as it passes the camera, so nothing smears across the screen. autoAlpha also sets
        // visibility:hidden at 0, so a photo that has flown past can't sit invisibly over the screen and swallow taps.
      items.forEach((li, i) => tl.to(li, { autoAlpha: 0, duration: 0.05 }, Math.min(0.95, (i * depth + 450) / travel)));
    } else {
      const dist = () => Math.max(0, ul.scrollWidth - el.clientWidth);
      if (dist() < 40) return () => void delete el.dataset.stage;
      const move = gsap.to(ul, {
        x: () => -dist(),
        ease: 'none',
        scrollTrigger: {
          trigger: el,
          start: 'center center',
          end: () => `+=${dist()}`,
          pin: true,
          scrub,
          invalidateOnRefresh: true,
          refreshPriority: 1,
          anticipatePin: 1,
        },
      });
      gsap.set(items, { transformPerspective: 1100 });
      for (const li of items) {
        gsap
          .timeline({
            defaults: { ease: 'none' },
            scrollTrigger: { trigger: li, containerAnimation: move, start: 'left right', end: 'right left', scrub: true },
          })
          .fromTo(li, { rotationY: -P.galleryTurn, scale: 0.9 }, { rotationY: 0, scale: 1, duration: 1 })
          .to(li, { rotationY: P.galleryTurn, scale: 0.9, duration: 1 });
      }
    }
    return () => void delete el.dataset.stage;
  }

  const onClick = (e: MouseEvent) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-gallery-index]');
    if (btn) setOpen({ index: Number(btn.dataset.galleryIndex), origin: btn });
  };

  return (
    <div ref={stage} onClick={onClick}>
      {children}
      {open && (
        <Lightbox
          images={images}
          index={open.index}
          origin={open.origin}
          onIndex={(index) => setOpen((o) => (o ? { ...o, index } : o))}
          onClose={() => setOpen(null)}
        />
      )}
    </div>
  );
}

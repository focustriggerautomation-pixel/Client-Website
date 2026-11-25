import { useEffect, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Img } from '../components/Img.tsx';
import { CloseIcon, ArrowIcon } from '../components/icons.tsx';
import { gsap } from './gsap.ts';
import { useMotion } from './MotionProvider.tsx';

interface Props {
  images: { path: string; alt: string }[];
  index: number;
  /** The thumbnail that was tapped: the photo grows out of it (FLIP, transform only). */
  origin: HTMLElement | null;
  onIndex: (i: number) => void;
  onClose: () => void;
}

/** Full-screen photo viewer: tap/arrows/swipe to move, Esc or ✕ to close. Pauses smooth scroll while open. */
export function Lightbox({ images, index, origin, onIndex, onClose }: Props) {
  const { reduced, profile: P, lenis } = useMotion();
  const root = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const first = useRef(true);
  const n = images.length;
  const go = (d: number) => onIndex((index + d + n) % n);

  // Lock page scroll, focus the dialog, restore focus on close.
  useEffect(() => {
    lenis?.stop();
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = 'hidden';
    closeBtn.current?.focus();
    return () => {
      lenis?.start();
      html.style.overflow = prev;
      origin?.focus({ preventScroll: true });
    };
  }, [lenis, origin]);

  // Open: grow from the thumbnail. Later photo changes: a quick crossfade.
  useLayoutEffect(() => {
    const el = frame.current!;
    const bg = root.current!.querySelector('[data-backdrop]')!;
    if (first.current) {
      first.current = false;
      gsap.from(bg, { opacity: 0, duration: reduced ? 0.2 : 0.4 });
      if (!reduced && origin) {
        const a = origin.getBoundingClientRect();
        const b = el.getBoundingClientRect();
        gsap.from(el, {
          x: a.left + a.width / 2 - (b.left + b.width / 2),
          y: a.top + a.height / 2 - (b.top + b.height / 2),
          scale: Math.max(0.1, a.width / b.width),
          duration: 0.6,
          ease: P.ease,
        });
      } else gsap.from(el, { opacity: 0, duration: 0.25 });
    } else {
      gsap.fromTo(el, { opacity: 0, x: reduced ? 0 : 12 }, { opacity: 1, x: 0, duration: 0.3, ease: 'power2.out' });
    }
  }, [index, origin, reduced, P.ease]);

  const close = () => {
    gsap.to(root.current, { opacity: 0, duration: 0.2, ease: 'power1.in', onComplete: onClose });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === 'Tab') {
        // keep focus inside the dialog
        const f = root.current!.querySelectorAll<HTMLElement>('button');
        const [a, b] = [f[0], f[f.length - 1]];
        if (e.shiftKey && document.activeElement === a) (e.preventDefault(), b.focus());
        else if (!e.shiftKey && document.activeElement === b) (e.preventDefault(), a.focus());
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // Swipe left/right on phones.
  const startX = useRef<number | null>(null);
  const img = images[index];

  return createPortal(
    <div
      ref={root}
      role="dialog"
      aria-modal="true"
      aria-label={`Photo ${index + 1} of ${n}`}
      data-lenis-prevent
      className="fixed inset-0 z-[90] grid place-items-center p-4 sm:p-10"
      onPointerDown={(e) => (startX.current = e.clientX)}
      onPointerUp={(e) => {
        if (startX.current === null) return;
        const dx = e.clientX - startX.current;
        startX.current = null;
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
      }}
    >
      <div data-backdrop className="absolute inset-0 bg-black/90" onClick={close} />
      <div ref={frame} className="relative max-h-full will-change-transform">
        <Img path={img.path} alt={img.alt} sizes="100vw" priority className="max-h-[82svh] w-auto max-w-[92vw] rounded-image object-contain" />
      </div>
      <p className="absolute bottom-5 left-1/2 -translate-x-1/2 font-body text-sm tabular-nums text-white/80">
        {index + 1} / {n}
      </p>
      <button
        ref={closeBtn}
        type="button"
        onClick={close}
        aria-label="Close photo"
        className="absolute right-3 top-3 grid size-12 place-items-center rounded-full bg-white/10 text-2xl text-white hover:bg-white/20"
      >
        <CloseIcon />
      </button>
      {n > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous photo"
            className="absolute left-3 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-xl text-white hover:bg-white/20"
          >
            <ArrowIcon className="rotate-180" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next photo"
            className="absolute right-3 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-xl text-white hover:bg-white/20"
          >
            <ArrowIcon />
          </button>
        </>
      )}
    </div>,
    document.body,
  );
}

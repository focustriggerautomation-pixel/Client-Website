import { useEffect, useState } from 'react';
import type { Mood } from '../config/schema.ts';
import { actionHref, actionLabel } from '../lib/content.ts';
import { useCafe } from '../theme/ThemeProvider.tsx';
import { WhatsAppIcon } from './icons.tsx';

const SHAPE: Record<Mood, string> = {
  'dark-premium': 'rounded-full ring-1 ring-white/15',
  'bright-cafe': 'rounded-full border-2 border-ink shadow-[3px_3px_0_var(--c-ink)]',
  'warm-restaurant': 'rounded-full shadow-[0_10px_25px_-8px_rgb(0_0_0/0.45)]',
};

/** Phones only: a WhatsApp shortcut within thumb reach, once the hero (which has its own buttons) is scrolled past. */
export function FloatingWhatsApp() {
  const { cafe, theme } = useCafe();
  const [show, setShow] = useState(false);
  useEffect(() => {
    let last: boolean | null = null;
    const onScroll = () => {
      const v = window.scrollY > window.innerHeight * 0.6;
      if (v !== last) setShow((last = v)); // only when it flips
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  if (!show) return null;
  return (
    <a
      href={actionHref(cafe, 'whatsapp')}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${actionLabel(cafe, theme.mood, 'whatsapp')} on WhatsApp`}
      className={`fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-30 grid size-14 place-items-center bg-[#25D366] text-[1.75rem] text-white md:hidden ${SHAPE[theme.mood]}`}
    >
      <WhatsAppIcon />
    </a>
  );
}

import type { ReactNode } from 'react';
import { sectionNumber } from '../lib/content.ts';
import { useCafe } from '../theme/ThemeProvider.tsx';
import { Ornament } from './Ornament.tsx';

/* Mood-specific section headings, shared by that mood's section variants. */

/** dark-premium: "02 —— MENU" kicker above an editorial serif title. */
export function DarkHeading({ id, sectionId, kicker, title, className = '' }: { id: string; sectionId: string; kicker: string; title: ReactNode; className?: string }) {
  const { cafe } = useCafe();
  return (
    <div className={className}>
      <p className="eyebrow flex items-center gap-4 text-primary">
        <span className="font-display text-step-1 normal-case italic tracking-normal">{sectionNumber(cafe, sectionId)}</span>
        <span aria-hidden className="h-px w-10 bg-primary/60" />
        {kicker}
      </p>
      <h2 id={id} className="display mt-6 text-step-5">
        {title}
      </h2>
    </div>
  );
}

/** bright-cafe: tilted sticker + chunky title. */
export function BrightHeading({ id, kicker, title, className = '', tone = 'accent' }: { id: string; kicker: string; title: ReactNode; className?: string; tone?: 'accent' | 'primary' }) {
  return (
    <div className={className}>
      <span
        className={`inline-block -rotate-2 rounded-button border-2 border-ink px-3.5 py-1 text-step-n1 font-bold shadow-[2px_2px_0_var(--c-ink)] ${tone === 'accent' ? 'bg-accent text-on-accent' : 'bg-primary text-on-primary'}`}
      >
        {kicker}
      </span>
      <h2 id={id} className="display mt-5 text-step-5">
        {title}
      </h2>
    </div>
  );
}

/** warm-restaurant: centred eyebrow, serif title, diamond ornament. */
export function WarmHeading({ id, kicker, title, className = '' }: { id: string; kicker: string; title: ReactNode; className?: string }) {
  return (
    <div className={`flex flex-col items-center text-center ${className}`}>
      <p className="eyebrow text-primary">{kicker}</p>
      <h2 id={id} className="display mt-4 text-step-5">
        {title}
      </h2>
      <Ornament className="mt-6" />
    </div>
  );
}

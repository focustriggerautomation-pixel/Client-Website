import { imageUrl } from '../config/registry.ts';
import { useCafe } from '../theme/ThemeProvider.tsx';

/** Logo image if the config has one, otherwise a text logo styled by mood. */
/** `compact` = header size. */
export function Logo({ className = '', compact = false }: { className?: string; compact?: boolean }) {
  const { cafe, theme, images } = useCafe();

  if (cafe.brand.logo) {
    const meta = images[cafe.brand.logo];
    return <img src={imageUrl(cafe.slug, cafe.brand.logo)} width={meta?.w} height={meta?.h} alt={cafe.name} className={`${compact ? 'h-9 sm:h-10' : 'h-12 sm:h-14'} w-auto ${className}`} />;
  }

  switch (theme.mood) {
    case 'dark-premium':
      return (
        <span className={`inline-flex items-baseline gap-2 font-display italic tracking-tight ${compact ? 'text-step-1' : 'text-step-3'} ${className}`}>
          {cafe.name}
          <span aria-hidden className="inline-block size-1.5 translate-y-[-0.2em] rounded-full bg-primary" />
        </span>
      );
    case 'bright-cafe':
      return (
        <span className={`inline-flex items-center gap-2.5 font-display font-extrabold tracking-tight ${compact ? 'text-step-1' : 'text-step-3'} ${className}`}>
          <span aria-hidden className="inline-block size-[0.85em] rounded-full border-2 border-ink bg-accent" />
          {cafe.name}
        </span>
      );
    case 'warm-restaurant':
      return (
        <span className={`inline-flex flex-col items-center leading-none ${className}`}>
          <span className={`font-display font-semibold italic ${compact ? 'text-step-1' : 'text-step-3'}`}>{cafe.name}</span>
          <span aria-hidden className="mt-1.5 flex items-center gap-1.5 text-primary">
            <span className="h-px w-6 bg-current" />
            <span className="size-1 rotate-45 bg-current" />
            <span className="h-px w-6 bg-current" />
          </span>
        </span>
      );
  }
}

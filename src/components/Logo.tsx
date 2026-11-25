import { imageUrl } from '../config/registry.ts';
import { useCafe } from '../theme/ThemeProvider.tsx';

/** Logo image if the config has one, otherwise a text logo styled by mood. */
export function Logo({ className = '' }: { className?: string }) {
  const { cafe, theme } = useCafe();

  if (cafe.brand.logo) {
    return <img src={imageUrl(cafe.slug, cafe.brand.logo)} alt={cafe.name} className={`h-10 w-auto sm:h-12 ${className}`} />;
  }

  switch (theme.mood) {
    case 'dark-premium':
      return (
        <span className={`inline-flex items-baseline gap-2 font-display text-step-1 italic tracking-tight ${className}`}>
          {cafe.name}
          <span aria-hidden className="inline-block size-1.5 translate-y-[-0.2em] rounded-full bg-primary" />
        </span>
      );
    case 'bright-cafe':
      return (
        <span className={`inline-flex items-center gap-2.5 font-display text-step-1 font-extrabold tracking-tight ${className}`}>
          <span aria-hidden className="inline-block size-[0.85em] rounded-full border-2 border-ink bg-accent" />
          {cafe.name}
        </span>
      );
    case 'warm-restaurant':
      return (
        <span className={`inline-flex flex-col items-center leading-none ${className}`}>
          <span className="font-display text-step-2 font-semibold italic">{cafe.name}</span>
          <span aria-hidden className="mt-1.5 flex items-center gap-1.5 text-primary">
            <span className="h-px w-6 bg-current" />
            <span className="size-1 rotate-45 bg-current" />
            <span className="h-px w-6 bg-current" />
          </span>
        </span>
      );
  }
}

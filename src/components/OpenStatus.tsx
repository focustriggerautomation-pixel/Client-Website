import { openStatus } from '../lib/hours.ts';
import { useNow } from '../lib/useNow.ts';
import { useHydrated } from '../lib/useHydrated.ts';
import { useCafe } from '../theme/ThemeProvider.tsx';

/** "● Open now · until 11 pm", computed in the visitor's local time. Styling via className. */
export function OpenStatus({ className = '', dotClassName = '' }: { className?: string; dotClassName?: string }) {
  const { cafe } = useCafe();
  const now = useNow();
  if (!useHydrated()) {
    // Prerender (and hydrating it): "open now" depends on the visitor's moment, not the build's. Reserve the space, fill on mount.
    return (
      <p aria-hidden className={`invisible inline-flex items-center gap-2 ${className}`}>
        Open now · until 11 pm
      </p>
    );
  }
  const s = openStatus(cafe.hours, now, cafe.timezone);
  return (
    <p className={`inline-flex items-center gap-2 ${className}`}>
      <span aria-hidden className={`inline-block size-2 shrink-0 rounded-full ${s.open ? 'bg-[#2FA84F]' : 'bg-[#C2412D]'} ${dotClassName}`} />
      <span>
        <strong className="font-semibold">{s.headline}</strong>
        {s.detail && <span> · {s.detail}</span>}
      </span>
    </p>
  );
}

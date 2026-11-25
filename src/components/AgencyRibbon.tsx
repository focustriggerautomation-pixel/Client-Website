import { useCafe } from '../theme/ThemeProvider.tsx';

/** Small "Concept by …" credit, placed in the footer. Renders nothing without agencyCredit. */
export function AgencyRibbon({ className = '' }: { className?: string }) {
  const { cafe } = useCafe();
  if (!cafe.agencyCredit) return null;
  return (
    <a
      href={cafe.agencyCredit.url}
      target="_blank"
      rel="noopener"
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-body text-[11px] leading-none tracking-wide transition-opacity hover:opacity-100 ${className}`}
    >
      Concept by <span className="font-semibold">{cafe.agencyCredit.name}</span>
    </a>
  );
}

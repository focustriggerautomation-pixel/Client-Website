import { useCafe } from '../theme/ThemeProvider.tsx';

/** Small, unobtrusive "Concept by …" credit pinned to the bottom corner. */
export function AgencyRibbon() {
  const { cafe } = useCafe();
  if (!cafe.agencyCredit) return null;
  return (
    <a
      href={cafe.agencyCredit.url}
      target="_blank"
      rel="noopener"
      className="fixed bottom-3 right-3 z-50 rounded-full border border-line bg-bg/85 px-3 py-1.5 font-body text-[11px] leading-none tracking-wide text-muted shadow-sm backdrop-blur transition-colors hover:text-ink"
    >
      Concept by <span className="font-semibold text-ink">{cafe.agencyCredit.name}</span>
    </a>
  );
}

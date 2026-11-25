import { dietOf } from '../lib/content.ts';

/** The Indian veg (green) / non-veg (brown) square mark. */
export function DietMark({ tag, className = '' }: { tag?: string; className?: string }) {
  const diet = dietOf(tag);
  if (!diet) return null;
  const color = diet === 'nonveg' ? '#8B2C17' : '#1E7B34';
  const label = diet === 'nonveg' ? 'Non-vegetarian' : diet === 'vegan' ? 'Vegan' : 'Vegetarian';
  return (
    <span role="img" aria-label={label} title={label} className={`inline-grid size-[0.95em] shrink-0 place-items-center border-[1.5px] bg-white ${className}`} style={{ borderColor: color }}>
      {diet === 'nonveg' ? (
        <span className="size-0 border-x-[0.24em] border-b-[0.42em] border-x-transparent" style={{ borderBottomColor: color }} />
      ) : (
        <span className="size-[0.45em] rounded-full" style={{ background: color }} />
      )}
    </span>
  );
}

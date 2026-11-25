import { SECTION_IDS, headingFor } from '../../lib/content.ts';
import { useCafe } from '../../theme/ThemeProvider.tsx';
import { byMood } from '../byMood.tsx';
import { QuoteIcon } from '../icons.tsx';
import { BrightHeading, DarkHeading, WarmHeading } from '../kit.tsx';

/* Only rendered when config.reviews exists. Reviews are shown verbatim — no ratings or stars are invented. */

function ReviewsDark() {
  const { cafe } = useCafe();
  const h = headingFor(useCafe().cafe, 'reviews', { kicker: 'Reviews', title: 'Kind words' });
  if (!cafe.reviews) return null;
  const [lead, ...rest] = cafe.reviews;
  return (
    <section id={SECTION_IDS.reviews} aria-labelledby="reviews-title" className="section-y border-t border-line bg-bg text-ink">
      <div className="container-x">
        <DarkHeading id="reviews-title" sectionId={SECTION_IDS.reviews} kicker={h.kicker} title={h.title} />
        <figure data-anim="fade" className="mt-14 max-w-5xl sm:mt-20">
          <blockquote className="display text-step-4 leading-[1.15]">“{lead.text}”</blockquote>
          <figcaption className="eyebrow mt-8 text-muted">
            <span className="text-primary">{lead.author}</span> · {lead.source}
          </figcaption>
        </figure>
        {rest.length > 0 && (
          <div data-anim="stagger" className="mt-16 grid gap-12 border-t border-line pt-12 md:grid-cols-2 lg:grid-cols-3">
            {rest.map((r, i) => (
              <figure key={i}>
                <blockquote className="font-display text-step-1 italic leading-snug">“{r.text}”</blockquote>
                <figcaption className="eyebrow mt-5 text-muted">
                  <span className="text-primary">{r.author}</span> · {r.source}
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function ReviewsBright() {
  const { cafe } = useCafe();
  const h = headingFor(useCafe().cafe, 'reviews', { kicker: 'Reviews', title: 'People say nice things' });
  if (!cafe.reviews) return null;
  const tones = ['bg-accent/40', 'bg-primary/15', 'bg-surface'];
  return (
    <section id={SECTION_IDS.reviews} aria-labelledby="reviews-title" className="section-y bg-bg text-ink">
      <div className="container-x">
        <BrightHeading id="reviews-title" kicker={h.kicker} title={h.title} />
        <ul data-anim="stagger" className="mt-10 grid gap-8 md:grid-cols-2 lg:grid-cols-3 md:max-lg:[&>li:last-child:nth-child(odd)]:col-span-2">
          {cafe.reviews.map((r, i) => (
            <li key={i}>
              <figure>
                <blockquote className={`relative rounded-lg border-2 border-ink p-6 text-step-1 leading-snug shadow-[4px_4px_0_var(--c-ink)] ${tones[i % 3]}`}>
                  <p>“{r.text}”</p>
                  <span aria-hidden className="absolute -bottom-[11px] left-8 size-5 rotate-45 border-b-2 border-r-2 border-ink bg-bg" />
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3 pl-3">
                  <span aria-hidden className="grid size-10 place-items-center rounded-full border-2 border-ink bg-accent font-bold text-on-accent">
                    {r.author.charAt(0)}
                  </span>
                  <span>
                    <span className="block font-bold">{r.author}</span>
                    <span className="block text-step-n1 text-muted">via {r.source}</span>
                  </span>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function ReviewsWarm() {
  const { cafe } = useCafe();
  const h = headingFor(useCafe().cafe, 'reviews', { kicker: 'Reviews', title: 'What our guests say' });
  if (!cafe.reviews) return null;
  return (
    <section id={SECTION_IDS.reviews} aria-labelledby="reviews-title" className="paper section-y bg-bg text-ink">
      <div className="container-x">
        <WarmHeading id="reviews-title" kicker={h.kicker} title={h.title} />
        <ul data-anim="stagger" className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3 md:max-lg:[&>li:last-child:nth-child(odd)]:col-span-2">
          {cafe.reviews.map((r, i) => (
            <li key={i} className="rounded-lg border border-line bg-surface p-7 text-center sm:p-9">
              <figure className="flex h-full flex-col items-center">
                <QuoteIcon className="text-step-3 text-primary/70" />
                <blockquote className="mt-5 font-display text-step-1 italic leading-relaxed">{r.text}</blockquote>
                <figcaption className="mt-auto pt-6">
                  <span className="block font-semibold">{r.author}</span>
                  <span className="block text-step-n1 text-muted">{r.source}</span>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export const Reviews = byMood('Reviews', { 'dark-premium': ReviewsDark, 'bright-cafe': ReviewsBright, 'warm-restaurant': ReviewsWarm });

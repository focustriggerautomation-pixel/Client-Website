import { formatPrice, SECTION_IDS, signatureItems, headingFor } from '../../lib/content.ts';
import { useCafe } from '../../theme/ThemeProvider.tsx';
import { byMood } from '../byMood.tsx';
import { Img } from '../Img.tsx';
import { BrightHeading, DarkHeading, WarmHeading } from '../kit.tsx';
import { DietMark } from '../MenuBits.tsx';

/** Shared data: items tagged "Bestseller" / "Signature". Variants render nothing if there are none. */
function useSignatures() {
  const { cafe } = useCafe();
  return signatureItems(cafe).map(({ item, category }) => ({ item, category, price: formatPrice(item.price, cafe.menu.currency) }));
}

/** Alternating asymmetric rows, numbered like a menu card. */
function SignatureDark() {
  const items = useSignatures();
  const h = headingFor(useCafe().cafe, 'signatures', { kicker: 'Signatures', title: 'What we’re known for' });
  if (!items.length) return null;
  return (
    <section id={SECTION_IDS.signatures} aria-labelledby="signatures-title" className="section-y border-t border-line bg-bg text-ink">
      <div className="container-x">
        <DarkHeading id="signatures-title" sectionId={SECTION_IDS.signatures} kicker={h.kicker} title={h.title} />
        <ol data-anim="stagger" className="mt-16 space-y-20 sm:mt-24 lg:space-y-32">
          {items.map(({ item, category, price }, i) => {
            const flip = i % 2 === 1;
            return (
              <li key={item.name} className="grid items-center gap-8 lg:grid-cols-12 lg:gap-12">
                <div data-tilt className={`lg:row-start-1 ${flip ? 'lg:col-span-6 lg:col-start-7' : 'lg:col-span-7 lg:col-start-1'}`}>
                  {item.image ? (
                    <Img path={item.image} alt={item.name} sizes="(min-width: 1024px) 55vw, 100vw" className="aspect-[4/3] w-full rounded-image object-cover" />
                  ) : (
                    <div aria-hidden className="grid aspect-[4/3] place-items-center rounded-image border border-line bg-surface p-8">
                      {/* ghost lettering is decoration: drawn by CSS so it isn't read or audited as text */}
                      <span data-label={item.name} className="display text-center text-step-6 text-primary/30 before:content-[attr(data-label)]" />
                    </div>
                  )}
                </div>
                <div className={`lg:row-start-1 ${flip ? 'lg:col-span-5 lg:col-start-1 lg:text-right' : 'lg:col-span-4 lg:col-start-9'}`}>
                  <p className="font-display text-step-3 italic text-primary/80">No. {i + 1}</p>
                  <h3 className="display mt-3 text-step-4">{item.name}</h3>
                  <p className="eyebrow mt-4 text-muted">
                    {category}
                    {item.tag && <span className="text-primary"> · {item.tag}</span>}
                  </p>
                  {item.description && <p className={`mt-5 max-w-[40ch] text-muted ${flip ? 'lg:ml-auto' : ''}`}>{item.description}</p>}
                  <p data-count className="mt-6 font-display text-step-2 tabular-nums text-primary">{price}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

/** Big colourful cards: swipeable row on phones, grid on larger screens. */
function SignatureBright() {
  const items = useSignatures();
  const h = headingFor(useCafe().cafe, 'signatures', { kicker: 'Bestsellers', title: 'Crowd favourites' });
  if (!items.length) return null;
  const tones = ['bg-primary text-on-primary', 'bg-accent text-on-accent', 'bg-ink text-bg'];
  const tilt = ['-rotate-1', 'rotate-1', '-rotate-[0.5deg]'];
  return (
    <section id={SECTION_IDS.signatures} aria-labelledby="signatures-title" className="section-y overflow-hidden bg-bg text-ink">
      <div className="container-x">
        <BrightHeading id="signatures-title" kicker={h.kicker} title={h.title} />
        <ul data-anim="stagger" className="bleed-x no-scrollbar mt-10 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-6 pt-3 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3 lg:gap-8 sm:max-lg:[&>li:last-child:nth-child(odd)]:col-span-2 sm:max-lg:[&>li:last-child:nth-child(odd)]:mx-auto sm:max-lg:[&>li:last-child:nth-child(odd)]:w-[calc(50%-0.625rem)]">
          {items.map(({ item, price }, i) => (
            <li
              key={item.name}
              data-tilt
              className={`relative w-[80%] shrink-0 snap-center rounded-lg border-2 border-ink p-3 shadow-[5px_5px_0_var(--c-ink)] sm:w-auto ${tones[i % 3]} ${tilt[i % 3]}`}
            >
              {item.image ? (
                <Img path={item.image} alt={item.name} sizes="(min-width: 1024px) 26rem, (min-width: 640px) 45vw, 80vw" className="aspect-square w-full rounded-md border-2 border-ink object-cover" />
              ) : (
                <p aria-hidden className="px-2 pt-3 font-display text-step-5 font-extrabold leading-none opacity-30 tabular-nums">
                  {String(i + 1).padStart(2, '0')}
                </p>
              )}
              <div className={`px-2 pb-3 ${item.image ? 'pt-5' : 'pt-10 sm:pt-16'}`}>
                <div className="flex items-start justify-between gap-3">
                  <h3 className={`display ${item.image ? 'text-step-2' : 'text-step-3'}`}>{item.name}</h3>
                  <span data-count className="shrink-0 rotate-3 rounded-button border-2 border-ink bg-bg px-3 py-1 font-bold tabular-nums text-ink">{price}</span>
                </div>
                {item.description && <p className="mt-3">{item.description}</p>}
                {item.tag && (
                  <p className="mt-4 inline-flex items-center gap-1.5 text-step-n1 font-bold uppercase tracking-wide">
                    <DietMark tag={item.tag} />★ {item.tag}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** "House specialties" on arched photo cards. */
function SignatureWarm() {
  const items = useSignatures();
  const h = headingFor(useCafe().cafe, 'signatures', { kicker: 'Chef’s choice', title: 'House specialties' });
  if (!items.length) return null;
  return (
    <section id={SECTION_IDS.signatures} aria-labelledby="signatures-title" className="paper section-y bg-bg text-ink">
      <div className="container-x">
        <WarmHeading id="signatures-title" kicker={h.kicker} title={h.title} />
        <ul data-anim="stagger" className={`mx-auto mt-14 grid gap-x-8 gap-y-14 sm:grid-cols-2 sm:max-lg:[&>li:last-child:nth-child(odd)]:col-span-2 ${items.length >= 3 ? 'lg:grid-cols-3' : 'max-w-4xl'}`}>
          {items.map(({ item, category, price }) => (
            <li key={item.name} className="flex flex-col items-center text-center">
              {item.image ? (
                <Img path={item.image} alt={item.name} sizes="(min-width: 1024px) 22rem, (min-width: 640px) 45vw, 90vw" data-tilt className="aspect-[4/3] w-full max-w-sm rounded-t-full rounded-b-image object-cover sm:aspect-[4/5]" />
              ) : (
                <div aria-hidden className="grid aspect-[4/3] w-full max-w-sm place-items-center rounded-t-full rounded-b-image bg-primary/10 sm:aspect-[4/5]">
                  <span className="display text-step-7 text-primary/40">{item.name.charAt(0)}</span>
                </div>
              )}
              <p className="eyebrow mt-6 text-primary">{category}</p>
              <h3 className="display mt-2 inline-flex items-center gap-2 text-step-3">
                <DietMark tag={item.tag} className="text-step-0" />
                {item.name}
              </h3>
              {item.description && <p className="mt-3 max-w-[36ch] text-muted">{item.description}</p>}
              <p data-count className="mt-4 rounded-button border border-primary/40 px-4 py-1.5 font-semibold tabular-nums text-primary">{price}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export const Signature = byMood('Signature', { 'dark-premium': SignatureDark, 'bright-cafe': SignatureBright, 'warm-restaurant': SignatureWarm });

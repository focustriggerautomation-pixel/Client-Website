import { useId, useRef, useState, type KeyboardEvent } from 'react';
import { formatPrice, SECTION_IDS, type MenuItem } from '../../lib/content.ts';
import { useCafe } from '../../theme/ThemeProvider.tsx';
import { ActionLink } from '../ActionLink.tsx';
import { byMood } from '../byMood.tsx';
import { Img } from '../Img.tsx';
import { BrightHeading, DarkHeading, WarmHeading } from '../kit.tsx';
import { DietMark } from '../MenuBits.tsx';

const usePrice = () => {
  const { cafe } = useCafe();
  return (item: MenuItem) => formatPrice(item.price, cafe.menu.currency);
};

/** An elegant typographic list: name, dotted leader, price. No photos. */
function MenuDark() {
  const { cafe } = useCafe();
  const price = usePrice();
  return (
    <section id={SECTION_IDS.menu} aria-labelledby="menu-title" className="section-y border-t border-line bg-bg text-ink">
      <div className="container-x">
        <DarkHeading id="menu-title" sectionId={SECTION_IDS.menu} kicker="Menu" title="The menu" />
        <div className="mt-14 grid gap-x-20 gap-y-16 sm:mt-20 lg:grid-cols-2">
          {cafe.menu.categories.map((cat) => (
            <div key={cat.name}>
              <h3 className="flex items-baseline justify-between gap-4 border-b border-primary/40 pb-4">
                <span className="font-display text-step-3 italic">{cat.name}</span>
                <span className="eyebrow text-muted">{String(cat.items.length).padStart(2, '0')}</span>
              </h3>
              {cat.description && <p className="mt-4 text-step-n1 text-muted">{cat.description}</p>}
              <ul className="mt-2">
                {cat.items.map((item) => (
                  <li key={item.name} className="border-b border-line py-5 last:border-0">
                    <div className="flex items-baseline gap-3">
                      <h4 className="min-w-0 font-display text-step-2 leading-tight">{item.name}</h4>
                      <span aria-hidden className="min-w-6 flex-1 -translate-y-[0.25em] border-b border-dotted border-muted/60" />
                      <span className="shrink-0 font-display text-step-1 tabular-nums text-primary">{price(item)}</span>
                    </div>
                    {(item.description || item.tag) && (
                      <p className="mt-2 max-w-[52ch] text-step-n1 text-muted">
                        {item.tag && <span className="eyebrow mr-3 text-[0.68rem] text-primary">{item.tag}</span>}
                        {item.description}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Card grid with item photos and sticker tags; jump-chips for categories. */
function MenuBright() {
  const { cafe } = useCafe();
  const price = usePrice();
  const slug = (s: string) => `menu-${s.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  return (
    <section id={SECTION_IDS.menu} aria-labelledby="menu-title" className="section-y bg-bg text-ink">
      <div className="container-x">
        <BrightHeading id="menu-title" kicker="Menu" title="What’s good today" />
        {cafe.menu.categories.length > 1 && (
          <nav aria-label="Menu categories" className="bleed-x no-scrollbar mt-8 flex gap-2.5 overflow-x-auto pb-2">
            {cafe.menu.categories.map((cat) => (
              <a key={cat.name} href={`#${slug(cat.name)}`} className="shrink-0 rounded-button border-2 border-ink bg-bg px-4 py-2 text-step-n1 font-bold hover:bg-accent hover:text-on-accent">
                {cat.name}
              </a>
            ))}
          </nav>
        )}

        {cafe.menu.categories.map((cat, ci) => (
          <div key={cat.name} id={slug(cat.name)} className="mt-14 first-of-type:mt-10">
            <h3 className="display flex items-center gap-3 text-step-3">
              <span aria-hidden className={`inline-block size-4 rounded-full border-2 border-ink ${ci % 2 ? 'bg-primary' : 'bg-accent'}`} />
              {cat.name}
            </h3>
            {cat.description && <p className="mt-2 text-muted">{cat.description}</p>}
            <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-7">
              {cat.items.map((item, i) => (
                <li key={item.name} className="relative flex rounded-lg border-2 border-ink bg-bg shadow-[4px_4px_0_var(--c-ink)] sm:flex-col">
                  <div className="w-28 shrink-0 overflow-hidden rounded-l-[calc(var(--r-lg)-2px)] border-r-2 border-ink sm:w-auto sm:rounded-none sm:rounded-t-[calc(var(--r-lg)-2px)] sm:border-b-2 sm:border-r-0">
                    {item.image ? (
                      <Img path={item.image} alt={item.name} sizes="(min-width: 1024px) 24rem, (min-width: 640px) 45vw, 7rem" className="h-full w-full object-cover sm:aspect-[4/3] sm:h-auto" />
                    ) : (
                      <div aria-hidden className={`grid h-full min-h-28 place-items-center sm:aspect-[4/3] sm:h-auto ${(ci + i) % 2 ? 'bg-primary/20' : 'bg-accent/40'}`}>
                        <span className="display text-step-5 opacity-80">{item.name.charAt(0)}</span>
                      </div>
                    )}
                  </div>
                  {item.tag && (
                    <span className="absolute -top-3 right-3 inline-flex rotate-3 items-center gap-1.5 rounded-button border-2 border-ink bg-accent px-2.5 py-0.5 text-xs font-bold text-on-accent shadow-[2px_2px_0_var(--c-ink)]">
                      <DietMark tag={item.tag} />
                      {item.tag}
                    </span>
                  )}
                  <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h4 className="font-display text-step-1 font-bold leading-tight">{item.name}</h4>
                      <span className="shrink-0 rounded-button bg-ink px-2.5 py-0.5 text-step-n1 font-bold text-bg">{price(item)}</span>
                    </div>
                    {item.description && <p className="mt-2 text-step-n1 text-muted">{item.description}</p>}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

/** Tabbed categories (accessible tabs with arrow keys) + prominent reserve / order buttons. */
function MenuWarm() {
  const { cafe } = useCafe();
  const price = usePrice();
  const cats = cafe.menu.categories;
  const [active, setActive] = useState(0);
  const uid = useId();
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const cat = cats[active];

  const onKey = (e: KeyboardEvent) => {
    const delta = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    const to = e.key === 'Home' ? 0 : e.key === 'End' ? cats.length - 1 : delta ? (active + delta + cats.length) % cats.length : -1;
    if (to < 0) return;
    e.preventDefault();
    setActive(to);
    tabs.current[to]?.focus();
  };

  return (
    <section id={SECTION_IDS.menu} aria-labelledby="menu-title" className="section-y bg-surface text-ink">
      <div className="container-x">
        <WarmHeading id="menu-title" kicker="Menu" title="Our menu" />

        <div role="tablist" aria-label="Menu categories" className="bleed-x no-scrollbar mt-10 flex gap-2 overflow-x-auto pb-1 md:justify-center" onKeyDown={onKey}>
          {cats.map((c, i) => (
            <button
              key={c.name}
              ref={(el) => {
                tabs.current[i] = el;
              }}
              role="tab"
              type="button"
              id={`${uid}-tab-${i}`}
              aria-selected={i === active}
              aria-controls={`${uid}-panel`}
              tabIndex={i === active ? 0 : -1}
              onClick={() => setActive(i)}
              className={`shrink-0 rounded-button border px-5 py-2.5 font-semibold transition-colors ${
                i === active ? 'border-primary bg-primary text-on-primary' : 'border-line bg-bg text-ink hover:border-primary hover:text-primary'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        <div role="tabpanel" id={`${uid}-panel`} aria-labelledby={`${uid}-tab-${active}`} tabIndex={0} className="mt-8 rounded-lg border border-line bg-bg p-5 sm:p-10">
          {cat.description && <p className="mb-8 text-center text-muted">{cat.description}</p>}
          <ul className="grid gap-x-14 gap-y-8 lg:grid-cols-2">
            {cat.items.map((item) => (
              <li key={item.name} className="flex gap-4">
                {item.image && <Img path={item.image} alt={item.name} sizes="6rem" className="size-14 shrink-0 rounded-full object-cover sm:size-24" />}
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <DietMark tag={item.tag} className="translate-y-[0.1em] text-step-n1" />
                    <h3 className="min-w-0 font-display text-step-1 font-semibold leading-snug">{item.name}</h3>
                    <span aria-hidden className="min-w-4 flex-1 -translate-y-[0.25em] border-b border-dotted border-muted/60" />
                    <span className="shrink-0 font-semibold tabular-nums text-primary">{price(item)}</span>
                  </div>
                  {item.description && <p className="mt-1.5 text-step-n1 text-muted">{item.description}</p>}
                  {item.tag && (
                    <span className="mt-2 inline-block rounded-sm bg-accent/20 px-2 py-0.5 text-[0.7rem] font-bold uppercase tracking-wider text-ink">{item.tag}</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
          <ActionLink action="call" className="inline-flex rounded-button bg-primary px-7 py-4 font-semibold text-on-primary hover:brightness-110" />
          <ActionLink action="whatsapp" className="inline-flex rounded-button border-2 border-primary px-7 py-[0.875rem] font-semibold text-primary hover:bg-primary hover:text-on-primary" />
        </div>
      </div>
    </section>
  );
}

export const Menu = byMood('Menu', { 'dark-premium': MenuDark, 'bright-cafe': MenuBright, 'warm-restaurant': MenuWarm });

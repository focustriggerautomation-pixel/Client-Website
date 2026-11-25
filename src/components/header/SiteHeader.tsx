import { useEffect, useState } from 'react';
import type { Mood } from '../../config/schema.ts';
import { actionsInOrder, navItems, SECTION_IDS } from '../../lib/content.ts';
import { useCafe } from '../../theme/ThemeProvider.tsx';
import { ActionLink } from '../ActionLink.tsx';
import { CloseIcon, MenuIcon } from '../icons.tsx';
import { Logo } from '../Logo.tsx';

interface HeaderStyle {
  /** Outer <header>, given whether the page has scrolled. */
  shell: (scrolled: boolean) => string;
  bar: string;
  link: string;
  cta: string;
  toggle: string;
  panel: string;
  panelLink: string;
  panelAction: string;
}

/** Same structure and behaviour for every mood; the look is mood-specific. */
const STYLES: Record<Mood, HeaderStyle> = {
  'dark-premium': {
    shell: (s) => `transition-[background-color,border-color] duration-300 border-b ${s ? 'bg-bg/90 backdrop-blur-md border-line' : 'bg-transparent border-transparent'}`,
    bar: 'container-x flex h-16 items-center justify-between gap-6 md:h-20',
    link: 'eyebrow text-muted hover:text-ink transition-colors',
    cta: 'eyebrow rounded-button border border-primary px-5 py-3 text-primary hover:bg-primary hover:text-on-primary',
    toggle: 'grid size-11 place-items-center text-2xl text-ink',
    panel: 'bg-bg',
    panelLink: 'display text-step-4 block py-2',
    panelAction: 'eyebrow inline-flex w-full rounded-button border border-primary px-5 py-4 text-primary first:bg-primary first:text-on-primary',
  },
  'bright-cafe': {
    shell: () => 'px-3 pt-3',
    bar: 'mx-auto flex h-16 max-w-[var(--container)] items-center justify-between gap-4 rounded-button border-2 border-ink bg-bg pl-5 pr-2 shadow-[3px_3px_0_var(--c-ink)]',
    link: 'rounded-button px-3 py-2 font-bold text-step-n1 hover:bg-accent hover:text-on-accent transition-colors',
    cta: 'rounded-button border-2 border-ink bg-primary px-5 py-2.5 text-step-n1 font-bold text-on-primary',
    toggle: 'grid size-11 place-items-center rounded-full border-2 border-ink bg-accent text-xl text-on-accent',
    panel: 'bg-bg',
    panelLink: 'display text-step-4 block py-1.5',
    panelAction: 'inline-flex w-full rounded-button border-2 border-ink px-5 py-4 font-bold shadow-[3px_3px_0_var(--c-ink)] first:bg-primary first:text-on-primary',
  },
  'warm-restaurant': {
    shell: (s) => `bg-bg/95 backdrop-blur border-b border-line transition-shadow ${s ? 'shadow-[0_8px_30px_-20px_rgb(var(--rgb-ink))]' : ''}`,
    bar: 'container-x flex h-[4.5rem] items-center justify-between gap-6 md:h-20',
    link: 'font-semibold text-muted hover:text-primary transition-colors',
    cta: 'rounded-button bg-primary px-5 py-3 font-semibold text-on-primary hover:brightness-110',
    toggle: 'grid size-11 place-items-center rounded-button border border-line text-2xl text-ink',
    panel: 'paper bg-bg',
    panelLink: 'display text-step-4 block py-2',
    panelAction: 'inline-flex w-full rounded-button border border-primary px-5 py-4 font-semibold text-primary first:bg-primary first:text-on-primary',
  },
};

export function SiteHeader() {
  const { cafe, theme } = useCafe();
  const s = STYLES[theme.mood];
  const nav = navItems(cafe);
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    const onResize = () => window.innerWidth >= 1024 && setOpen(false);
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <>
    <header className={`fixed inset-x-0 top-0 z-40 ${s.shell(scrolled || open)}`}>
      <div className={s.bar}>
        <a href={`#${SECTION_IDS.top}`} onClick={close} aria-label={`${cafe.name}, back to top`} className="shrink-0">
          <Logo compact />
        </a>

        <nav aria-label="Main" className="hidden items-center gap-2 lg:flex xl:gap-5">
          {nav.map((n) => (
            <a key={n.id} href={`#${n.id}`} className={s.link}>
              {n.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ActionLink action={cafe.cta.action} className={`hidden sm:inline-flex ${s.cta}`} />
          <button
            type="button"
            className={`lg:hidden ${s.toggle}`}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>
    </header>

    {/* Sibling of <header>: its backdrop-filter would otherwise trap this fixed panel inside the bar. */}
    {open && (
        <div id="mobile-menu" className={`fixed inset-0 z-30 overflow-y-auto pt-20 lg:hidden ${s.panel}`}>
          <nav aria-label="Mobile" className="container-x flex min-h-full flex-col pb-10 pt-6">
            <ul>
              {nav.map((n) => (
                <li key={n.id} className="border-b border-line">
                  <a href={`#${n.id}`} onClick={close} className={s.panelLink}>
                    {n.label}
                  </a>
                </li>
              ))}
            </ul>
            <div className="mt-auto flex flex-col gap-3 pt-10">
              {actionsInOrder(cafe).map((a) => (
                <ActionLink key={a} action={a} className={s.panelAction} />
              ))}
            </div>
          </nav>
        </div>
      )}
    </>
  );
}

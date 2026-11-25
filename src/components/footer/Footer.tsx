import { displayPhone, telHref } from '../../lib/cta.ts';
import { actionHref, instagramUrl, navItems } from '../../lib/content.ts';
import { useCafe } from '../../theme/ThemeProvider.tsx';
import { AgencyRibbon } from '../AgencyRibbon.tsx';
import { byMood } from '../byMood.tsx';
import { InstagramIcon, PhoneIcon, PinIcon, WhatsAppIcon } from '../icons.tsx';
import { Logo } from '../Logo.tsx';

/** Shared footer data. Bottom padding leaves room for the floating WhatsApp button on phones. */
function useFooter() {
  const { cafe } = useCafe();
  return {
    cafe,
    year: new Date().getFullYear(),
    links: [
      { key: 'ig', href: instagramUrl(cafe.contact.instagram), label: `@${cafe.contact.instagram}`, Icon: InstagramIcon, external: true },
      { key: 'tel', href: telHref(cafe.contact.phone), label: displayPhone(cafe.contact.phone), Icon: PhoneIcon, external: false },
      { key: 'wa', href: actionHref(cafe, 'whatsapp'), label: 'WhatsApp', Icon: WhatsAppIcon, external: true },
      { key: 'map', href: actionHref(cafe, 'maps'), label: cafe.contact.address, Icon: PinIcon, external: true },
    ],
  };
}
const ext = (external: boolean) => (external ? { target: '_blank', rel: 'noopener noreferrer' } : {});

function FooterDark() {
  const { cafe, year, links } = useFooter();
  return (
    <footer className="border-t border-line bg-bg pb-24 pt-16 text-ink md:pb-12">
      <div data-anim="stagger" className="container-x grid gap-12 md:grid-cols-12">
        <div className="md:col-span-5">
          <Logo />
          <p className="mt-4 max-w-[30ch] text-muted">{cafe.tagline}</p>
        </div>
        <nav aria-label="Footer" className="md:col-span-3">
          <p className="eyebrow text-primary">Explore</p>
          <ul className="mt-5 space-y-3">
            {navItems(cafe).map((n) => (
              <li key={n.id}>
                <a href={`#${n.id}`} className="link-line text-muted hover:text-ink">
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="md:col-span-4">
          <p className="eyebrow text-primary">Contact</p>
          <ul className="mt-5 space-y-3">
            {links.map(({ key, href, label, Icon, external }) => (
              <li key={key}>
                <a href={href} {...ext(external)} className="flex items-start gap-3 text-muted hover:text-ink">
                  <Icon className="mt-[0.3em] shrink-0" />
                  <span>{label}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="container-x mt-16 flex flex-col-reverse items-start justify-between gap-5 border-t border-line pt-8 text-step-n1 text-muted sm:flex-row sm:items-center">
        <p>
          © {year} {cafe.name}
        </p>
        <AgencyRibbon className="border-line text-muted hover:text-ink" />
      </div>
    </footer>
  );
}

function FooterBright() {
  const { cafe, year, links } = useFooter();
  return (
    <footer className="rounded-t-[2.5rem] border-t-2 border-ink bg-ink pb-24 pt-14 text-bg md:pb-10">
      <div className="container-x">
        <div data-anim="stagger" className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="display text-step-5">{cafe.name}</p>
            <p className="mt-2 opacity-75">{cafe.tagline}</p>
          </div>
          <ul className="flex flex-wrap gap-3">
            {links.slice(0, 3).map(({ key, href, label, Icon, external }) => (
              <li key={key}>
                <a href={href} {...ext(external)} className="inline-flex items-center gap-2 rounded-button border-2 border-bg px-4 py-2.5 font-bold hover:bg-accent hover:text-on-accent hover:border-accent">
                  <Icon />
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <address className="mt-10 flex items-start gap-2 not-italic opacity-80">
          <PinIcon className="mt-[0.3em] shrink-0" />
          {cafe.contact.address}
        </address>
        <div className="mt-10 flex flex-col-reverse items-start justify-between gap-5 border-t border-bg/20 pt-6 text-step-n1 opacity-90 sm:flex-row sm:items-center">
          <p>
            © {year} {cafe.name}
          </p>
          <AgencyRibbon className="border-bg/30 bg-bg/10" />
        </div>
      </div>
    </footer>
  );
}

function FooterWarm() {
  const { cafe, year, links } = useFooter();
  return (
    <footer className="bg-ink pb-24 pt-16 text-bg md:pb-12">
      <div className="container-x flex flex-col items-center text-center">
        {/* Text, not the logo image: a dark logo would vanish on this dark footer. */}
        <p className="display text-step-4 italic">{cafe.name}</p>
        <p className="mt-4 max-w-[36ch] opacity-75">{cafe.tagline}</p>
        <ul data-anim="stagger" className="mt-10 grid w-full max-w-3xl gap-4 sm:grid-cols-2">
          {links.map(({ key, href, label, Icon, external }) => (
            <li key={key}>
              <a href={href} {...ext(external)} className="flex h-full items-center justify-center gap-3 rounded-lg border border-bg/20 px-4 py-4 hover:border-bg/60">
                <Icon className="shrink-0 text-accent" />
                <span>{label}</span>
              </a>
            </li>
          ))}
        </ul>
        <div className="mt-12 flex w-full flex-col items-center justify-between gap-5 border-t border-bg/15 pt-8 text-step-n1 opacity-90 sm:flex-row">
          <p>
            © {year} {cafe.name}
          </p>
          <AgencyRibbon className="border-bg/25" />
        </div>
      </div>
    </footer>
  );
}

export const Footer = byMood('Footer', { 'dark-premium': FooterDark, 'bright-cafe': FooterBright, 'warm-restaurant': FooterWarm });

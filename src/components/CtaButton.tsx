import { ctaHref, ctaOpensNewTab } from '../lib/cta.ts';
import { useCafe } from '../theme/ThemeProvider.tsx';
import { PhoneIcon, PinIcon, WhatsAppIcon } from './icons.tsx';

const ICONS = { whatsapp: WhatsAppIcon, call: PhoneIcon, maps: PinIcon };

/** The cafe's primary call-to-action. Styling (including display: inline-flex / hidden) is passed in by each mood's hero. */
export function CtaButton({ className = '', label }: { className?: string; label?: string }) {
  const { cafe } = useCafe();
  const Icon = ICONS[cafe.cta.action];
  const newTab = ctaOpensNewTab(cafe);
  return (
    <a
      href={ctaHref(cafe)}
      {...(newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className={`items-center justify-center gap-3 whitespace-nowrap transition-[transform,box-shadow,background-color,color] duration-200 ${className}`}
    >
      <Icon className="shrink-0 text-[1.15em]" />
      <span>{label ?? cafe.cta.text}</span>
    </a>
  );
}

import { actionHref, actionLabel, type Action } from '../lib/content.ts';
import { useCafe } from '../theme/ThemeProvider.tsx';
import { PhoneIcon, PinIcon, WhatsAppIcon } from './icons.tsx';

export const ACTION_ICONS = { whatsapp: WhatsAppIcon, call: PhoneIcon, maps: PinIcon };

/** A contact button for any action (WhatsApp / call / directions). Styling comes from the caller. */
export function ActionLink({ action, className = '', label, icon = true }: { action: Action; className?: string; label?: string; icon?: boolean }) {
  const { cafe, theme } = useCafe();
  const Icon = ACTION_ICONS[action];
  const text = label ?? (action === cafe.cta.action ? cafe.cta.text : actionLabel(cafe, theme.mood, action));
  return (
    <a
      href={actionHref(cafe, action)}
      data-magnetic
      {...(action !== 'call' ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className={`items-center justify-center gap-2.5 whitespace-nowrap transition-[transform,box-shadow,background-color,color,border-color,filter] duration-200 ${className}`}
    >
      {icon && <Icon className="shrink-0 text-[1.15em]" />}
      <span>{text}</span>
    </a>
  );
}

import type { CafeConfig } from '../config/schema.ts';

const digits = (s: string) => s.replace(/[^0-9]/g, '');

export function whatsappHref(number: string, message?: string): string {
  return `https://wa.me/${digits(number)}${message ? `?text=${encodeURIComponent(message)}` : ''}`;
}

export function telHref(phone: string): string {
  return `tel:${phone.trim().startsWith('+') ? '+' : ''}${digits(phone)}`;
}

export function mapsHref(name: string, address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name}, ${address}`)}`;
}

export function ctaHref(c: CafeConfig): string {
  switch (c.cta.action) {
    case 'whatsapp':
      return whatsappHref(c.contact.whatsapp, c.cta.message);
    case 'call':
      return telHref(c.contact.phone);
    case 'maps':
      return mapsHref(c.name, c.contact.address);
  }
}

export const ctaOpensNewTab = (c: CafeConfig) => c.cta.action !== 'call';

/** Phone number as people read it: keeps the config's own spacing. */
export const displayPhone = (phone: string) => phone.trim();

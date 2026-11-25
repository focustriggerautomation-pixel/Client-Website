import { useCafe } from '../theme/ThemeProvider.tsx';

/** Google Maps iframe, lazy-loaded. `tone="dark"` tints it to sit on dark pages. */
export function MapEmbed({ className = '', tone }: { className?: string; tone?: 'dark' }) {
  const { cafe } = useCafe();
  return (
    <iframe
      src={cafe.contact.mapsEmbedUrl}
      title={`Map showing ${cafe.name}, ${cafe.contact.address}`}
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      allowFullScreen
      className={`block h-full w-full border-0 ${className}`}
      style={tone === 'dark' ? { filter: 'grayscale(1) invert(0.92) contrast(0.9) brightness(0.95)' } : undefined}
    />
  );
}

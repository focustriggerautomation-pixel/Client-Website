import { useEffect, useState } from 'react';

/**
 * A QR code for a URL, drawn as SVG. The encoder (uqr, ~12 KB) is loaded on demand, so it only ever reaches
 * the private index and the phone-preview page — never a cafe page.
 */
export function QrCode({ url, label, className = '' }: { url: string; label: string; className?: string }) {
  const [svg, setSvg] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    import('uqr').then(({ renderSVG }) => alive && setSvg(renderSVG(url, { border: 2, ecc: 'M' })));
    return () => {
      alive = false;
    };
  }, [url]);
  return (
    <div
      role="img"
      aria-label={label}
      className={`aspect-square overflow-hidden rounded-lg bg-white [&>svg]:block [&>svg]:size-full ${className}`}
      // generated locally from the URL, no user input
      dangerouslySetInnerHTML={svg ? { __html: svg } : undefined}
    />
  );
}

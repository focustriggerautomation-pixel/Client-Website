import { useSyncExternalStore } from 'react';

/** Live CSS media query match. */
export function useMedia(query: string): boolean {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(query);
      m.addEventListener('change', cb);
      return () => m.removeEventListener('change', cb);
    },
    () => window.matchMedia(query).matches,
    () => false, // build-time prerender: no media queries (mobile-first markup)
  );
}

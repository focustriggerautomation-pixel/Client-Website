import { useSyncExternalStore } from 'react';

const noop = () => () => {};

/**
 * false during the build-time prerender and while React hydrates that HTML, true afterwards. For output that
 * depends on the visitor's moment or device ("open now", WebGL support): render the neutral version first so
 * hydration matches the prerendered markup, then update.
 */
export const useHydrated = (): boolean =>
  useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );

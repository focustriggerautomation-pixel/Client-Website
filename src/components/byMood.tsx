import type { ComponentType } from 'react';
import type { Mood } from '../config/schema.ts';
import { useCafe } from '../theme/ThemeProvider.tsx';

/**
 * One component per mood, picked from the *active* mood (config.mood, or the
 * ?mood= preview override). Every section uses this, so overrides apply everywhere.
 */
export function byMood(name: string, variants: Record<Mood, ComponentType>): ComponentType {
  const Picked = () => {
    const { theme } = useCafe();
    const Variant = variants[theme.mood];
    return <Variant />;
  };
  Picked.displayName = name;
  return Picked;
}

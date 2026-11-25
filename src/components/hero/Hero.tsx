import type { Mood } from '../../config/schema.ts';
import { useCafe } from '../../theme/ThemeProvider.tsx';
import { HeroBrightCafe } from './HeroBrightCafe.tsx';
import { HeroDarkPremium } from './HeroDarkPremium.tsx';
import { HeroWarmRestaurant } from './HeroWarmRestaurant.tsx';

const HEROES: Record<Mood, () => React.JSX.Element> = {
  'dark-premium': HeroDarkPremium,
  'bright-cafe': HeroBrightCafe,
  'warm-restaurant': HeroWarmRestaurant,
};

export function Hero() {
  const { theme } = useCafe();
  const Component = HEROES[theme.mood];
  return <Component />;
}

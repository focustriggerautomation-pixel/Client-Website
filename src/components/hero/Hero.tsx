import { byMood } from '../byMood.tsx';
import { HeroBrightCafe } from './HeroBrightCafe.tsx';
import { HeroDarkPremium } from './HeroDarkPremium.tsx';
import { HeroWarmRestaurant } from './HeroWarmRestaurant.tsx';

export const Hero = byMood('Hero', {
  'dark-premium': HeroDarkPremium,
  'bright-cafe': HeroBrightCafe,
  'warm-restaurant': HeroWarmRestaurant,
});

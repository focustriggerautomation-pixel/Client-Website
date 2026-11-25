import type { Mood } from '../config/schema.ts';
import type { FontSpec } from './fonts.ts';

/**
 * A mood is a complete design-token set. A cafe picks one mood; its brand
 * colours then override the mood's palette (see buildTheme.ts).
 */
export interface MoodTokens {
  label: string;
  palette: {
    background: string;
    /** Body text colour when it reads well on the background (else auto-picked). */
    ink: string;
    primary: string;
    accent: string;
  };
  fonts: {
    display: FontSpec & { fallback: 'serif' | 'sans-serif' };
    body: FontSpec & { fallback: 'serif' | 'sans-serif' };
  };
  type: {
    /** Body size in px at desktop. */
    base: number;
    /** Modular scale ratio between steps. */
    ratio: number;
    /** How far large steps shrink on mobile (0–1, fraction of desktop size kept). */
    mobileShrink: number;
    displayWeight: number;
    displayTracking: string;
    displayLeading: number;
    displayTransform: 'none' | 'uppercase';
    /** Use the italic cut for display emphasis. */
    displayItalic: boolean;
    eyebrowTracking: string;
    bodyLeading: number;
  };
  space: {
    /** Multiplier on the spacing scale: <1 tighter, >1 airier. */
    density: number;
    /** Vertical padding of a section, CSS length. */
    section: string;
    /** Max content width. */
    container: string;
  };
  radius: { sm: string; md: string; lg: string; button: string; image: string };
  motion: {
    /** 0 = static, 1 = lively. Later phases scale animation distance/stagger by this. */
    intensity: number;
    duration: number;
    easing: string;
    /** Reveal distance in px at intensity 1. */
    distance: number;
  };
  /** Decorative extras the hero/sections may use. */
  texture: 'grain' | 'none' | 'paper';
}

export const MOOD_TOKENS: Record<Mood, MoodTokens> = {
  // Specialty coffee bar at night: inky, editorial, high-contrast Didone serif.
  'dark-premium': {
    label: 'Dark premium',
    palette: { background: '#0E0D0C', ink: '#EEE6D8', primary: '#C8A26B', accent: '#8C2F1B' },
    fonts: {
      display: { family: 'Bodoni Moda', weights: [400, 500, 700], italic: true, fallback: 'serif' },
      body: { family: 'Instrument Sans', weights: [400, 500, 600], italic: false, fallback: 'sans-serif' },
    },
    type: {
      base: 17,
      ratio: 1.333,
      mobileShrink: 0.55,
      displayWeight: 400,
      displayTracking: '-0.02em',
      displayLeading: 0.95,
      displayTransform: 'none',
      displayItalic: true,
      eyebrowTracking: '0.32em',
      bodyLeading: 1.65,
    },
    space: { density: 1.2, section: 'clamp(5rem, 12vw, 10rem)', container: '78rem' },
    radius: { sm: '0px', md: '2px', lg: '4px', button: '0px', image: '2px' },
    motion: { intensity: 0.45, duration: 900, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', distance: 24 },
    texture: 'grain',
  },

  // Daylight brunch spot: sunny, chunky, playful grotesque with sticker accents.
  'bright-cafe': {
    label: 'Bright cafe',
    palette: { background: '#FFF7E8', ink: '#1F1A14', primary: '#E8552D', accent: '#F6C445' },
    fonts: {
      display: { family: 'Bricolage Grotesque', weights: [400, 600, 800], italic: false, fallback: 'sans-serif' },
      body: { family: 'Figtree', weights: [400, 500, 700], italic: false, fallback: 'sans-serif' },
    },
    type: {
      base: 17,
      ratio: 1.3,
      mobileShrink: 0.6,
      displayWeight: 800,
      displayTracking: '-0.035em',
      displayLeading: 0.92,
      displayTransform: 'none',
      displayItalic: false,
      eyebrowTracking: '0.08em',
      bodyLeading: 1.55,
    },
    space: { density: 1, section: 'clamp(4rem, 9vw, 7.5rem)', container: '76rem' },
    radius: { sm: '10px', md: '18px', lg: '32px', button: '999px', image: '28px' },
    motion: { intensity: 1, duration: 600, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)', distance: 36 },
    texture: 'none',
  },

  // Family restaurant: candle-warm, soft old-style serif, generous and calm.
  'warm-restaurant': {
    label: 'Warm restaurant',
    palette: { background: '#F4EADB', ink: '#2B1D14', primary: '#9E3B22', accent: '#C98B2E' },
    fonts: {
      display: { family: 'Fraunces', weights: [400, 600], italic: true, fallback: 'serif' },
      body: { family: 'Karla', weights: [400, 500, 700], italic: false, fallback: 'sans-serif' },
    },
    type: {
      base: 18,
      ratio: 1.25,
      mobileShrink: 0.62,
      displayWeight: 600,
      displayTracking: '-0.01em',
      displayLeading: 1.02,
      displayTransform: 'none',
      displayItalic: false,
      eyebrowTracking: '0.18em',
      bodyLeading: 1.7,
    },
    space: { density: 1.1, section: 'clamp(4.5rem, 10vw, 8.5rem)', container: '72rem' },
    radius: { sm: '6px', md: '10px', lg: '16px', button: '8px', image: '14px' },
    motion: { intensity: 0.65, duration: 750, easing: 'cubic-bezier(0.25, 0.8, 0.25, 1)', distance: 28 },
    texture: 'paper',
  },
};

import { useId } from 'react';
import type { Palette3D } from './palette.ts';

/*
 * Illustrated, CSS-animated versions of the 3D objects. Shown immediately (before / instead of WebGL),
 * so the hero is complete and readable without the 3D bundle. Colours come from the same brand palette.
 * Animations are transform/opacity keyframes (compositor) and stop under prefers-reduced-motion.
 */

const Steam = ({ x, color, alpha, height = 120, top = 40 }: { x: number[]; color: string; alpha: number; height?: number; top?: number }) => (
  <g fill="none" stroke={color} strokeLinecap="round" strokeWidth={7} opacity={alpha}>
    {x.map((cx, i) => (
      <path
        key={cx}
        className="h3d-steam"
        style={{ animationDelay: `${i * 0.9}s` }}
        d={`M${cx} ${top + height} C${cx - 14} ${top + height * 0.75}, ${cx + 14} ${top + height * 0.55}, ${cx} ${top + height * 0.35} S${cx - 10} ${top + height * 0.1}, ${cx + 4} ${top}`}
      />
    ))}
  </g>
);

const Bean = ({ x, y, r, fill, delay }: { x: number; y: number; r: number; fill: string; delay: number }) => (
  <g className="h3d-float" style={{ animationDelay: `${delay}s` }} transform={`translate(${x} ${y}) rotate(${r})`}>
    <ellipse rx="15" ry="10" fill={fill} />
    <ellipse rx="11" ry="6" fill="#ffffff" opacity="0.08" transform="translate(-2 -2)" />
    <path d="M-12 0 C-4 -3, 4 3, 12 0" stroke="#000000" strokeOpacity="0.45" strokeWidth="2" fill="none" />
  </g>
);

export function CupFallback({ p }: { p: Palette3D }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 400 400" className="h-full w-full" aria-hidden>
      <defs>
        <linearGradient id={`${id}b`} x1="0" x2="1">
          <stop offset="0" stopColor={p.ceramicShade} />
          <stop offset="0.35" stopColor={p.ceramic} />
          <stop offset="0.55" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="0.7" stopColor={p.ceramic} />
          <stop offset="1" stopColor={p.ceramicShade} />
        </linearGradient>
        <radialGradient id={`${id}s`} cx="0.5" cy="0.4" r="0.6">
          <stop offset="0" stopColor={p.ceramic} />
          <stop offset="1" stopColor={p.ceramicShade} />
        </radialGradient>
        <radialGradient id={`${id}c`} cx="0.45" cy="0.45" r="0.6">
          <stop offset="0" stopColor={p.crema} />
          <stop offset="0.7" stopColor={p.coffee} />
          <stop offset="1" stopColor={p.coffee} />
        </radialGradient>
      </defs>
      <Steam x={[178, 205, 228]} color={p.steam} alpha={p.steamAlpha} top={30} height={130} />
      <Bean x={78} y={130} r={-25} fill={p.bean} delay={0} />
      <Bean x={330} y={96} r={30} fill={p.bean} delay={1.4} />
      <Bean x={338} y={250} r={-10} fill={p.bean} delay={2.6} />
      <ellipse cx="200" cy="320" rx="150" ry="36" fill={`url(#${id}s)`} />
      <ellipse cx="200" cy="316" rx="96" ry="21" fill={p.ceramicShade} opacity="0.55" />
      <ellipse cx="200" cy="312" rx="80" ry="13" fill="#000000" opacity="0.25" />
      <path d="M280 205 C338 196, 346 262, 274 262" fill="none" stroke={p.ceramicShade} strokeWidth="18" strokeLinecap="round" />
      <path d="M280 205 C334 198, 340 258, 274 258" fill="none" stroke={p.ceramic} strokeWidth="12" strokeLinecap="round" />
      <path d="M118 180 C120 252, 136 300, 162 308 L238 308 C264 300, 280 252, 282 180 Z" fill={`url(#${id}b)`} />
      <ellipse cx="200" cy="180" rx="82" ry="20" fill={p.ceramic} stroke={p.metal} strokeWidth="3" />
      <ellipse cx="200" cy="184" rx="72" ry="15" fill={`url(#${id}c)`} />
      <path d="M170 184 C185 176, 215 192, 228 182" stroke={p.crema} strokeWidth="3" fill="none" opacity="0.7" />
    </svg>
  );
}

export function GlassFallback({ p }: { p: Palette3D }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 400 400" className="h-full w-full" aria-hidden>
      <defs>
        <linearGradient id={`${id}l`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.milk} />
          <stop offset="0.38" stopColor={p.milk} />
          <stop offset="0.62" stopColor={p.coffee} />
          <stop offset="1" stopColor={p.coffee} />
        </linearGradient>
        <pattern id={`${id}st`} width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
          <rect width="16" height="16" fill={p.primary} />
          <rect width="7" height="16" fill={p.bg} />
        </pattern>
        <clipPath id={`${id}g`}>
          <path d="M136 120 L154 328 Q200 342 246 328 L264 120 Z" />
        </clipPath>
      </defs>
      <ellipse cx="200" cy="350" rx="92" ry="14" fill={p.ink} opacity="0.18" />
      <g className="h3d-bounce">
        <rect x="206" y="28" width="18" height="190" rx="9" transform="rotate(14 215 120)" fill={`url(#${id}st)`} stroke={p.ink} strokeWidth="4" />
        <g clipPath={`url(#${id}g)`}>
          <rect x="120" y="150" width="160" height="200" fill={`url(#${id}l)`} />
          <rect x="152" y="140" width="46" height="42" rx="10" fill={p.ice} opacity="0.85" transform="rotate(-12 175 160)" />
          <rect x="200" y="150" width="44" height="40" rx="10" fill={p.ice} opacity="0.75" transform="rotate(16 222 170)" />
        </g>
        <path d="M136 120 L154 328 Q200 342 246 328 L264 120 Z" fill={p.glass} fillOpacity="0.25" stroke={p.ink} strokeWidth="5" strokeLinejoin="round" />
        <path d="M152 140 L166 310" stroke="#ffffff" strokeOpacity="0.7" strokeWidth="6" strokeLinecap="round" />
      </g>
      {[
        [96, 110, 20, 0],
        [310, 90, -30, 1],
        [80, 250, 50, 2],
        [326, 230, -60, 3],
        [120, 60, 70, 1],
        [290, 300, 10, 0],
      ].map(([x, y, r, c], i) => (
        <g key={i} className="h3d-float" style={{ animationDelay: `${i * 0.6}s` }}>
          <rect x={x} y={y} width="22" height="8" rx="4" fill={p.sprinkles[c]} stroke={p.ink} strokeWidth="2" transform={`rotate(${r} ${x + 11} ${y + 4})`} />
        </g>
      ))}
      <rect
        className="h3d-float"
        style={{ animationDelay: '1.2s' }}
        x="300"
        y="150"
        width="40"
        height="38"
        rx="10"
        fill={p.ice}
        fillOpacity="0.8"
        stroke={p.ink}
        strokeWidth="4"
        transform="rotate(20 320 169)"
      />
    </svg>
  );
}

export function PlateFallback({ p }: { p: Palette3D }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 400 400" className="h-full w-full" aria-hidden>
      <defs>
        <linearGradient id={`${id}bw`} x1="0" x2="1">
          <stop offset="0" stopColor={p.glaze} />
          <stop offset="0.45" stopColor={p.glaze} stopOpacity="0.85" />
          <stop offset="0.6" stopColor="#ffffff" stopOpacity="0.35" />
          <stop offset="1" stopColor={p.glaze} />
        </linearGradient>
        <linearGradient id={`${id}m`} x1="0" x2="1">
          <stop offset="0" stopColor={p.metal} />
          <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.8" />
          <stop offset="1" stopColor={p.metal} />
        </linearGradient>
      </defs>
      <Steam x={[180, 202, 222]} color={p.steam} alpha={p.steamAlpha} top={40} height={150} />
      <g className="h3d-sway">
        <ellipse cx="200" cy="296" rx="170" ry="52" fill={p.ceramicShade} />
        <ellipse cx="200" cy="290" rx="166" ry="48" fill={p.ceramic} />
        <ellipse cx="200" cy="292" rx="126" ry="34" fill={p.ceramicShade} opacity="0.5" />
        <g transform="rotate(-18 330 280)">
          <rect x="300" y="268" width="80" height="9" rx="4.5" fill={`url(#${id}m)`} />
          <path d="M296 266 l-26 -4 m26 7 l-26 0 m26 4 l-26 4 m26 2 l-26 7" stroke={p.metal} strokeWidth="4" strokeLinecap="round" />
        </g>
        <g transform="rotate(14 80 280)">
          <rect x="20" y="276" width="78" height="9" rx="4.5" fill={`url(#${id}m)`} />
          <ellipse cx="112" cy="280" rx="22" ry="12" fill={`url(#${id}m)`} />
        </g>
        <path d="M112 226 C116 296, 160 318, 200 318 C240 318, 284 296, 288 226 Z" fill={`url(#${id}bw)`} />
        <ellipse cx="200" cy="226" rx="88" ry="24" fill={p.ceramic} />
        <ellipse cx="200" cy="230" rx="76" ry="18" fill={p.food} />
        {[
          [176, 226],
          [214, 222],
          [196, 236],
          [232, 232],
          [166, 236],
        ].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="5" fill={p.garnish} />
        ))}
      </g>
    </svg>
  );
}

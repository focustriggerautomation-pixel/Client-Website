/**
 * Decide, before downloading anything, whether this device should try the real-time 3D hero.
 * Everything here is cheap and synchronous; the frame-rate check happens later inside the 3D chunk.
 */
export type FallbackReason =
  | 'ssr'
  | 'forced'
  | 'reduced-motion'
  | 'save-data'
  | 'low-cpu'
  | 'low-memory'
  | 'no-webgl'
  | 'software-gl';
export type Decision = { try3d: true; forced: boolean } | { try3d: false; reason: FallbackReason };

/** ?hero3d=fallback forces the illustration, ?hero3d=3d forces 3D (skips device and frame-rate gates). */
const param = () => new URLSearchParams(window.location.search).get('hero3d');

type GLProbe = { ok: boolean; software: boolean; renderer: string };
let probe: GLProbe | null = null;

/** CPU rasterisers: WebGL "works" but every frame is drawn on the CPU (no GPU, or a blocklisted one). */
const SOFTWARE_GL = /swiftshader|llvmpipe|softpipe|software|basic render|mesa offscreen/i;

export function probeWebGL(): GLProbe {
  if (probe) return probe;
  try {
    const c = document.createElement('canvas');
    const gl = (c.getContext('webgl2') || c.getContext('webgl')) as WebGLRenderingContext | null;
    if (!gl) return (probe = { ok: false, software: false, renderer: '' });
    const info = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = String(gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER) ?? '');
    gl.getExtension('WEBGL_lose_context')?.loseContext(); // free the probe context immediately
    return (probe = {
      ok: true,
      software: SOFTWARE_GL.test(renderer),
      renderer,
    });
  } catch {
    return (probe = { ok: false, software: false, renderer: '' });
  }
}

export const hasWebGL = () => probeWebGL().ok;

export function decide3D(reduced: boolean): Decision {
  if (typeof window === 'undefined') return { try3d: false, reason: 'ssr' }; // prerender: illustration first
  const p = param();
  if (p === 'fallback') return { try3d: false, reason: 'forced' };
  if (p === '3d') return hasWebGL() ? { try3d: true, forced: true } : { try3d: false, reason: 'no-webgl' };
  if (reduced) return { try3d: false, reason: 'reduced-motion' };
  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean };
  };
  if (nav.connection?.saveData) return { try3d: false, reason: 'save-data' };
  if (nav.hardwareConcurrency && nav.hardwareConcurrency < 4) return { try3d: false, reason: 'low-cpu' };
  if (nav.deviceMemory && nav.deviceMemory < 4) return { try3d: false, reason: 'low-memory' };
  const gl = probeWebGL();
  if (!gl.ok) return { try3d: false, reason: 'no-webgl' };
  // Software WebGL can never hold a smooth frame rate, and loading the 3D chunk just to measure that costs
  // seconds of main-thread time on the CPU it would be competing with. Decide before downloading anything.
  if (gl.software) return { try3d: false, reason: 'software-gl' };
  return { try3d: true, forced: false };
}

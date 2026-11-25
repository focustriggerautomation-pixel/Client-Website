/**
 * Decide, before downloading anything, whether this device should try the real-time 3D hero.
 * Everything here is cheap and synchronous; the frame-rate check happens later inside the 3D chunk.
 */
export type FallbackReason = 'forced' | 'reduced-motion' | 'save-data' | 'low-cpu' | 'low-memory' | 'no-webgl';
export type Decision = { try3d: true; forced: boolean } | { try3d: false; reason: FallbackReason };

/** ?hero3d=fallback forces the illustration, ?hero3d=3d forces 3D (skips device and frame-rate gates). */
const param = () => new URLSearchParams(window.location.search).get('hero3d');

let webgl: boolean | null = null;
export function hasWebGL(): boolean {
  if (webgl !== null) return webgl;
  try {
    const c = document.createElement('canvas');
    const gl = (c.getContext('webgl2') || c.getContext('webgl')) as WebGLRenderingContext | null;
    webgl = !!gl;
    gl?.getExtension('WEBGL_lose_context')?.loseContext(); // free the probe context immediately
  } catch {
    webgl = false;
  }
  return webgl;
}

export function decide3D(reduced: boolean): Decision {
  const p = param();
  if (p === 'fallback') return { try3d: false, reason: 'forced' };
  if (p === '3d') return hasWebGL() ? { try3d: true, forced: true } : { try3d: false, reason: 'no-webgl' };
  if (reduced) return { try3d: false, reason: 'reduced-motion' };
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  if (nav.connection?.saveData) return { try3d: false, reason: 'save-data' };
  if (nav.hardwareConcurrency && nav.hardwareConcurrency < 4) return { try3d: false, reason: 'low-cpu' };
  if (nav.deviceMemory && nav.deviceMemory < 4) return { try3d: false, reason: 'low-memory' };
  if (!hasWebGL()) return { try3d: false, reason: 'no-webgl' };
  return { try3d: true, forced: false };
}

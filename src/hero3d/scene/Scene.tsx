import { ContactShadows } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { memo, useEffect, useLayoutEffect, useMemo, useRef, type ReactNode, type RefObject } from 'react';
import * as THREE from 'three';
import { gsap, ScrollTrigger } from '../../motion/gsap.ts';
import { mix } from '../../theme/color.ts';
import type { Palette3D } from '../palette.ts';
import { Cup, IcedLatte, PlateBowl } from './models.tsx';
import { StudioEnvironment, type Panel } from './StudioEnvironment.tsx';

interface Props {
  palette: Palette3D;
  /** Apply the first-second frame-rate gate (off when ?hero3d=3d forces 3D). */
  gate: boolean;
  onReady: (fps: number) => void;
  onFail: (reason: string) => void;
}

const MIN_FPS = 30;

/** Per-mood framing. */
const VIEW = {
  'dark-premium': { camera: [0, 1.8, 6.4] as const, target: [-0.35, 0.9, 0] as const, fov: 30, shadow: 0.7, exposure: 1.05 },
  'bright-cafe': { camera: [0, 1.45, 5.0] as const, target: [0, 1.05, 0] as const, fov: 30, shadow: 0.35, exposure: 1.1 },
  'warm-restaurant': { camera: [0, 3.1, 5.4] as const, target: [0, 0.3, 0] as const, fov: 32, shadow: 0.5, exposure: 1.0 },
};

/**
 * Renders from GSAP's ticker (the same frame loop that drives Lenis + ScrollTrigger), only while the hero is on
 * screen and the tab is visible. The first second is measured: below MIN_FPS the scene reports failure and the
 * page keeps the illustrated fallback.
 */
function Driver({ active, gate, onReady, onFail }: { active: RefObject<boolean>; gate: boolean; onReady: (fps: number) => void; onFail: (r: string) => void }) {
  const advance = useThree((s) => s.advance);
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  // Callbacks via refs so the ticker effect never restarts (a restart re-ran the fps measurement).
  const cb = useRef({ onReady, onFail });
  cb.current = { onReady, onFail };
  useEffect(() => {
    const WARMUP = 4; // skip first texture uploads / remaining lazy compiles
    let frames = 0;
    let start = 0;
    let decided = false;
    let compiled = false;
    // Compile every shader before the first frame, in parallel where the GPU supports it
    // (KHR_parallel_shader_compile) — otherwise compilation is one long main-thread freeze on first render.
    gl.compileAsync(scene, camera)
      .catch(() => {})
      .finally(() => (compiled = true));
    const tick = () => {
      if (!compiled) return;
      if (!active.current) {
        if (!decided) frames = 0; // measurement restarts when it comes back on screen
        return;
      }
      const now = performance.now();
      advance(now);
      if (decided) return;
      frames++;
      if (frames === WARMUP) start = now;
      else if (frames > WARMUP && now - start >= 1000) {
        decided = true;
        const fps = ((frames - WARMUP) * 1000) / (now - start);
        if (gate && fps < MIN_FPS) cb.current.onFail('low-fps');
        else cb.current.onReady(Math.round(fps));
      }
    };
    gsap.ticker.add(tick);
    const lost = (e: Event) => {
      e.preventDefault();
      cb.current.onFail('context-lost');
    };
    gl.domElement.addEventListener('webglcontextlost', lost);
    return () => {
      gsap.ticker.remove(tick);
      gl.domElement.removeEventListener('webglcontextlost', lost);
    };
  }, [advance, gl, scene, camera, active, gate]);
  return null;
}

function CameraAim({ target }: { target: readonly [number, number, number] }) {
  const camera = useThree((s) => s.camera);
  useLayoutEffect(() => {
    camera.lookAt(...target);
  }, [camera, target]);
  return null;
}

/** Soft studio: key + rim lights and a procedural environment of light panels (no HDR downloads). */
function Studio({ p }: { p: Palette3D }) {
  const warm = p.mood === 'warm-restaurant';
  const dark = p.mood === 'dark-premium';
  const key = warm ? mix('#ffffff', p.accent, 0.35) : '#ffffff';
  const panels = useMemo<Panel[]>(
    () => [
      { form: 'rect', position: [0, 5, 1], rotation: [Math.PI / 2, 0, 0], scale: [8, 3], intensity: 3, color: key },
      { form: 'rect', position: [-5, 1.5, 1.5], rotation: [0, Math.PI / 2, 0], scale: [3, 6], intensity: 1.8 },
      { form: 'rect', position: [5, 1.5, 0], rotation: [0, -Math.PI / 2, 0], scale: [3, 6], intensity: 1.3, color: warm ? p.accent : '#ffffff' },
      { form: 'ring', position: [0, 2, -6], scale: [4, 4], intensity: 1.6, color: p.primary },
      { form: 'rect', position: [0, -3, 2], rotation: [-Math.PI / 2, 0, 0], scale: [6, 2], intensity: 0.5 },
    ],
    [key, warm, p.accent, p.primary],
  );
  return (
    <>
      <ambientLight intensity={0.12} />
      <directionalLight position={[3, 5, 4]} intensity={warm ? 2.6 : 2.1} color={key} />
      <directionalLight position={[-4, 2.5, -3]} intensity={dark ? 2.2 : 1.1} color={dark ? p.primary : '#ffffff'} />
      <StudioEnvironment background={p.bg} panels={panels} />
    </>
  );
}

/** Idle motion (per mood) + pointer / device-tilt reaction + scroll-linked rotation and zoom. */
function Rig({ mood, children }: { mood: Palette3D['mood']; children: ReactNode }) {
  const group = useRef<THREE.Group>(null);
  const pointer = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const scroll = useRef(0);
  const spin = useRef(0);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.current.tx = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.ty = (e.clientY / window.innerHeight) * 2 - 1;
    };
    const onTilt = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return;
      pointer.current.tx = THREE.MathUtils.clamp(e.gamma / 30, -1, 1);
      pointer.current.ty = THREE.MathUtils.clamp((e.beta - 45) / 30, -1, 1);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('deviceorientation', onTilt, { passive: true });
    // Scroll-linked: progress of the hero scrolling out of view, from the shared ScrollTrigger/Lenis setup.
    const st = ScrollTrigger.create({ trigger: '#top', start: 'top top', end: 'bottom top', onUpdate: (self) => (scroll.current = self.progress) });
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('deviceorientation', onTilt);
      st.kill();
    };
  }, []);

  useFrame((s, dt) => {
    const g = group.current;
    if (!g) return;
    const t = s.clock.elapsedTime;
    const pt = pointer.current;
    const k = 1 - Math.exp(-dt * 4);
    pt.x += (pt.tx - pt.x) * k;
    pt.y += (pt.ty - pt.y) * k;
    const sp = scroll.current;

    let y = 0;
    let sx = 1;
    let sy = 1;
    let rz = 0;
    if (mood === 'dark-premium') {
      // slow, cinematic float
      y = Math.sin(t * 0.9) * 0.05;
      spin.current = 0.35 + Math.sin(t * 0.22) * 0.3;
    } else if (mood === 'bright-cafe') {
      // bouncy: hop, squash on landing, a little wobble
      const b = Math.abs(Math.sin(t * 2.6));
      y = b * 0.24;
      const land = Math.pow(1 - b, 8);
      sy = 1 - land * 0.08;
      sx = 1 + land * 0.05;
      rz = Math.sin(t * 1.3) * 0.06;
      spin.current += dt * 0.45;
    } else {
      // calm, slow turntable
      spin.current += dt * 0.14;
    }
    const zoom = 1 + sp * 0.28;
    g.position.y = y + sp * 0.35;
    g.rotation.set(pt.y * 0.12, spin.current + pt.x * 0.4 + sp * Math.PI * 0.9, rz);
    g.scale.set(sx * zoom, sy * zoom, sx * zoom);
  });

  return <group ref={group}>{children}</group>;
}

function Scene({ palette, gate, onReady, onFail }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const active = useRef(true);
  const view = VIEW[palette.mood];
  const coarse = useMemo(() => window.matchMedia('(pointer: coarse)').matches, []);

  // Pause when the hero is off screen or the tab is hidden.
  useEffect(() => {
    let onScreen = true;
    const update = () => (active.current = onScreen && document.visibilityState === 'visible');
    const io = new IntersectionObserver(([e]) => {
      onScreen = e.isIntersecting;
      update();
    });
    io.observe(wrap.current!);
    document.addEventListener('visibilitychange', update);
    return () => {
      io.disconnect();
      document.removeEventListener('visibilitychange', update);
    };
  }, []);

  const Model = palette.mood === 'dark-premium' ? Cup : palette.mood === 'bright-cafe' ? IcedLatte : PlateBowl;

  return (
    <div ref={wrap} className="h-full w-full">
      <Canvas
        frameloop="never"
        dpr={[1, coarse ? 1.5 : 2]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        camera={{ position: [...view.camera], fov: view.fov, near: 0.1, far: 50 }}
        onCreated={({ gl }) => {
          gl.toneMappingExposure = view.exposure;
        }}
        style={{ pointerEvents: 'none' }}
      >
        <Driver active={active} gate={gate} onReady={onReady} onFail={onFail} />
        <CameraAim target={view.target} />
        <Studio p={palette} />
        <Rig mood={palette.mood}>
          <Model p={palette} />
        </Rig>
        <ContactShadows
          position={[0, -0.01, 0]}
          opacity={view.shadow}
          scale={5}
          blur={2.6}
          far={2.5}
          resolution={coarse ? 256 : 512}
          color={palette.mood === 'dark-premium' ? '#000000' : palette.ink}
        />
      </Canvas>
    </div>
  );
}

/** Memoized: the wrapper's status changes must not re-render the scene. */
export default memo(Scene);

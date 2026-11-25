import { Outlines, RoundedBox } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { Palette3D } from '../palette.ts';
import { beanGeometry, cremaTexture, lathe, stripeTexture } from './geometry.ts';
import { Steam } from './Steam.tsx';

const ceramic = (color: string) =>
  new THREE.MeshPhysicalMaterial({ color, roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.12, sheen: 0.2, sheenColor: new THREE.Color('#ffffff') });
const metal = (color: string) => new THREE.MeshStandardMaterial({ color, metalness: 1, roughness: 0.22 });

/* ───────────────────────────── dark-premium: cup & saucer ───────────────────────────── */

const CUP_PROFILE: [number, number][] = [
  [0, 0.02],
  [0.3, 0.02],
  [0.34, 0.0],
  [0.38, 0.02],
  [0.4, 0.08],
  [0.46, 0.28],
  [0.52, 0.56],
  [0.555, 0.78],
  [0.57, 0.86],
  [0.575, 0.895],
  [0.565, 0.905],
  [0.548, 0.895],
  [0.535, 0.84],
  [0.505, 0.62],
  [0.45, 0.36],
  [0.38, 0.14],
  [0.26, 0.09],
  [0, 0.085],
];
const SAUCER_PROFILE: [number, number][] = [
  [0, 0],
  [0.55, 0],
  [0.62, 0.012],
  [0.78, 0.03],
  [0.98, 0.1],
  [1.04, 0.13],
  [1.045, 0.145],
  [1.02, 0.15],
  [0.96, 0.125],
  [0.76, 0.07],
  [0.5, 0.055],
  [0.44, 0.065],
  [0.4, 0.06],
  [0, 0.055],
];

function Beans({ color }: { color: string }) {
  const geo = useMemo(beanGeometry, []);
  const mat = useMemo(() => new THREE.MeshPhysicalMaterial({ color, roughness: 0.42, clearcoat: 0.6, clearcoatRoughness: 0.35 }), [color]);
  const beans = useRef<THREE.Group>(null);
  const spots = useMemo(
    () => [
      { p: [-0.85, 1.75, -0.9], r: [0.6, 0.4, 0.2], s: 0.12, speed: 0.7 },
      { p: [1.15, 1.5, -0.3], r: [1.2, -0.3, 0.8], s: 0.13, speed: 0.55 },
      { p: [1.3, 0.45, 0.5], r: [0.2, 1.1, -0.4], s: 0.14, speed: 0.8 },
      { p: [0.55, 2.15, -0.6], r: [-0.7, 0.5, 1.2], s: 0.1, speed: 0.6 },
    ],
    [],
  );
  useFrame((s) => {
    const t = s.clock.elapsedTime;
    beans.current?.children.forEach((b, i) => {
      const sp = spots[i];
      b.position.y = sp.p[1] + Math.sin(t * sp.speed + i * 1.7) * 0.12;
      b.rotation.x = sp.r[0] + t * 0.35 * sp.speed;
      b.rotation.y = sp.r[1] + t * 0.25;
    });
  });
  return (
    <group ref={beans}>
      {spots.map((sp, i) => (
        <mesh key={i} geometry={geo} material={mat} position={sp.p as [number, number, number]} scale={sp.s} castShadow />
      ))}
    </group>
  );
}

export function Cup({ p }: { p: Palette3D }) {
  const m = useMemo(() => {
    const body = ceramic(p.ceramic);
    const crema = new THREE.MeshPhysicalMaterial({ map: cremaTexture(p.coffee, p.crema, p.milk), roughness: 0.18, clearcoat: 0.8 });
    return { body, crema, rim: metal(p.metal) };
  }, [p]);
  const geo = useMemo(() => {
    const handleCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.53, 0.74, 0),
      new THREE.Vector3(0.82, 0.74, 0),
      new THREE.Vector3(0.9, 0.5, 0),
      new THREE.Vector3(0.74, 0.27, 0),
      new THREE.Vector3(0.46, 0.25, 0),
    ]);
    return {
      cup: lathe(CUP_PROFILE),
      saucer: lathe(SAUCER_PROFILE),
      handle: new THREE.TubeGeometry(handleCurve, 64, 0.052, 20, false),
      coffee: new THREE.CircleGeometry(0.525, 64),
    };
  }, []);
  return (
    <group>
      <mesh geometry={geo.saucer} material={m.body} castShadow receiveShadow />
      <mesh geometry={new THREE.TorusGeometry(1.03, 0.01, 10, 128)} material={m.rim} position-y={0.146} rotation-x={Math.PI / 2} />
      <group position-y={0.055}>
        <mesh geometry={geo.cup} material={m.body} castShadow />
        <mesh geometry={geo.handle} material={m.body} castShadow />
        <mesh geometry={geo.coffee} material={m.crema} position-y={0.79} rotation-x={-Math.PI / 2} />
        <mesh geometry={new THREE.TorusGeometry(0.562, 0.011, 12, 128)} material={m.rim} position-y={0.9} rotation-x={Math.PI / 2} />
        <Steam color={p.steam} alpha={p.steamAlpha} position={[0, 0.85, 0]} width={0.75} height={1.5} />
      </group>
      <Beans color={p.bean} />
    </group>
  );
}

/* ───────────────────────────── bright-cafe: iced latte ───────────────────────────── */

const GLASS_PROFILE: [number, number][] = [
  [0, 0],
  [0.4, 0],
  [0.425, 0.02],
  [0.43, 0.06],
  [0.5, 1.5],
  [0.505, 1.525],
  [0.49, 1.53],
  [0.475, 1.5],
  [0.41, 0.13],
  [0.3, 0.11],
  [0, 0.11],
];

function liquidGeometry(coffee: string, milk: string) {
  const top = 1.08;
  const pts: [number, number][] = [
    [0, 0.12],
    [0.4, 0.12],
  ];
  for (let i = 1; i <= 24; i++) {
    const y = 0.12 + ((top - 0.12) * i) / 24;
    pts.push([0.405 + ((y - 0.12) / 1.38) * 0.065, y]);
  }
  pts.push([0, top]);
  const g = lathe(pts, 64);
  // vertical colour gradient: coffee settles at the bottom, milk floats on top, a soft swirl between
  const pos = g.attributes.position as THREE.BufferAttribute;
  const a = new THREE.Color(coffee);
  const b = new THREE.Color(milk);
  const c = new THREE.Color();
  const colors = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    const ang = Math.atan2(pos.getZ(i), pos.getX(i));
    const k = THREE.MathUtils.smoothstep(y + Math.sin(ang * 3) * 0.06, 0.45, 0.8);
    c.copy(a)
      .lerp(b, k)
      .toArray(colors, i * 3);
  }
  g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return g;
}

export function IcedLatte({ p }: { p: Palette3D }) {
  const m = useMemo(
    () => ({
      glass: new THREE.MeshPhysicalMaterial({
        color: p.glass,
        transparent: true,
        opacity: 0.22,
        roughness: 0.04,
        clearcoat: 1,
        clearcoatRoughness: 0.04,
        envMapIntensity: 2.2,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
      liquid: new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.3, clearcoat: 0.5 }),
      ice: new THREE.MeshPhysicalMaterial({ color: p.ice, transparent: true, opacity: 0.62, roughness: 0.08, clearcoat: 1, envMapIntensity: 2 }),
      straw: new THREE.MeshPhysicalMaterial({ map: stripeTexture(p.primary, p.bg), roughness: 0.35, clearcoat: 0.6 }),
      inkLine: new THREE.MeshStandardMaterial({ color: p.ink, roughness: 0.6 }),
    }),
    [p],
  );
  const geo = useMemo(() => {
    const strawCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.05, 0.2, 0.05),
      new THREE.Vector3(0.18, 1.2, 0.08),
      new THREE.Vector3(0.28, 1.95, 0.1),
      new THREE.Vector3(0.36, 2.12, 0.1),
      new THREE.Vector3(0.6, 2.18, 0.1),
    ]);
    return { glass: lathe(GLASS_PROFILE), liquid: liquidGeometry(p.coffee, p.milk), straw: new THREE.TubeGeometry(strawCurve, 80, 0.055, 16, false) };
  }, [p]);

  const ice = useRef<THREE.Group>(null);
  const sprinkles = useRef<THREE.Group>(null);
  const sprinkleData = useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => ({
        angle: (i / 16) * Math.PI * 2,
        radius: 1.05 + (i % 3) * 0.18,
        y: 0.3 + ((i * 7) % 11) * 0.16,
        color: p.sprinkles[i % p.sprinkles.length],
        spin: 0.6 + (i % 4) * 0.3,
      })),
    [p],
  );
  const sprinkleGeo = useMemo(() => new THREE.CapsuleGeometry(0.035, 0.13, 4, 10), []);
  const sprinkleMats = useMemo(() => p.sprinkles.map((c) => new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.3, clearcoat: 1 })), [p]);

  useFrame((s) => {
    const t = s.clock.elapsedTime;
    ice.current?.children.forEach((c, i) => {
      c.position.y = 1.0 + (i === 3 ? 0.9 : 0) + Math.sin(t * 2 + i) * 0.035;
      c.rotation.y = i + Math.sin(t * 0.8 + i) * 0.3;
    });
    sprinkles.current?.children.forEach((c, i) => {
      const d = sprinkleData[i];
      const a = d.angle + t * 0.25;
      c.position.set(Math.cos(a) * d.radius, d.y + Math.sin(t * 1.6 + i) * 0.08, Math.sin(a) * d.radius);
      c.rotation.set(t * d.spin, i, t * d.spin * 0.7);
    });
  });

  return (
    <group>
      <mesh geometry={geo.liquid} material={m.liquid} />
      <group ref={ice}>
        {[
          [-0.16, 0.12],
          [0.17, -0.08],
          [0.02, 0.2],
          [1.0, 0.25],
        ].map(([x, z], i) => (
          <RoundedBox key={i} args={[0.26, 0.26, 0.26]} radius={0.05} smoothness={3} position={[x, 1, z]} material={m.ice} />
        ))}
      </group>
      <mesh geometry={geo.straw} material={m.straw}>
        <Outlines thickness={0.014} color={p.ink} />
      </mesh>
      <mesh geometry={geo.glass} material={m.glass} renderOrder={2} />
      {/* ink rim and base rings: the bright mood's sticker-style outline, without see-through hull artefacts */}
      <mesh position-y={1.528} rotation-x={Math.PI / 2} material={m.inkLine}>
        <torusGeometry args={[0.497, 0.016, 10, 96]} />
      </mesh>
      <mesh position-y={0.03} rotation-x={Math.PI / 2} material={m.inkLine}>
        <torusGeometry args={[0.43, 0.018, 10, 96]} />
      </mesh>
      <group ref={sprinkles}>
        {sprinkleData.map((_, i) => (
          <mesh key={i} geometry={sprinkleGeo} material={sprinkleMats[i % sprinkleMats.length]} />
        ))}
      </group>
    </group>
  );
}

/* ───────────────────────────── warm-restaurant: plate, bowl, cutlery ───────────────────────────── */

const PLATE_PROFILE: [number, number][] = [
  [0, 0],
  [1.1, 0],
  [1.2, 0.015],
  [1.4, 0.07],
  [1.58, 0.16],
  [1.61, 0.175],
  [1.6, 0.19],
  [1.56, 0.185],
  [1.38, 0.1],
  [1.16, 0.05],
  [0, 0.045],
];
const BOWL_OUTER: [number, number][] = [
  [0, 0.05],
  [0.34, 0.05],
  [0.37, 0.0],
  [0.42, 0.05],
  [0.5, 0.14],
  [0.68, 0.36],
  [0.78, 0.58],
  [0.8, 0.66],
  [0.795, 0.68],
  [0.775, 0.68],
  [0.755, 0.6],
  [0.66, 0.38],
  [0.48, 0.18],
  [0.3, 0.12],
  [0, 0.11],
];

function forkGeometry() {
  const s = new THREE.Shape();
  s.moveTo(-0.035, 0);
  s.lineTo(0.035, 0);
  s.lineTo(0.03, 0.62);
  s.quadraticCurveTo(0.08, 0.7, 0.085, 0.8);
  for (let i = 0; i < 4; i++) {
    const x = 0.085 - i * 0.057;
    s.lineTo(x, 1.02);
    s.lineTo(x - 0.03, 1.02);
    s.lineTo(x - 0.03, 0.86);
    if (i < 3) s.lineTo(x - 0.057, 0.86);
  }
  s.lineTo(-0.085, 0.8);
  s.quadraticCurveTo(-0.08, 0.7, -0.03, 0.62);
  s.closePath();
  return new THREE.ExtrudeGeometry(s, { depth: 0.018, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.006, bevelSegments: 3, curveSegments: 12 });
}
function spoonHandle() {
  const s = new THREE.Shape();
  s.moveTo(-0.04, 0);
  s.quadraticCurveTo(0, -0.03, 0.04, 0);
  s.lineTo(0.022, 0.7);
  s.lineTo(-0.022, 0.7);
  s.closePath();
  return new THREE.ExtrudeGeometry(s, { depth: 0.018, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.006, bevelSegments: 3 });
}

export function PlateBowl({ p }: { p: Palette3D }) {
  const m = useMemo(
    () => ({
      plate: ceramic(p.ceramic),
      glaze: new THREE.MeshPhysicalMaterial({ color: p.glaze, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.08 }),
      inner: ceramic(p.ceramic),
      food: new THREE.MeshPhysicalMaterial({ color: p.food, roughness: 0.38, clearcoat: 0.7, clearcoatRoughness: 0.2 }),
      garnish: new THREE.MeshStandardMaterial({ color: p.garnish, roughness: 0.6 }),
      chunk: new THREE.MeshStandardMaterial({ color: new THREE.Color(p.food).lerp(new THREE.Color(p.ink), 0.25), roughness: 0.5 }),
      metal: metal(p.metal),
    }),
    [p],
  );
  const geo = useMemo(() => {
    const inner: [number, number][] = BOWL_OUTER.slice(9).map(([x, y]) => [Math.max(0, x - 0.006), y + 0.004]);
    return {
      plate: lathe(PLATE_PROFILE, 96),
      bowl: lathe(BOWL_OUTER, 96),
      inner: lathe([[0.78, 0.68], ...inner], 96),
      food: new THREE.CircleGeometry(0.7, 64),
      fork: forkGeometry(),
      spoonHandle: spoonHandle(),
      spoonBowl: (() => {
        const g = new THREE.SphereGeometry(1, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
        g.scale(0.13, 0.05, 0.19);
        return g;
      })(),
    };
  }, []);
  const garnish = useMemo(() => Array.from({ length: 9 }, (_, i) => ({ a: i * 2.39, r: 0.12 + ((i * 37) % 50) / 100, chunk: i % 3 === 0 })), []);
  return (
    <group>
      <mesh geometry={geo.plate} material={m.plate} receiveShadow castShadow />
      <group position-y={0.045}>
        <mesh geometry={geo.bowl} material={m.glaze} castShadow />
        <mesh geometry={geo.inner} material={m.inner} />
        <mesh geometry={geo.food} material={m.food} position-y={0.52} rotation-x={-Math.PI / 2} />
        {garnish.map((g, i) =>
          g.chunk ? (
            <RoundedBox
              key={i}
              args={[0.13, 0.08, 0.11]}
              radius={0.03}
              position={[Math.cos(g.a) * g.r, 0.55, Math.sin(g.a) * g.r]}
              rotation-y={g.a}
              material={m.chunk}
            />
          ) : (
            <mesh
              key={i}
              position={[Math.cos(g.a) * g.r, 0.535, Math.sin(g.a) * g.r]}
              rotation={[-Math.PI / 2, 0, g.a]}
              scale={[0.06, 0.03, 0.012]}
              material={m.garnish}
            >
              <sphereGeometry args={[1, 12, 8]} />
            </mesh>
          ),
        )}
        <Steam color={p.steam} alpha={p.steamAlpha} position={[0, 0.55, 0]} width={0.95} height={1.6} />
      </group>
      <mesh geometry={geo.fork} material={m.metal} position={[1.18, 0.07, 0.55]} rotation={[-Math.PI / 2, 0, 0.32]} castShadow />
      <group position={[-1.12, 0.07, 0.62]} rotation={[-Math.PI / 2, 0, -0.38]}>
        <mesh geometry={geo.spoonHandle} material={m.metal} castShadow />
        <mesh geometry={geo.spoonBowl} material={m.metal} position={[0, 0.86, 0.02]} rotation-x={Math.PI / 2} castShadow />
      </group>
    </group>
  );
}

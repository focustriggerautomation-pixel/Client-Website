import { useFrame } from '@react-three/fiber';
import { useMemo } from 'react';
import * as THREE from 'three';

const vertex = /* glsl */ `
  uniform float uTime;
  uniform float uSeed;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec3 p = position;
    float h = uv.y;
    // wisps drift sideways more the higher they rise
    p.x += (sin(h * 5.0 + uTime * 1.1 + uSeed) * 0.09 + sin(h * 11.0 - uTime * 0.8) * 0.025) * h;
    p.z += cos(h * 4.0 + uTime * 0.9 + uSeed) * 0.05 * h;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const fragment = /* glsl */ `
  uniform float uTime;
  uniform float uSeed;
  uniform vec3 uColor;
  uniform float uAlpha;
  varying vec2 vUv;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; }
    return v;
  }
  void main() {
    float t = uTime * 0.32 + uSeed;
    float n = fbm(vec2(vUv.x * 2.6 + uSeed * 3.1, vUv.y * 2.0 - t * 1.5));
    float wisps = smoothstep(0.42, 0.82, n);
    float edge = smoothstep(0.0, 0.38, vUv.x) * smoothstep(1.0, 0.62, vUv.x);
    float vert = smoothstep(0.0, 0.18, vUv.y) * smoothstep(1.0, 0.4, vUv.y);
    gl_FragColor = vec4(uColor, wisps * edge * vert * uAlpha);
    #include <colorspace_fragment>
  }
`;

/** Rising steam: a few crossed planes with an animated fbm-noise shader (no textures, no particles). */
export function Steam({
  color,
  alpha,
  position,
  width = 0.7,
  height = 1.4,
  planes = 3,
}: {
  color: string;
  alpha: number;
  position: [number, number, number];
  width?: number;
  height?: number;
  planes?: number;
}) {
  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(width, height, 1, 40);
    g.translate(0, height / 2, 0);
    return g;
  }, [width, height]);
  const materials = useMemo(
    () =>
      Array.from(
        { length: planes },
        (_, i) =>
          new THREE.ShaderMaterial({
            vertexShader: vertex,
            fragmentShader: fragment,
            transparent: true,
            depthWrite: false,
            side: THREE.DoubleSide,
            uniforms: { uTime: { value: 0 }, uSeed: { value: i * 1.7 + 0.3 }, uColor: { value: new THREE.Color(color) }, uAlpha: { value: alpha } },
          }),
      ),
    [color, alpha, planes],
  );
  useFrame((s) => materials.forEach((m) => (m.uniforms.uTime.value = s.clock.elapsedTime)));
  return (
    <group position={position}>
      {materials.map((m, i) => (
        <mesh key={i} geometry={geometry} material={m} rotation-y={(i * Math.PI) / planes} renderOrder={10} />
      ))}
    </group>
  );
}

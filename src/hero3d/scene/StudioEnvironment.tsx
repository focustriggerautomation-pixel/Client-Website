import { useThree } from '@react-three/fiber';
import { useLayoutEffect } from 'react';
import * as THREE from 'three';

export interface Panel {
  /** 'rect' panel or 'ring' light. */
  form: 'rect' | 'ring';
  position: [number, number, number];
  rotation?: [number, number, number];
  scale: [number, number];
  color?: string;
  intensity: number;
}

/**
 * A studio of glowing panels rendered once into a prefiltered environment map (PMREM) for reflections.
 * Replaces drei's <Environment>/<Lightformer>, which pull HDR/EXR/gainmap loaders (≈42 KB) we never use.
 */
export function StudioEnvironment({ background, panels }: { background: string; panels: Panel[] }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  useLayoutEffect(() => {
    const room = new THREE.Scene();
    room.background = new THREE.Color(background); // reflections pick up the page's own colour, not black
    const disposables: { dispose: () => void }[] = [];
    for (const p of panels) {
      const geo = p.form === 'ring' ? new THREE.RingGeometry(0.42, 0.5, 64) : new THREE.PlaneGeometry(1, 1);
      const mat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(p.color ?? '#ffffff').multiplyScalar(p.intensity),
        side: THREE.DoubleSide,
        toneMapped: false,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(...p.position);
      if (p.rotation) mesh.rotation.set(...p.rotation);
      mesh.scale.set(p.scale[0], p.scale[1], 1);
      room.add(mesh);
      disposables.push(geo, mat);
    }
    const pmrem = new THREE.PMREMGenerator(gl);
    const target = pmrem.fromScene(room, 0.03);
    scene.environment = target.texture;
    pmrem.dispose();
    disposables.forEach((d) => d.dispose());
    return () => {
      scene.environment = null;
      target.dispose();
    };
  }, [gl, scene, background, panels]);
  return null;
}

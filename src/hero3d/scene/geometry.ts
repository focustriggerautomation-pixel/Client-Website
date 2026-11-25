import * as THREE from 'three';

/** Lathe from [radius, height] pairs (y up), smooth and closed at the axis. */
export function lathe(points: [number, number][], segments = 72): THREE.LatheGeometry {
  const g = new THREE.LatheGeometry(
    points.map(([x, y]) => new THREE.Vector2(x, y)),
    segments,
  );
  g.computeVertexNormals();
  return g;
}

/** A roasted coffee bean: a flattened ellipsoid with the centre crease pressed into its flat face. */
export function beanGeometry(): THREE.BufferGeometry {
  const g = new THREE.SphereGeometry(1, 32, 24);
  const pos = g.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    let x = v.x * 0.62;
    let y = v.y * 0.42;
    const z = v.z * 0.9;
    if (v.y > 0) {
      y *= 0.72; // flatter face
      y -= Math.exp(-(x * x) / 0.006) * 0.1 * v.y; // the crease
      x += Math.sin(z * 3) * 0.02 * v.y; // slightly S-shaped, like a real bean
    }
    pos.setXYZ(i, x, y, z);
  }
  g.computeVertexNormals();
  return g;
}

const canvasTexture = (w: number, h: number, draw: (c: CanvasRenderingContext2D) => void) => {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  draw(canvas.getContext('2d')!);
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
};

/** Crema with a latte-art style swirl, painted procedurally in the brand's coffee colours. */
export function cremaTexture(coffee: string, crema: string, highlight: string): THREE.Texture {
  return canvasTexture(512, 512, (c) => {
    const g = c.createRadialGradient(256, 256, 20, 256, 256, 256);
    g.addColorStop(0, crema);
    g.addColorStop(0.62, crema);
    g.addColorStop(0.86, coffee);
    g.addColorStop(1, coffee);
    c.fillStyle = g;
    c.fillRect(0, 0, 512, 512);
    // rosetta-ish swirl
    c.strokeStyle = highlight;
    c.globalAlpha = 0.55;
    c.lineCap = 'round';
    for (let i = 0; i < 5; i++) {
      c.lineWidth = 22 - i * 3;
      c.beginPath();
      c.ellipse(256, 236 + i * 26, 120 - i * 18, 46 - i * 6, 0, Math.PI * 1.05, Math.PI * 1.95);
      c.stroke();
    }
    c.globalAlpha = 0.35;
    c.lineWidth = 8;
    c.beginPath();
    c.moveTo(256, 150);
    c.lineTo(256, 380);
    c.stroke();
  });
}

/** Candy-striped straw. */
export function stripeTexture(a: string, b: string): THREE.Texture {
  const t = canvasTexture(64, 256, (c) => {
    c.fillStyle = a;
    c.fillRect(0, 0, 64, 256);
    c.fillStyle = b;
    for (let y = -64; y < 320; y += 64) {
      c.beginPath();
      c.moveTo(0, y);
      c.lineTo(64, y + 40);
      c.lineTo(64, y + 70);
      c.lineTo(0, y + 30);
      c.fill();
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1, 6);
  return t;
}

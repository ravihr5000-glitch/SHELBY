import * as THREE from 'three';

/**
 * Creates a high-fidelity procedural solar/coronal plasma texture on a 2D canvas
 * Matching the radiant amber-gold fiery surface in the visual reference.
 */
export function createSunPlasmaTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Deep amber background base
  ctx.fillStyle = '#1a0800';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Generate multi-octave cellular turbulence
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;

  // Simple pseudo-random hash for noise
  function noise2D(x: number, y: number): number {
    const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return n - Math.floor(n);
  }

  function smoothNoise(x: number, y: number): number {
    const i = Math.floor(x);
    const j = Math.floor(y);
    const fx = x - i;
    const fy = y - j;
    // Cubic hermite spline
    const u = fx * fx * (3.0 - 2.0 * fx);
    const v = fy * fy * (3.0 - 2.0 * fy);

    const a = noise2D(i, j);
    const b = noise2D(i + 1, j);
    const c = noise2D(i, j + 1);
    const d = noise2D(i + 1, j + 1);

    return a * (1 - u) * (1 - v) + b * u * (1 - v) + c * (1 - u) * v + d * u * v;
  }

  function fbm(x: number, y: number): number {
    let val = 0;
    let amp = 0.5;
    let freq = 1;
    for (let o = 0; o < 4; o++) {
      val += smoothNoise(x * freq, y * freq) * amp;
      freq *= 2.1;
      amp *= 0.48;
    }
    return val;
  }

  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const u = (x / canvas.width) * 12;
      const v = (y / canvas.height) * 6;

      const n = fbm(u, v);
      const idx = (y * canvas.width + x) * 4;

      // Color mapping: dark burnt ember -> fiery orange -> bright golden flare
      const r = Math.min(255, Math.floor(n * 320 + 40));
      const g = Math.min(255, Math.floor(Math.pow(n, 1.6) * 230 + 10));
      const b = Math.min(255, Math.floor(Math.pow(n, 3.2) * 120));

      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);

  // Add high-luminosity solar flare veins
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const radius = 20 + Math.random() * 80;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
    grad.addColorStop(0, 'rgba(255, 220, 120, 0.5)');
    grad.addColorStop(0.4, 'rgba(245, 158, 11, 0.25)');
    grad.addColorStop(1, 'rgba(180, 60, 0, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Creates soft radial glow texture for particle sprites & corona halos
 */
export function createGlowSpriteTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(255, 235, 170, 1)');
  grad.addColorStop(0.2, 'rgba(245, 158, 11, 0.7)');
  grad.addColorStop(0.5, 'rgba(217, 119, 6, 0.25)');
  grad.addColorStop(1, 'rgba(180, 60, 0, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Creates subtle star/spark particle texture
 */
export function createSparkleTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.fillStyle = 'rgba(0,0,0,0)';
  ctx.fillRect(0, 0, 64, 64);

  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
  grad.addColorStop(0.2, 'rgba(251, 191, 36, 0.8)');
  grad.addColorStop(0.6, 'rgba(217, 119, 6, 0.2)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

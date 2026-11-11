"use client";
// Procedural surface textures, drawn once on a canvas (no image files). Each is light grey so the material colour tints it.
import * as THREE from "three";
import type { Tex } from "./kit";

const cache = new Map<string, THREE.CanvasTexture>();

function rand(seed: number) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

function make(size: number, draw: (c: CanvasRenderingContext2D, s: number, r: () => number) => void, seed: number) {
  const cv = document.createElement("canvas");
  cv.width = cv.height = size;
  const c = cv.getContext("2d")!;
  draw(c, size, rand(seed));
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}

const grey = (v: number, a = 1) => `rgba(${v},${v},${v},${a})`;

const DRAW: Record<Tex, (c: CanvasRenderingContext2D, s: number, r: () => number) => void> = {
  // Floorboards: staggered planks with their own tone and a few grain lines each.
  planks(c, s, r) {
    const rows = 8, h = s / rows;
    for (let y = 0; y < rows; y++) {
      let x = -r() * s * 0.4;
      while (x < s) {
        const w = s * (0.35 + r() * 0.3), v = 205 + Math.floor(r() * 45);
        c.fillStyle = grey(v); c.fillRect(x, y * h, w, h);
        for (let i = 0; i < 5; i++) { c.fillStyle = grey(v - 28, 0.35); c.fillRect(x, y * h + r() * h, w, 1); }
        c.fillStyle = grey(110, 0.9); c.fillRect(x + w - 1.5, y * h, 1.5, h);
        x += w;
      }
      c.fillStyle = grey(105, 0.9); c.fillRect(0, y * h, s, 1.5);
    }
  },
  // Furniture wood: long soft streaks.
  grain(c, s, r) {
    c.fillStyle = grey(232); c.fillRect(0, 0, s, s);
    for (let i = 0; i < 70; i++) {
      c.strokeStyle = grey(170 + r() * 50, 0.35); c.lineWidth = 0.6 + r() * 1.6;
      const y = r() * s, k = (r() - 0.5) * 10;
      c.beginPath(); c.moveTo(0, y); c.bezierCurveTo(s * 0.3, y + k, s * 0.7, y - k, s, y); c.stroke();
    }
  },
  // Painted wall: faint blotches, like a roller left them.
  plaster(c, s, r) {
    c.fillStyle = grey(236); c.fillRect(0, 0, s, s);
    for (let i = 0; i < 260; i++) {
      const v = 215 + r() * 40, x = r() * s, y = r() * s, rad = 6 + r() * 26;
      const g = c.createRadialGradient(x, y, 0, x, y, rad);
      g.addColorStop(0, grey(v, 0.16)); g.addColorStop(1, grey(v, 0));
      c.fillStyle = g; c.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    }
  },
  // Woven cloth: a fine cross-hatch.
  fabric(c, s, r) {
    c.fillStyle = grey(228); c.fillRect(0, 0, s, s);
    for (let i = 0; i < s; i += 3) {
      c.fillStyle = grey(190 + r() * 40, 0.4); c.fillRect(i, 0, 1, s);
      c.fillStyle = grey(190 + r() * 40, 0.4); c.fillRect(0, i, s, 1);
    }
  },
  // Felt: dense speckle.
  felt(c, s, r) {
    c.fillStyle = grey(225); c.fillRect(0, 0, s, s);
    for (let i = 0; i < 9000; i++) { c.fillStyle = grey(175 + r() * 80, 0.5); c.fillRect(r() * s, r() * s, 1.2, 1.2); }
  },
  // A whole rug: borders, a field of small diamonds and a centre medallion (the texture is not tiled).
  rug(c, s, r) {
    c.fillStyle = grey(205); c.fillRect(0, 0, s, s);
    const band = (m: number, w: number, v: number) => { c.strokeStyle = grey(v); c.lineWidth = w; c.strokeRect(m, m, s - 2 * m, s - 2 * m); };
    band(s * 0.03, s * 0.03, 250); band(s * 0.075, s * 0.012, 120); band(s * 0.11, s * 0.035, 238); band(s * 0.15, s * 0.008, 130);
    const step = s / 14;
    for (let y = 3; y < 12; y++) for (let x = 3; x < 12; x++) {
      const cx = x * step, cy = y * step, d = step * 0.28;
      c.fillStyle = grey((x + y) % 2 ? 245 : 150, 0.85);
      c.beginPath(); c.moveTo(cx, cy - d); c.lineTo(cx + d, cy); c.lineTo(cx, cy + d); c.lineTo(cx - d, cy); c.closePath(); c.fill();
    }
    c.fillStyle = grey(250); c.beginPath(); c.ellipse(s / 2, s / 2, s * 0.17, s * 0.24, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = grey(135); c.beginPath(); c.ellipse(s / 2, s / 2, s * 0.11, s * 0.17, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = grey(240); c.beginPath(); c.ellipse(s / 2, s / 2, s * 0.045, s * 0.07, 0, 0, Math.PI * 2); c.fill();
    for (let i = 0; i < 2500; i++) { c.fillStyle = grey(120 + r() * 120, 0.25); c.fillRect(r() * s, r() * s, 1.5, 1.5); }
  },
};

/** The shared texture for a pattern. `repeat` is how many times it tiles across a part (a rug never tiles). */
export function texture(name: Tex, repeatX = 1, repeatY = 1) {
  const key = `${name}:${repeatX}:${repeatY}`;
  let t = cache.get(key);
  if (!t) {
    const base = cache.get(name) ?? make(name === "rug" ? 512 : 256, DRAW[name], name.length * 131 + 7);
    cache.set(name, base);
    t = base.clone();
    t.repeat.set(repeatX, repeatY);
    t.needsUpdate = true;
    cache.set(key, t);
  }
  return t;
}

/** Light falling through the window onto the floor: soft-edged panes that fade with distance from the glass. */
export function windowLight() {
  const key = "windowLight";
  const hit = cache.get(key);
  if (hit) return hit;
  const t = make(256, (c, s) => {
    c.clearRect(0, 0, s, s);
    const g = c.createLinearGradient(0, 0, 0, s);
    g.addColorStop(0, "rgba(255,255,255,0.95)"); g.addColorStop(1, "rgba(255,255,255,0)");
    c.fillStyle = g; c.filter = "blur(7px)";
    c.fillRect(s * 0.07, 6, s * 0.4, s * 0.94); c.fillRect(s * 0.53, 6, s * 0.4, s * 0.94);
  }, 1);
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  cache.set(key, t);
  return t;
}

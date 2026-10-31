"use client";
// 그림: hanji paper. Three brush slashes cut across the screen on entry (the screen shakes with each), the title is
// written in brush script, and a red seal stamps down. Drag on the paper to write a stroke; a quick click slashes.
import { useEffect, useRef, useState } from "react";
import type { SceneProps } from "../Stage";
import { recordsLabel } from "../Stage";
import { swish, thud } from "../sfx";

type P = { x: number; y: number };
const INK = "rgba(20, 17, 15, 0.94)";

export default function ArtScene({ room, reduce, openRecords }: SceneProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const [strokes, setStrokes] = useState(0);

  useEffect(() => {
    const cv = canvas.current!, ctx = cv.getContext("2d")!;
    const fit = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      const img = cv.width ? ctx.getImageData(0, 0, cv.width, cv.height) : null;
      cv.width = cv.clientWidth * dpr; cv.height = cv.clientHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (img) ctx.putImageData(img, 0, 0);
    };
    fit();
    window.addEventListener("resize", fit);
    if (reduce) {
      // The settled state: the three strokes already on the paper.
      for (const s of entry(cv)) dab(ctx, s.a, s.b, s.w, 1);
      return () => window.removeEventListener("resize", fit);
    }
    const timers = entry(cv).map((s, i) => setTimeout(() => {
      slash(ctx, s.a, s.b, s.w);
      swish(1.1);
      shake(root.current);
    }, 160 + i * 230));
    return () => { timers.forEach(clearTimeout); window.removeEventListener("resize", fit); };
  }, [reduce]);

  // Drag = write a stroke that thins when fast; a short tap = a slash through the point.
  useEffect(() => {
    const cv = canvas.current!, ctx = cv.getContext("2d")!;
    let pts: (P & { t: number })[] = [];
    const pos = (e: PointerEvent) => { const r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top, t: performance.now() }; };
    const down = (e: PointerEvent) => { cv.setPointerCapture(e.pointerId); pts = [pos(e)]; };
    const move = (e: PointerEvent) => {
      if (!pts.length) return;
      const p = pos(e), q = pts[pts.length - 1];
      const d = Math.hypot(p.x - q.x, p.y - q.y);
      if (d < 2) return;
      const speed = d / Math.max(1, p.t - q.t);
      const w = Math.max(3, 26 - speed * 9);
      dab(ctx, q, p, w, 1);
      pts.push(p);
    };
    const up = (e: PointerEvent) => {
      if (!pts.length) return;
      const a = pts[0], b = pos(e);
      if (pts.length < 4 && Math.hypot(b.x - a.x, b.y - a.y) < 30) {
        const ang = -0.5 + Math.random() * 0.5, len = 260 + Math.random() * 180;
        slash(ctx, { x: b.x - Math.cos(ang) * len / 2, y: b.y - Math.sin(ang) * len / 2 }, { x: b.x + Math.cos(ang) * len / 2, y: b.y + Math.sin(ang) * len / 2 }, 30);
        if (!reduce) shake(root.current);
        swish();
      } else {
        splatter(ctx, b, 5, 10);
        thud();
      }
      pts = [];
      setStrokes((n) => n + 1);
    };
    cv.addEventListener("pointerdown", down);
    cv.addEventListener("pointermove", move);
    cv.addEventListener("pointerup", up);
    return () => { cv.removeEventListener("pointerdown", down); cv.removeEventListener("pointermove", move); cv.removeEventListener("pointerup", up); };
  }, [reduce]);

  return (
    <div ref={root} className="art-root">
      <canvas ref={canvas} className="art-canvas" aria-label="먹으로 쓰는 한지. 끌어서 획을 긋고, 짧게 누르면 붓이 지나가요." />
      <div className="art-copy">
        <h1 className="art-title" data-reduce={reduce || undefined}>{room.label}</h1>
        <span className="art-seal" aria-hidden>零<br />宗</span>
        <p className="art-desc">{room.desc}</p>
        <p className="art-update">{room.update}</p>
        <button className="art-cta" onClick={openRecords}>{recordsLabel("art")} 펼치기</button>
      </div>
      <p className="art-hint" aria-live="polite">{strokes ? `${strokes}획` : "종이 위를 그어 보세요"}</p>
    </div>
  );
}

/** The three entry slashes, placed relative to the screen. */
function entry(cv: HTMLCanvasElement) {
  const w = cv.clientWidth, h = cv.clientHeight;
  return [
    { a: { x: w * 0.08, y: h * 0.16 }, b: { x: w * 0.94, y: h * 0.42 }, w: Math.min(w, h) * 0.07 },
    { a: { x: w * 0.88, y: h * 0.08 }, b: { x: w * 0.52, y: h * 0.94 }, w: Math.min(w, h) * 0.05 },
    { a: { x: w * 0.42, y: h * 0.74 }, b: { x: w * 0.97, y: h * 0.62 }, w: Math.min(w, h) * 0.035 },
  ];
}

function shake(el: HTMLElement | null) {
  if (!el) return;
  el.classList.remove("shake");
  void el.offsetWidth;
  el.classList.add("shake");
}

/** One brush slash from a to b over ~130ms: a curved path, swelling then tapering, with dry-brush streaks at the tail. */
function slash(ctx: CanvasRenderingContext2D, a: P, b: P, width: number) {
  const nx = -(b.y - a.y), ny = b.x - a.x, len = Math.hypot(nx, ny) || 1;
  const bend = (Math.random() - 0.5) * 0.25 * len;
  const c = { x: (a.x + b.x) / 2 + (nx / len) * bend, y: (a.y + b.y) / 2 + (ny / len) * bend };
  const at = (t: number) => ({ x: (1 - t) ** 2 * a.x + 2 * (1 - t) * t * c.x + t * t * b.x, y: (1 - t) ** 2 * a.y + 2 * (1 - t) * t * c.y + t * t * b.y });
  const start = performance.now(), dur = 130;
  let last = 0;
  const step = (now: number) => {
    const T = Math.min(1, (now - start) / dur);
    for (let t = last; t <= T; t += 0.004) {
      const p = at(t);
      const r = width * Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.15)), 0.5) * (1 - 0.35 * t) / 2;
      ctx.fillStyle = INK;
      ctx.beginPath(); ctx.arc(p.x + (Math.random() - 0.5) * 1.5, p.y + (Math.random() - 0.5) * 1.5, Math.max(0.6, r), 0, Math.PI * 2); ctx.fill();
      if (t > 0.6) streaks(ctx, p, at(Math.min(1, t + 0.004)), r);
    }
    last = T;
    if (T < 1) requestAnimationFrame(step);
    else splatter(ctx, b, 9, width / 3, { x: b.x - a.x, y: b.y - a.y });
  };
  requestAnimationFrame(step);
}

/** Dry bristles: thin parallel lines with gaps beside the path. */
function streaks(ctx: CanvasRenderingContext2D, p: P, q: P, r: number) {
  const dx = q.x - p.x, dy = q.y - p.y, l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
  ctx.strokeStyle = "rgba(20,17,15,0.5)"; ctx.lineWidth = 0.8;
  for (let i = -3; i <= 3; i++) {
    if (Math.random() < 0.45) continue;
    const o = (i / 3) * r * 1.3;
    ctx.beginPath(); ctx.moveTo(p.x + nx * o, p.y + ny * o); ctx.lineTo(q.x + nx * o + dx * 2, q.y + ny * o + dy * 2); ctx.stroke();
  }
}

/** A soft round dab between two points (the drawn stroke). */
function dab(ctx: CanvasRenderingContext2D, a: P, b: P, w: number, alpha: number) {
  const n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 2));
  ctx.fillStyle = INK; ctx.globalAlpha = alpha;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    ctx.beginPath(); ctx.arc(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, w / 2, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/** Ink drops flung forward from the end of a stroke. */
function splatter(ctx: CanvasRenderingContext2D, p: P, n: number, size: number, dir: P = { x: 0, y: 0 }) {
  const l = Math.hypot(dir.x, dir.y) || 1;
  ctx.fillStyle = INK;
  for (let i = 0; i < n; i++) {
    const f = 10 + Math.random() * 90;
    const x = p.x + (dir.x / l) * f + (Math.random() - 0.5) * 60, y = p.y + (dir.y / l) * f + (Math.random() - 0.5) * 60;
    ctx.beginPath(); ctx.arc(x, y, Math.random() * size * 0.5 + 1, 0, Math.PI * 2); ctx.fill();
  }
}

"use client";
// 테트리스: a four-green handheld screen where a small bot plays by itself, choosing each drop by the classic heuristic
// (height, holes, bumpiness, lines). Full rows flash and clear. Space or a click hard-drops the falling piece.
import { useEffect, useRef, useState } from "react";
import type { SceneProps } from "../Stage";
import { recordsLabel } from "../Stage";
import { blip } from "../sfx";

const W = 10, H = 18;
const SHAPES: number[][][] = [
  [[0, 0], [1, 0], [2, 0], [3, 0]], // I
  [[0, 0], [1, 0], [0, 1], [1, 1]], // O
  [[0, 0], [1, 0], [2, 0], [1, 1]], // T
  [[1, 0], [2, 0], [0, 1], [1, 1]], // S
  [[0, 0], [1, 0], [1, 1], [2, 1]], // Z
  [[0, 0], [0, 1], [1, 1], [2, 1]], // J
  [[2, 0], [0, 1], [1, 1], [2, 1]], // L
];
const PAL = ["#9bbc0f", "#8bac0f", "#306230", "#0f380f"];
type Grid = number[][];

const rotate = (s: number[][]) => {
  const r = s.map(([x, y]) => [-y, x]);
  const mx = Math.min(...r.map((p) => p[0])), my = Math.min(...r.map((p) => p[1]));
  return r.map(([x, y]) => [x - mx, y - my]);
};
const rotations = (s: number[][]) => { const out = [s]; for (let i = 0; i < 3; i++) out.push(rotate(out[out.length - 1])); return out; };
const fits = (g: Grid, s: number[][], x: number, y: number) => s.every(([dx, dy]) => {
  const cx = x + dx, cy = y + dy;
  return cx >= 0 && cx < W && cy < H && (cy < 0 || !g[cy][cx]);
});
const place = (g: Grid, s: number[][], x: number, y: number, v: number) => { const n = g.map((r) => [...r]); s.forEach(([dx, dy]) => { if (y + dy >= 0) n[y + dy][x + dx] = v; }); return n; };
const full = (g: Grid) => g.map((r, i) => (r.every(Boolean) ? i : -1)).filter((i) => i >= 0);

/** Where the bot drops a piece: try every rotation and column, score the resulting board. */
function choose(g: Grid, shape: number[][]) {
  let best = { s: shape, x: 0, score: -Infinity };
  for (const s of rotations(shape)) {
    const w = Math.max(...s.map((p) => p[0])) + 1;
    for (let x = 0; x + w <= W; x++) {
      let y = -2;
      if (!fits(g, s, x, y)) continue;
      while (fits(g, s, x, y + 1)) y++;
      const n = place(g, s, x, y, 1);
      const heights = Array.from({ length: W }, (_, c) => { const r = n.findIndex((row) => row[c]); return r < 0 ? 0 : H - r; });
      const holes = heights.reduce((sum, h, c) => sum + n.slice(H - h).filter((row) => !row[c]).length, 0);
      const bump = heights.slice(1).reduce((sum, h, i) => sum + Math.abs(h - heights[i]), 0);
      const score = -0.51 * heights.reduce((a, b) => a + b, 0) + 0.76 * full(n).length - 0.36 * holes - 0.18 * bump;
      if (score > best.score) best = { s, x, score };
    }
  }
  return best;
}

export default function TetrisScene({ room, reduce, openRecords }: SceneProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const drop = useRef(false);
  const [lines, setLines] = useState(0);

  useEffect(() => {
    const cv = canvas.current!, ctx = cv.getContext("2d")!;
    const cell = 18;
    cv.width = W * cell; cv.height = H * cell;
    let grid: Grid = Array.from({ length: H }, () => Array(W).fill(0));
    let cur = { s: SHAPES[0], x: 0, y: -2, v: 2 };
    let flash: number[] = [], flashT = 0, last = 0, cleared = 0, raf = 0;

    const spawn = () => {
      const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
      const b = choose(grid, shape);
      cur = { s: b.s, x: b.x, y: -2, v: 2 + Math.floor(Math.random() * 2) };
      if (!fits(grid, cur.s, cur.x, cur.y)) grid = Array.from({ length: H }, () => Array(W).fill(0)); // topped out: fresh board
    };
    const draw = () => {
      ctx.fillStyle = PAL[0]; ctx.fillRect(0, 0, cv.width, cv.height);
      const g = place(grid, cur.s, cur.x, cur.y, cur.v);
      g.forEach((row, y) => row.forEach((v, x) => {
        if (!v) return;
        const lit = flash.includes(y) && Math.floor(flashT / 80) % 2 === 0;
        ctx.fillStyle = lit ? PAL[1] : PAL[v];
        ctx.fillRect(x * cell + 1, y * cell + 1, cell - 2, cell - 2);
        ctx.fillStyle = PAL[1]; ctx.fillRect(x * cell + 4, y * cell + 4, cell - 8, cell - 8);
        ctx.fillStyle = lit ? PAL[1] : PAL[v]; ctx.fillRect(x * cell + 6, y * cell + 6, cell - 12, cell - 12);
      }));
    };
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (flash.length) {
        flashT += now - last; last = now;
        if (flashT > 420) {
          grid = grid.filter((_, i) => !flash.includes(i));
          while (grid.length < H) grid.unshift(Array(W).fill(0));
          cleared += flash.length; setLines(cleared); flash = []; spawn();
        }
        draw(); return;
      }
      const speed = drop.current ? 8 : 70;
      if (now - last < speed) return;
      last = now;
      if (fits(grid, cur.s, cur.x, cur.y + 1)) cur.y++;
      else {
        grid = place(grid, cur.s, cur.x, cur.y, cur.v);
        drop.current = false;
        blip(180, 0.03);
        const f = full(grid);
        if (f.length) { flash = f; flashT = 0; blip(880, 0.1); setTimeout(() => blip(1320, 0.12), 100); }
        else spawn();
      }
      draw();
    };
    spawn(); draw();
    if (reduce) {
      // A settled board instead of a running game.
      for (let i = 0; i < 14; i++) { let y = -2; while (fits(grid, cur.s, cur.x, y + 1)) y++; grid = place(grid, cur.s, cur.x, y, cur.v); grid = grid.filter((r) => !r.every(Boolean)); while (grid.length < H) grid.unshift(Array(W).fill(0)); spawn(); }
      draw();
      return;
    }
    raf = requestAnimationFrame(tick);
    const key = (e: KeyboardEvent) => { if (e.code === "Space") { e.preventDefault(); drop.current = true; } };
    window.addEventListener("keydown", key);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("keydown", key); };
  }, [reduce]);

  return (
    <div className="gb-root">
      <div className="gb-device">
        <div className="gb-screen">
          <canvas ref={canvas} onClick={() => { drop.current = true; }} aria-label="혼자 노는 테트리스. 누르면 블록이 바로 떨어져요." />
          <div className="gb-side">
            <span>LINES</span><b>{String(lines).padStart(3, "0")}</b>
            <span>MODE</span><b>2:00</b>
          </div>
        </div>
        <p className="gb-brand">0ZONG BOY</p>
      </div>
      <div className="gb-copy">
        <h1 className="gb-title">{room.label}</h1>
        <p className="gb-desc">{room.desc}</p>
        <p className="gb-update">{room.update}</p>
        <button className="gb-cta" onClick={openRecords}>{recordsLabel("tetris")}</button>
        <p className="gb-hint">Space · 클릭으로 바로 떨어뜨리기</p>
      </div>
    </div>
  );
}

"use client";
// 체스: the board floods the screen tile by tile in a diagonal wave and a knight hops its L across it. This is sniper
// chess, so the pointer is a scope: click a square to shoot, and whatever stood there topples.
import { useEffect, useRef, useState } from "react";
import type { SceneProps } from "../Stage";
import { recordsLabel } from "../Stage";
import { clack, thud } from "../sfx";

// A middlegame position: row 0 is the top (black's side).
const START: Record<string, string> = {
  "0,0": "♜", "0,4": "♚", "0,7": "♜", "1,0": "♟", "1,1": "♟", "1,5": "♟", "1,6": "♟", "1,7": "♟", "2,2": "♞", "2,5": "♝", "3,3": "♟",
  "4,4": "♙", "5,2": "♘", "5,5": "♗", "6,0": "♙", "6,1": "♙", "6,5": "♙", "6,6": "♙", "6,7": "♙", "7,0": "♖", "7,3": "♕", "7,6": "♔",
};
const KNIGHT_PATH = [[7, 1], [5, 2], [3, 1], [1, 2], [2, 4], [4, 5], [6, 6], [4, 7]];

export default function ChessScene({ room, reduce, openRecords }: SceneProps) {
  const [pieces, setPieces] = useState(START);
  const [fallen, setFallen] = useState<Set<string>>(new Set());
  const [shots, setShots] = useState<{ id: number; r: number; c: number }[]>([]);
  const [hop, setHop] = useState(0);
  const scope = useRef<HTMLDivElement>(null);
  const board = useRef<HTMLDivElement>(null);

  // The knight's tour across the board, one jump every 0.9s.
  useEffect(() => {
    if (reduce) return;
    const t = setInterval(() => { setHop((h) => (h + 1) % KNIGHT_PATH.length); clack(1.6); }, 900);
    return () => clearInterval(t);
  }, [reduce]);

  useEffect(() => {
    const b = board.current!, s = scope.current!;
    const move = (e: PointerEvent) => { s.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`; s.style.opacity = "1"; };
    const leave = () => { s.style.opacity = "0"; };
    b.addEventListener("pointermove", move);
    b.addEventListener("pointerleave", leave);
    return () => { b.removeEventListener("pointermove", move); b.removeEventListener("pointerleave", leave); };
  }, []);

  const shoot = (r: number, c: number) => {
    const key = `${r},${c}`, id = Date.now();
    setShots((s) => [...s.slice(-4), { id, r, c }]);
    thud();
    if (pieces[key] && !fallen.has(key)) {
      setFallen((f) => new Set(f).add(key));
      setTimeout(() => setPieces((p) => { const n = { ...p }; delete n[key]; return n; }), 700);
    }
  };

  const [kr, kc] = KNIGHT_PATH[hop];
  return (
    <div className="chess-root">
      <div className="chess-copy">
        <h1 className="chess-title">{room.label}</h1>
        <p className="chess-desc">{room.desc}</p>
        <p className="chess-update">{room.update}</p>
        <button className="chess-cta" onClick={openRecords}>{recordsLabel("chess")}</button>
      </div>
      <div ref={board} className="chessboard" data-reduce={reduce || undefined} role="grid" aria-label="저격 체스판. 칸을 누르면 쏴요.">
        {Array.from({ length: 64 }, (_, i) => {
          const r = Math.floor(i / 8), c = i % 8, key = `${r},${c}`;
          return (
            <button key={key} className="sq" data-dark={(r + c) % 2 === 1 || undefined} style={{ ["--d" as string]: r + c }}
              onClick={() => shoot(r, c)} aria-label={`${String.fromCharCode(97 + c)}${8 - r}${pieces[key] ? ` ${pieces[key]}` : ""}`}>
              {pieces[key] && <span className="pc" data-fallen={fallen.has(key) || undefined}>{pieces[key]}</span>}
            </button>
          );
        })}
        <span className="knight" aria-hidden style={{ ["--r" as string]: kr, ["--c" as string]: kc }}>♘</span>
        {shots.map((s) => <span key={s.id} className="shot" style={{ ["--r" as string]: s.r, ["--c" as string]: s.c }} aria-hidden />)}
      </div>
      <div ref={scope} className="scope" aria-hidden />
    </div>
  );
}

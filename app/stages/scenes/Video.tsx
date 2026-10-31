"use client";
// 영상: a VHS tape. Blue screen and a PLAY readout, then the room itself plays back as worn tape: tracking bands roll
// down, the title splits into red and cyan, the counter runs. Click the picture to pause (the frame jitters).
import { useEffect, useRef, useState } from "react";
import type { SceneProps } from "../Stage";
import { recordsLabel } from "../Stage";
import { DEMO } from "@/lib/client";
import { blip } from "../sfx";

const tc = (s: number) => [Math.floor(s / 3600), Math.floor(s / 60) % 60, Math.floor(s) % 60].map((v) => String(v).padStart(2, "0")).join(":");

export default function VideoScene({ room, reduce, openRecords }: SceneProps) {
  const [tape, setTape] = useState(reduce);
  const [paused, setPaused] = useState(false);
  const counter = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (reduce) return;
    blip(440, 0.12, "sine");
    const t = setTimeout(() => setTape(true), 900);
    return () => clearTimeout(t);
  }, [reduce]);

  // The tape counter, written straight to the DOM (no re-render per frame).
  useEffect(() => {
    let raf = 0, t = 0, prev = performance.now();
    const loop = (now: number) => {
      if (!paused) t += (now - prev) / 1000;
      prev = now;
      if (counter.current) counter.current.textContent = tc(t + 12 * 60 + 7);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [paused]);

  return (
    <div className="vhs-root" data-tape={tape || undefined} data-paused={paused || undefined}>
      {tape && (
        <button className="vhs-picture" onClick={() => { setPaused((p) => !p); blip(paused ? 660 : 330, 0.06); }}
          aria-label={paused ? "다시 재생" : "일시정지"}>
          <span className="vhs-img" style={{ backgroundImage: `url(${DEMO ? "" : "/"}room/main.jpg)` }} />
          <span className="vhs-img r" style={{ backgroundImage: `url(${DEMO ? "" : "/"}room/main.jpg)` }} />
          <span className="vhs-band" /><span className="vhs-band b2" />
        </button>
      )}
      <div className="vhs-osd" aria-hidden>
        <span>{tape ? (paused ? "❚❚ PAUSE" : "▶ PLAY") : "▶ PLAY"}</span>
        <span>SP</span>
      </div>
      <div className="vhs-copy">
        <h1 className="vhs-title" data-text={room.label}>{room.label}</h1>
        <p className="vhs-desc">{room.desc}</p>
        <button className="vhs-cta" onClick={openRecords}>⏏ {recordsLabel("video")}</button>
      </div>
      <div className="vhs-counter" aria-hidden>CH 03 <span ref={counter}>00:12:07</span></div>
    </div>
  );
}

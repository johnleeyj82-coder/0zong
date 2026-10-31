"use client";
// 영화: the lights go out, a film leader counts 3, 2, 1 with a sweeping hand and grain, then the title comes up like
// opening credits under a projector beam full of dust. The ticket stub opens the screening log.
import { useEffect, useState } from "react";
import type { SceneProps } from "../Stage";
import { recordsLabel } from "../Stage";
import { clack, thud } from "../sfx";

export default function MovieScene({ room, reduce, openRecords }: SceneProps) {
  const [n, setN] = useState(reduce ? 0 : 3);

  useEffect(() => {
    if (reduce) return;
    clack(0.6);
    const t = [1, 2, 3].map((i) => setTimeout(() => { setN(3 - i); if (i < 3) clack(0.6); else thud(); }, i * 800));
    return () => t.forEach(clearTimeout);
  }, [reduce]);

  return (
    <div className="movie-root">
      {n > 0 ? (
        <div className="leader" aria-hidden>
          <div className="leader-ring" />
          <div className="leader-sweep" key={n} />
          <span className="leader-n">{n}</span>
          <div className="grain" />
        </div>
      ) : (
        <div className="screening">
          <div className="beam" aria-hidden>{Array.from({ length: 26 }, (_, i) => <i key={i} style={{ ["--i" as string]: i }} />)}</div>
          <div className="credits">
            <p className="credits-pre">오늘 밤의 상영작</p>
            <h1 className="credits-title">{room.label}</h1>
          </div>
          <p className="subtitle">{room.desc}</p>
          <button className="ticket" onClick={openRecords}>
            <span className="ticket-main"><small>ADMIT ONE</small><b>{recordsLabel("movie")}</b><em>{room.update}</em></span>
            <span className="ticket-stub">0Z<br />01</span>
          </button>
          <div className="grain" aria-hidden />
        </div>
      )}
    </div>
  );
}

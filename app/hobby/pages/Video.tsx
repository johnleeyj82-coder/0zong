"use client";
// 영상 — 편집실. An editing timeline: every piece is a clip on the track, placed by the day it was made. The monitor
// above shows the clip under the playhead as a slate (intent as the big line, what I learned and what is next as markers).
import { useEffect, useMemo, useRef, useState } from "react";
import { animate, stagger } from "animejs";
import { md } from "@/lib/time";
import { useHobby } from "../Shell";
import { useAnime } from "../anime";

const DAY = 86_400_000;
const tc = (i: number, n: number) => `00:${String(i + 1).padStart(2, "0")}:${String(Math.round(((i + 1) / n) * 59)).padStart(2, "0")}:12`;

export default function VideoPage() {
  const { entries, ready } = useHobby();
  const root = useRef<HTMLDivElement>(null);
  // Oldest on the left, like a timeline.
  const clips = useMemo(() => [...entries].sort((a, b) => a.at - b.at), [entries]);
  const [at, setAt] = useState(-1);
  const i = at < 0 ? clips.length - 1 : Math.min(at, clips.length - 1);
  const cur = clips[i];
  const span = useMemo(() => {
    if (!clips.length) return { from: 0, len: 1 };
    const from = clips[0].at - 4 * DAY, to = Date.now() + 2 * DAY;
    return { from, len: to - from };
  }, [clips]);
  const pos = (t: number) => ((t - span.from) / span.len) * 100;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") setAt(Math.max(0, i - 1));
      if (e.key === "ArrowRight") setAt(Math.min(clips.length - 1, i + 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [i, clips.length]);

  useAnime(root, () => {
    animate(".clip", { scaleX: [0, 1], opacity: [0, 1], duration: 700, delay: stagger(110), ease: "outExpo" });
    animate(".wave i", { scaleY: [0, 1], duration: 500, delay: stagger(6, { start: 300 }), ease: "outQuad" });
  }, [ready, clips.length]);

  useAnime(root, () => {
    animate(".slate > *", { opacity: [0, 1], y: [10, 0], duration: 500, delay: stagger(70), ease: "outQuad" });
    animate(".monitor", { filter: ["brightness(2.2) saturate(0)", "brightness(1) saturate(1)"], duration: 420, ease: "outQuad" });
  }, [ready, cur?.id]);

  return (
    <div ref={root} className="vd-page">
      <header className="vd-bar">
        <h1>편집실</h1>
        <span className="vd-tc">{cur ? tc(i, clips.length) : "00:00:00:00"}</span>
        <span className="vd-rec">{clips.length} CLIPS</span>
      </header>

      <section className="monitor" aria-live="polite" aria-label="모니터">
        {cur ? (
          <div className="slate" key={cur.id}>
            <small>SCENE {String(i + 1).padStart(2, "0")} · {md(cur.at)}{cur.example && " · 예시"}</small>
            <h2>{cur.title}</h2>
            {cur.notes[0] && <p className="intent">{cur.notes[0]}</p>}
            <dl>
              {cur.notes[1] && <div><dt>배운 것</dt><dd>{cur.notes[1]}</dd></div>}
              {cur.notes[2] && <div><dt>다음에 할 것</dt><dd>{cur.notes[2]}</dd></div>}
            </dl>
          </div>
        ) : ready && <p className="vd-empty">아직 올린 작품이 없어요. 첫 작품을 기록하면 타임라인에 클립이 놓여요.</p>}
        <span className="safe" aria-hidden />
      </section>

      {clips.length > 0 && (
        <section className="timeline" aria-label="타임라인. 좌우 화살표로 클립을 옮겨요.">
          <div className="ruler" aria-hidden>{Array.from({ length: 24 }, (_, k) => <i key={k} />)}</div>
          <div className="track">
            <span className="track-name">V1</span>
            <div className="lane">
              {clips.map((c, k) => (
                <button key={c.id} className="clip" aria-pressed={k === i} style={{ left: `${pos(c.at)}%`, ["--k" as string]: k, ["--n" as string]: clips.length }} onClick={() => setAt(k)}>
                  <b>{c.title}</b>
                </button>
              ))}
              <span className="playhead" style={{ left: `${cur ? pos(cur.at) : 0}%`, ["--k" as string]: i, ["--n" as string]: clips.length }} aria-hidden />
            </div>
          </div>
          <div className="track">
            <span className="track-name">A1</span>
            <div className="lane wave" aria-hidden>{Array.from({ length: 120 }, (_, k) => <i key={k} style={{ height: `${18 + Math.abs(Math.sin(k * 1.7) * Math.cos(k * 0.31)) * 82}%` }} />)}</div>
          </div>
          <p className="vd-hint">← → 로 클립을 옮겨요</p>
        </section>
      )}
    </div>
  );
}

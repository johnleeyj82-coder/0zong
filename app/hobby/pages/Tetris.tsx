"use client";
// 테트리스 — HI-SCORE. An arcade score table on a four-green screen: each record's lines are stacked as blocks that
// fill in one by one, the top score blinks, and pieces keep falling down the side of the screen.
import { useMemo, useRef } from "react";
import { animate, stagger } from "animejs";
import { md } from "@/lib/time";
import { useHobby } from "../Shell";
import { useAnime } from "../anime";

const CELLS = 24;
const SHAPES = [[[0, 0], [1, 0], [2, 0], [3, 0]], [[0, 0], [1, 0], [0, 1], [1, 1]], [[0, 0], [1, 0], [2, 0], [1, 1]], [[1, 0], [2, 0], [0, 1], [1, 1]], [[0, 0], [0, 1], [1, 1], [2, 1]]];

export default function TetrisPage() {
  const { entries, ready } = useHobby();
  const root = useRef<HTMLDivElement>(null);
  const ranked = useMemo(() => [...entries].sort((a, b) => (b.value ?? 0) - (a.value ?? 0)).slice(0, 10), [entries]);
  const hi = ranked[0]?.value ?? 0;

  useAnime(root, () => {
    animate(".tt-row", { opacity: [0, 1], x: [-24, 0], duration: 320, delay: stagger(90), ease: "steps(4)" });
    animate(".tt-blocks i[data-on]", { opacity: [0, 1], scale: [0, 1], duration: 160, delay: stagger(14, { start: 400 }), ease: "steps(2)" });
    root.current!.querySelectorAll(".tt-fall").forEach((el, i) => {
      animate(el, { y: ["-20vh", "110vh"], duration: 5200 + i * 900, delay: i * 1300, loop: true, ease: "steps(26)" });
    });
  }, [ready, ranked.length]);

  return (
    <div ref={root} className="tt-page">
      <div className="tt-rain" aria-hidden>
        {SHAPES.map((s, i) => (
          <span key={i} className="tt-fall" style={{ left: `${6 + i * 21}%` }}>{s.map(([x, y], j) => <i key={j} style={{ left: x * 18, top: y * 18 }} />)}</span>
        ))}
      </div>
      <div className="tt-screen">
        <header className="tt-head">
          <span>1UP</span>
          <h1>HI-SCORE<b>{String(hi).padStart(3, "0")}</b></h1>
          <span>2:00</span>
        </header>
        <p className="tt-sub">2분 동안 지운 줄 수. 이름을 안 적으면 방명록 이름으로 남아요.</p>

        {ready && !ranked.length && <p className="tt-empty">NO RECORD<br /><span>아직 기록이 없어요. 첫 기록이 올라오면 여기에 떠요.</span></p>}

        <ol className="tt-table">
          {ranked.map((e, i) => {
            const on = hi ? Math.max(1, Math.round(((e.value ?? 0) / hi) * CELLS)) : 0;
            return (
              <li key={e.id} className="tt-row" data-top={i === 0 || undefined}>
                <span className="tt-rank">{["1ST", "2ND", "3RD"][i] ?? `${i + 1}TH`}</span>
                <b>{e.title}</b>
                <span className="tt-blocks" aria-hidden>{Array.from({ length: CELLS }, (_, c) => <i key={c} data-on={c < on || undefined} />)}</span>
                <strong>{String(e.value ?? 0).padStart(3, "0")}</strong>
                <time>{md(e.at)}{e.example && " 예시"}</time>
              </li>
            );
          })}
        </ol>
        <p className="tt-coin">2분 모드는 준비 중이에요</p>
      </div>
    </div>
  );
}

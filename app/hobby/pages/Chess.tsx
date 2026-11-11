"use client";
// 체스 — 단계 사다리. The leaderboard as a tower: one board row per stage, and every player is a piece that climbs to
// the highest stage they cleared. The leader wears the crown. Pick a mode to see only that ladder.
import { useMemo, useRef, useState } from "react";
import { animate, stagger } from "animejs";
import { md } from "@/lib/time";
import { useHobby } from "../Shell";
import { useAnime } from "../anime";

const PIECES = ["♛", "♜", "♝", "♞", "♟", "♟", "♟", "♟"];

export default function ChessPage() {
  const { entries, ready } = useHobby();
  const root = useRef<HTMLDivElement>(null);
  const modes = useMemo(() => [...new Set(entries.map((e) => e.tag || "기타"))], [entries]);
  const [mode, setMode] = useState<string | null>(null);
  const cur = mode && modes.includes(mode) ? mode : null;
  const ranked = useMemo(() => [...(cur ? entries.filter((e) => (e.tag || "기타") === cur) : entries)].sort((a, b) => (b.value ?? 0) - (a.value ?? 0)).slice(0, 8), [entries, cur]);
  const top = Math.max(1, ...ranked.map((e) => e.value ?? 0));
  const ROW = 44;

  useAnime(root, () => {
    animate(".rung i", { opacity: [0, 1], scale: [0.4, 1], duration: 420, delay: stagger(12, { from: "last" }), ease: "outQuad" });
    // Every piece starts on the ground and climbs one rung at a time to its stage.
    animate(".climber", {
      y: { from: (el: unknown) => Number((el as HTMLElement).dataset.stage) * ((el as HTMLElement).offsetHeight || ROW), to: 0 },
      duration: (el: unknown) => 500 + Number((el as HTMLElement).dataset.stage) * 170,
      delay: stagger(140, { start: 500 }), ease: "steps(" + top + ")",
    });
    animate(".crown", { y: [-30, 0], opacity: [0, 1], rotate: [-25, 0], duration: 700, delay: 900 + top * 170, ease: "outBounce" });
  }, [ready, ranked.length, cur, top]);

  return (
    <div ref={root} className="ch-page">
      <header className="ch-head">
        <h1>단계 사다리</h1>
        <p>말을 옮기려면 저격이나 가위바위보를 이겨야 하는 변형 체스. 누가 몇 단계까지 올라갔는지 남겨요.</p>
        <div className="ch-modes" role="group" aria-label="모드">
          <button aria-pressed={!cur} onClick={() => setMode(null)}>전체</button>
          {modes.map((m) => <button key={m} aria-pressed={cur === m} onClick={() => setMode(m)}>{m}</button>)}
        </div>
      </header>

      {ready && !entries.length && <p className="ch-empty">아직 기록이 없어요. 첫 기록을 남기면 말이 사다리를 올라요.</p>}

      {ranked.length > 0 && (
        <div className="ch-body">
          <div className="tower" style={{ ["--rows" as string]: top, ["--cols" as string]: ranked.length, ["--row" as string]: `${ROW}px` }} role="img" aria-label={`가장 높은 단계는 ${top}단계`}>
            {Array.from({ length: top }, (_, r) => (
              <div key={r} className="rung">
                <span style={{ gridColumn: 1, gridRow: r + 1 }}>{top - r}</span>
                {ranked.map((_, c) => <i key={c} data-dark={(r + c) % 2 === 1 || undefined} style={{ gridColumn: c + 2, gridRow: r + 1 }} />)}
              </div>
            ))}
            {ranked.map((e, c) => (
              <span key={e.id} className="climber" data-stage={e.value ?? 0} style={{ gridColumn: c + 2, gridRow: top - (e.value ?? 0) + 1 }}>
                {c === 0 && <b className="crown" aria-hidden>♔</b>}
                {PIECES[c] ?? "♟"}
              </span>
            ))}
          </div>
          <ol className="ch-list">
            {ranked.map((e, i) => (
              <li key={e.id}>
                <span className="ch-rank">{i + 1}</span><span className="ch-piece" aria-hidden>{PIECES[i] ?? "♟"}</span>
                <b>{e.title}</b><em>{e.tag ?? "기타"}</em><strong>{e.value ?? 0}<small>단계</small></strong>
                <time>{md(e.at)}{e.example && " · 예시"}</time>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

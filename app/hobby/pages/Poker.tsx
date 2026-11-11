"use client";
// 포커 — 장부. A ledger on felt: the running total in big blinds as a gold line, every session as a row with its chips
// stacked (green won, red lost), and the three game modes as cards that are still face down.
import { useMemo, useRef, useState } from "react";
import { animate, stagger, utils } from "animejs";
import { ChartTooltip, Grid, Line, LineChart, XAxis } from "@/components/charts";
import { md } from "@/lib/time";
import { fmt } from "../../rooms/schema";
import { useHobby } from "../Shell";
import { useAnime } from "../anime";

const MODES = [["튜토리얼", "홀덤을 처음 해보는 사람을 위한 단계별 안내", "A"], ["AI와 한 판", "혼자 연습하기. 레이즈 크기가 몇 BB인지 보여줘요", "K"], ["실시간 방", "방장이 블라인드를 정하고 친구들과 한 테이블에", "Q"]];

export default function PokerPage() {
  const { entries, ready } = useHobby();
  const root = useRef<HTMLDivElement>(null);
  const total = useRef<HTMLElement>(null);
  const [flipped, setFlipped] = useState<number | null>(null);

  const s = useMemo(() => {
    const asc = [...entries].sort((a, b) => a.at - b.at);
    let run = 0;
    const line = asc.map((e) => ({ date: new Date(e.at), bb: (run += e.value ?? 0) }));
    const wins = entries.filter((e) => (e.value ?? 0) > 0).length;
    return { line, sum: run, wins, best: Math.max(0, ...entries.map((e) => e.value ?? 0)) };
  }, [entries]);

  useAnime(root, () => {
    const n = { v: 0 };
    animate(n, { v: s.sum, duration: 1400, ease: "outExpo", onUpdate: () => { if (total.current) total.current.textContent = fmt.signed(Math.round(n.v)); } });
    animate(".pk-row", { opacity: [0, 1], x: [-20, 0], duration: 600, delay: stagger(70, { start: 300 }), ease: "outQuad" });
    animate(".pk-chips i", { y: [-40, 0], opacity: [0, 1], duration: 380, delay: stagger(22, { start: 500 }), ease: "outBounce" });
    animate(".pk-mode", { y: [-120, 0], rotate: { from: () => utils.random(-30, 30), to: 0 }, opacity: [0, 1], duration: 900, delay: stagger(140, { start: 200 }), ease: "outExpo" });
  }, [ready, entries.length]);

  return (
    <div ref={root} className="pk-page">
      <header className="pk-head">
        <div>
          <h1>장부</h1>
          <p>판마다 몇 BB를 따고 잃었는지 적어 둬요. 기분이 아니라 숫자로 기억하려고요.</p>
        </div>
        <dl className="pk-stats">
          <div><dt>합계</dt><dd><b ref={total}>{fmt.signed(s.sum)}</b> BB</dd></div>
          <div><dt>판</dt><dd>{entries.length}</dd></div>
          <div><dt>이긴 판</dt><dd>{s.wins}</dd></div>
          <div><dt>최고</dt><dd>{fmt.signed(s.best)}</dd></div>
        </dl>
      </header>

      {ready && !entries.length && <p className="pk-empty">아직 적어 둔 판이 없어요. 첫 판을 기록하면 장부가 시작돼요.</p>}

      {s.line.length > 1 && (
        <section className="pk-chart" aria-label="누적 손익">
          <LineChart data={s.line} aspectRatio="3 / 1" margin={{ top: 16, right: 12, bottom: 28, left: 12 }}>
            <Grid horizontal />
            <Line dataKey="bb" stroke="#e9c46a" strokeWidth={2.5} />
            <XAxis />
            <ChartTooltip />
          </LineChart>
        </section>
      )}

      <ol className="pk-ledger">
        {entries.map((e) => {
          const v = e.value ?? 0, chips = Math.min(12, Math.max(1, Math.round(Math.abs(v) / 6)));
          return (
            <li key={e.id} className="pk-row" data-won={v > 0 || undefined} data-lost={v < 0 || undefined}>
              <time>{md(e.at)}</time>
              <div><b>{e.title}</b>{e.notes[0] && <p>{e.notes[0]}</p>}{e.example && <small>예시</small>}</div>
              <span className="pk-chips" aria-hidden>{Array.from({ length: chips }, (_, i) => <i key={i} style={{ bottom: `${i * 5}px` }} />)}</span>
              <strong>{fmt.signed(v)}<small>BB</small></strong>
            </li>
          );
        })}
      </ol>

      <section className="pk-modes" aria-label="게임 모드 (준비 중)">
        <h2>아직 뒤집지 않은 카드</h2>
        <div>
          {MODES.map(([name, what, rank], i) => (
            <button key={name} className="pk-mode" data-up={flipped === i || undefined} onClick={() => setFlipped(flipped === i ? null : i)} aria-pressed={flipped === i}>
              <span className="pk-back" />
              <span className="pk-face"><em>{rank}♠</em><b>{name}</b><small>{what}</small><i>준비 중</i></span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

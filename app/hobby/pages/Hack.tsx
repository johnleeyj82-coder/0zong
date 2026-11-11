"use client";
// 보안 — notes/. A terminal workspace: a status line, the 26-week grass filling in from today backwards, problems per
// week as a phosphor area chart, per-field counts as ASCII bars, the spaced-review queue, and the notes as `cat` output.
import { useMemo, useRef, useState } from "react";
import { animate, stagger } from "animejs";
import { Area, AreaChart, ChartTooltip, Grid, XAxis } from "@/components/charts";
import { dayStart, md } from "@/lib/time";
import { useHobby } from "../Shell";
import { useAnime } from "../anime";

const DAY = 86_400_000, WEEKS = 26;
const bar = (n: number, max: number, width = 24) => "█".repeat(Math.max(1, Math.round((n / max) * width))).padEnd(width, "░");

export default function HackPage() {
  const { entries, ready } = useHobby();
  const root = useRef<HTMLDivElement>(null);
  const [field, setField] = useState<string | null>(null);

  const s = useMemo(() => {
    const today = dayStart(Date.now());
    const start = today - (WEEKS * 7 - 1 - (6 - new Date(today).getDay())) * DAY;
    const counts = new Array<number>(WEEKS * 7).fill(0);
    const tags = new Map<string, number>();
    let total = 0;
    for (const e of entries) {
      const n = e.value ?? 1;
      tags.set(e.tag || "기타", (tags.get(e.tag || "기타") ?? 0) + n);
      const i = Math.round((dayStart(e.at) - start) / DAY);
      if (i >= 0 && i < counts.length) { counts[i] += n; total += n; }
    }
    // Days in a row with at least one problem, ending today or yesterday.
    let streak = 0;
    for (let i = Math.round((today - start) / DAY); i >= 0; i--) { if (counts[i]) streak++; else if (i < Math.round((today - start) / DAY)) break; }
    const weeks = Array.from({ length: WEEKS }, (_, w) => ({ date: new Date(start + w * 7 * DAY), solved: counts.slice(w * 7, w * 7 + 7).reduce((a, b) => a + b, 0) }));
    const noted = entries.filter((e) => e.notes[0]);
    const review = noted.filter((e) => [1, 3, 7, 30].includes(Math.round((today - dayStart(e.at)) / DAY)));
    return { counts, start, today, total, streak, weeks, tags: [...tags.entries()].sort((a, b) => b[1] - a[1]), noted, review };
  }, [entries]);

  useAnime(root, () => {
    animate(".grass i", { opacity: [0, 1], scale: [0.2, 1], duration: 380, delay: stagger(5, { from: "last" }), ease: "outBack(3)" });
    animate(".hk-line", { opacity: [0, 1], x: [-12, 0], duration: 500, delay: stagger(70), ease: "outQuad" });
    animate(".hk-bars b", { opacity: [0, 1], duration: 300, delay: stagger(120, { start: 500 }) });
  }, [ready, entries.length]);

  const shown = field ? s.noted.filter((e) => (e.tag || "기타") === field) : s.noted.slice(0, 12);
  const max = Math.max(1, ...s.tags.map(([, n]) => n));

  return (
    <div ref={root} className="hk-page">
      <header className="hk-head">
        <p className="hk-line hk-prompt"><b>0zong@room</b>:<i>~/notes</i>$ ./status</p>
        <h1 className="hk-line">notes/</h1>
        <p className="hk-line hk-status">
          <span>solved <b>{s.total}</b></span><span>streak <b>{s.streak}d</b></span><span>fields <b>{s.tags.length}</b></span><span>review <b>{s.review.length}</b></span>
        </p>
      </header>

      {ready && !entries.length && <p className="hk-empty">$ ls notes/<br />아직 푼 문제가 없어요. 첫 문제를 기록하면 잔디가 칠해져요.</p>}

      {entries.length > 0 && (
        <>
          <section aria-label="26주 잔디">
            <p className="hk-cmd">$ ./grass --weeks 26</p>
            <div className="grass" role="img" aria-label={`최근 26주 동안 ${s.total}문제`}>
              {s.counts.map((c, i) => {
                const at = s.start + i * DAY;
                return <i key={i} data-l={at > s.today ? "x" : c === 0 ? 0 : c === 1 ? 1 : c === 2 ? 2 : c <= 4 ? 3 : 4} title={at > s.today ? undefined : `${md(at)} · ${c}문제`} />;
              })}
            </div>
          </section>

          <div className="hk-two">
            <section aria-label="주마다 푼 문제 수">
              <p className="hk-cmd">$ ./plot --by week</p>
              <div className="hk-chart">
                <AreaChart data={s.weeks} aspectRatio="5 / 2" margin={{ top: 12, right: 8, bottom: 28, left: 8 }}>
                  <Grid horizontal />
                  <Area dataKey="solved" fill="#4dff88" stroke="#4dff88" fillOpacity={0.35} />
                  <XAxis />
                  <ChartTooltip />
                </AreaChart>
              </div>
            </section>
            <section aria-label="분야별 문제 수">
              <p className="hk-cmd">$ ./fields | sort -rn</p>
              <div className="hk-bars">
                {s.tags.map(([t, n]) => (
                  <button key={t} aria-pressed={field === t} onClick={() => setField(field === t ? null : t)}>
                    <span>{t.padEnd(7)}</span><b>{bar(n, max)}</b><em>{n}</em>
                  </button>
                ))}
              </div>
              <p className="hk-hint">분야를 누르면 아래 노트가 그 분야만 남아요.</p>
            </section>
          </div>

          <section aria-label="오늘 복습할 노트">
            <p className="hk-cmd">$ ./review --today <span># 노트는 1·3·7·30일 뒤에 돌아와요</span></p>
            {s.review.length ? (
              <ul className="hk-review">{s.review.map((e) => <li key={e.id}><span>[ ]</span><b>{e.title}</b>{e.notes[0]}</li>)}</ul>
            ) : <p className="hk-out">오늘은 다시 볼 노트가 없어요.</p>}
          </section>

          <section aria-label="풀이 노트">
            <p className="hk-cmd">$ cat notes/{field ?? "*"}.md <span>{field && <button className="hk-clear" onClick={() => setField(null)}>전체 보기</button>}</span></p>
            <ul className="hk-notes">
              {shown.map((e) => (
                <li key={e.id}>
                  <span className="hk-meta">{md(e.at)}  {(e.tag ?? "기타").padEnd(6)}  {e.title}{e.example && "  (예시)"}</span>
                  <p>{e.notes[0]}</p>
                </li>
              ))}
              {!shown.length && <li className="hk-out">{field} 분야에 남긴 노트가 아직 없어요.</li>}
            </ul>
          </section>
        </>
      )}
      <p className="hk-prompt hk-end"><b>0zong@room</b>:<i>~/notes</i>$ <span className="hk-caret" /></p>
    </div>
  );
}

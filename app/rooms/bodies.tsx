"use client";
// Drawer bodies, one per room. Each renders that room's records (see schema.ts for what the fields mean).
// Records marked `example` are seeded examples until the owner replaces them.
import { useMemo, useState } from "react";
import type { Entry } from "@/lib/types";
import { ago, dayStart, md } from "@/lib/time";
import type { RoomKey } from "../data";
import { fmt } from "./schema";

type P = { entries: Entry[] };
const DAY = 86400_000;

function Empty({ what }: { what: string }) {
  return <p className="hint empty-room">아직 {what} 기록이 없어요.</p>;
}

function Game({ entries }: P) {
  const games = useMemo(() => {
    const m = new Map<string, { title: string; hours: number; progress?: string; last: number }>();
    for (const e of entries) {
      const g = m.get(e.title) ?? { title: e.title, hours: 0, last: e.at };
      g.hours += e.value ?? 0;
      if (e.at >= g.last) { g.last = e.at; g.progress = e.tag ?? g.progress; }
      else if (!g.progress) g.progress = e.tag;
      m.set(e.title, g);
    }
    return [...m.values()].sort((a, b) => b.last - a.last);
  }, [entries]);
  if (!entries.length) return <Empty what="플레이" />;
  return (
    <>
      <table className="dt"><thead><tr><th>게임</th><th>진행</th><th>플레이</th></tr></thead><tbody>
        {games.map((g) => <tr key={g.title}><td>{g.title}</td><td>{g.progress ?? "–"}</td><td>{fmt.n(g.hours)}h</td></tr>)}
      </tbody></table>
      <ul className="thread">
        {entries.map((e) => (
          <li key={e.id}><span className="meta">{md(e.at)} · {e.title}{e.value !== undefined && ` · +${fmt.n(e.value)}h`}</span>{e.notes[0] || <span className="hint">메모 없음</span>}</li>
        ))}
      </ul>
    </>
  );
}

function Hack({ entries }: P) {
  const WEEKS = 26;
  const { cells, total, tags } = useMemo(() => {
    // Columns are weeks (Sunday first), the last column is this week.
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
    const cells = counts.map((c, i) => ({ level: c === 0 ? 0 : c === 1 ? 1 : c === 2 ? 2 : c <= 4 ? 3 : 4, future: start + i * DAY > today, c, at: start + i * DAY }));
    return { cells, total, tags: [...tags.entries()].sort((a, b) => b[1] - a[1]) };
  }, [entries]);
  const [field, setField] = useState<string | null>(null);
  const noted = entries.filter((e) => e.notes[0]);
  // Spaced review: notes written 1, 3, 7 or 30 days ago come back today.
  const today = dayStart(Date.now());
  const review = noted.filter((e) => [1, 3, 7, 30].includes(Math.round((today - dayStart(e.at)) / DAY)));
  const shown = field ? noted.filter((e) => (e.tag || "기타") === field) : noted.slice(0, 6);
  if (!entries.length) return <Empty what="푼 문제" />;
  return (
    <>
      <div className="heat" role="img" aria-label={`최근 26주 동안 ${total}문제를 풀었어요`}>
        {cells.map((c, i) => <i key={i} className={c.future ? "future" : c.level ? `l${c.level}` : undefined} title={c.future ? undefined : `${md(c.at)} · ${c.c}문제`} />)}
      </div>
      <p className="hint">최근 26주 · {total}문제 · 칸이 진할수록 많이 푼 날</p>
      <div className="chips" role="group" aria-label="분야별 노트">
        {tags.map(([t, n]) => (
          <button key={t} className={field === t ? "on" : undefined} aria-pressed={field === t} onClick={() => setField(field === t ? null : t)}>{t} {n}</button>
        ))}
      </div>
      {!field && (
        <div className="review">
          <span className="meta">오늘 복습할 노트 · {review.length}개</span>
          {review.length ? review.map((e) => <p key={e.id}><b>{e.title}</b> {e.notes[0]}</p>) : <p className="hint">오늘은 다시 볼 노트가 없어요. 노트는 1·3·7·30일 뒤에 돌아와요.</p>}
        </div>
      )}
      <ul className="thread">
        {shown.map((e) => <li key={e.id}><span className="meta">{e.tag ?? "기타"} · {md(e.at)} · {e.title}</span>{e.notes[0]}</li>)}
        {field && !shown.length && <li className="hint">{field} 분야에 남긴 노트가 아직 없어요.</li>}
      </ul>
    </>
  );
}

function Poker({ entries }: P) {
  const total = entries.reduce((s, e) => s + (e.value ?? 0), 0);
  return (
    <>
      <ul className="modes">
        <li><b>튜토리얼</b><span>홀덤을 처음 해보는 사람을 위한 단계별 안내 · 준비 중</span></li>
        <li><b>AI와 한 판</b><span>혼자 연습하기 · 레이즈 크기가 몇 BB인지 표시 · 준비 중</span></li>
        <li><b>실시간 방</b><span>방장이 블라인드 50/100 설정 · 토너먼트 가능 · 준비 중</span></li>
      </ul>
      {entries.length ? (
        <>
          <p className="hint">지금까지 {entries.length}판 · 합계 {fmt.signed(total)}BB</p>
          <ul className="thread">
            {entries.map((e) => <li key={e.id}><span className="meta">{md(e.at)} · {e.title}{e.value !== undefined && ` · ${fmt.signed(e.value)}BB`}</span>{e.notes[0]}</li>)}
          </ul>
        </>
      ) : <Empty what="판" />}
    </>
  );
}

function Book({ entries }: P) {
  const questions = useMemo(() => [...new Set(entries.map((e) => e.tag || "기타"))], [entries]);
  const [q, setQ] = useState<string | null>(null);
  const cur = q && questions.includes(q) ? q : questions[0];
  if (!entries.length) return <Empty what="상상" />;
  return (
    <>
      <div className="chips" role="group" aria-label="질문">
        {questions.map((t) => <button key={t} className={cur === t ? "on" : undefined} aria-pressed={cur === t} onClick={() => setQ(t)}>{t}</button>)}
      </div>
      <ul className="thread">
        {entries.filter((e) => (e.tag || "기타") === cur).map((e) => <li key={e.id}><span className="meta">『{e.title}』 · {md(e.at)}</span>{e.notes[0]}</li>)}
      </ul>
    </>
  );
}

function Movie({ entries }: P) {
  const seen = entries.filter((e) => e.tag !== "보고 싶어요");
  const want = entries.length - seen.length;
  if (!entries.length) return <Empty what="영화" />;
  return (
    <>
      {seen.length > 0 && (
        <table className="dt"><thead><tr><th>영화</th><th>본 날</th><th>내 점수</th></tr></thead><tbody>
          {seen.map((e) => <tr key={e.id} title={e.notes[0]}><td>{e.title}</td><td>{md(e.at)}</td><td>{e.value !== undefined ? e.value.toFixed(1) : "–"}</td></tr>)}
        </tbody></table>
      )}
      <p className="hint">보고 싶은 목록 {want}편 · 내 기준 0~5점</p>
    </>
  );
}

function Music({ entries }: P) {
  const now = entries.find((e) => e.tag === "음악") ?? entries[0];
  if (!now) return <Empty what="음악" />;
  return (
    <>
      <div className="now"><span className="disc" aria-hidden /><div><b>{now.title}</b><span className="hint">{now.tag ?? "음악"} · {ago(now.at)} 올림{now.notes[0] && ` · ${now.notes[0]}`}</span></div></div>
      <ul className="thread">
        {entries.filter((e) => e !== now).map((e) => <li key={e.id}><span className="meta">{e.tag ?? "음악"}</span>{e.title}</li>)}
      </ul>
    </>
  );
}

function Bar({ entries }: P) {
  const last = entries[0];
  if (!last) return <Empty what="실습" />;
  const layered = last.tag === "플로트";
  return (
    <>
      <div className="recipe">
        <span className="glass" aria-hidden>
          {layered
            ? <><i style={{ flex: 3, background: "#2a1a12" }} /><i style={{ flex: 2, background: "#b5492a" }} /><i style={{ flex: 2, background: "#e8c46a" }} /><i style={{ flex: 1, background: "#f1ece0" }} /></>
            : <><i style={{ flex: 3, background: "transparent" }} /><i style={{ flex: 5, background: "#c98a3c" }} /></>}
        </span>
        <div><b>{last.title}{last.tag && ` · ${last.tag}`}</b>{last.notes[0] && <span className="hint">{last.notes[0]}</span>}{last.notes[1] && <p>{last.notes[1]}</p>}</div>
      </div>
      <p className="hint">실습 기록 {entries.length}개</p>
      {entries.length > 1 && (
        <ul className="thread">
          {entries.slice(1).map((e) => <li key={e.id}><span className="meta">{md(e.at)} · {e.title}{e.tag && ` · ${e.tag}`}</span>{e.notes[1] || e.notes[0]}</li>)}
        </ul>
      )}
    </>
  );
}

function Board({ entries, cols, what }: P & { cols: [string, (e: Entry) => React.ReactNode][]; what: string }) {
  const ranked = [...entries].sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
  if (!ranked.length) return <Empty what={what} />;
  return (
    <table className="dt"><thead><tr><th>순위</th>{cols.map(([h]) => <th key={h}>{h}</th>)}</tr></thead><tbody>
      {ranked.map((e, i) => <tr key={e.id}><td>{i + 1}</td>{cols.map(([h, f]) => <td key={h}>{f(e)}</td>)}</tr>)}
    </tbody></table>
  );
}

function Work({ entries, labels, what }: P & { labels: string[]; what: string }) {
  if (!entries.length) return <Empty what={what} />;
  return (
    <ul className="thread">
      {entries.map((e) => (
        <li key={e.id} className="work">
          <span className="meta">{md(e.at)} · {e.title}</span>
          <dl>{labels.map((l, i) => e.notes[i] ? <div key={l}><dt>{l}</dt><dd>{e.notes[i]}</dd></div> : null)}</dl>
        </li>
      ))}
    </ul>
  );
}

const WORK = ["의도", "배운 것", "다음에 할 것"];

export function RoomBody({ k, entries }: { k: RoomKey; entries: Entry[] }) {
  switch (k) {
    case "game": return <Game entries={entries} />;
    case "hack": return <Hack entries={entries} />;
    case "poker": return <Poker entries={entries} />;
    case "book": return <Book entries={entries} />;
    case "movie": return <Movie entries={entries} />;
    case "music": return <Music entries={entries} />;
    case "whisky": return <Bar entries={entries} />;
    case "chess": return <Board entries={entries} what="체스" cols={[["이름", (e) => e.title], ["모드", (e) => e.tag ?? "–"], ["최고 단계", (e) => fmt.n(e.value)]]} />;
    case "tetris": return <Board entries={entries} what="테트리스" cols={[["이름", (e) => e.title], ["2분 · 지운 줄", (e) => fmt.n(e.value)]]} />;
    case "video": return <Work entries={entries} labels={WORK} what="작품" />;
    case "art": return <Work entries={entries} labels={WORK} what="연습" />;
  }
}

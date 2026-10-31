"use client";
// 오늘의 방: what the owner did today and this week (PC helper categories), and the newest records from every room.
import { useEffect, useState } from "react";
import { CATEGORIES, CATEGORY_COLOR, CATEGORY_KEYS, DOING, hm, totalMinutes, type Category, type DayMinutes } from "@/lib/activity";
import { getGames, getMovies, getTracks } from "@/lib/client";
import { playtime } from "@/lib/games";
import { ago } from "./Guestbook";
import { useActivity } from "./ActivityContext";

const dayLabel = (date: string) => {
  const d = new Date(`${date}T12:00:00+09:00`);
  return `${d.getMonth() + 1}.${d.getDate()} (${"일월화수목금토"[d.getDay()]})`;
};

/** One day as a horizontal stack, scaled so the longest day of the week fills the row. Hover or focus a segment for its minutes. */
function Stack({ day, max, label }: { day: DayMinutes; max: number; label: string }) {
  const [tip, setTip] = useState<Category | null>(null);
  const total = totalMinutes(day.minutes);
  return (
    <div className="stack-row">
      <span className="stack-label">{label}</span>
      <div className="stack-track" style={{ width: `${max ? Math.max(2, (total / max) * 100) : 0}%` }}>
        {CATEGORY_KEYS.filter((k) => (day.minutes[k] ?? 0) > 0).map((k) => (
          <button key={k} className="stack-seg" style={{ flexGrow: day.minutes[k], background: CATEGORY_COLOR[k] }}
            aria-label={`${label} ${CATEGORIES[k]} ${hm(day.minutes[k]!)}`}
            onMouseEnter={() => setTip(k)} onMouseLeave={() => setTip(null)} onFocus={() => setTip(k)} onBlur={() => setTip(null)}>
            {tip === k && <span className="stack-tip" role="tooltip"><i style={{ background: CATEGORY_COLOR[k] }} />{CATEGORIES[k]} <b>{hm(day.minutes[k]!)}</b></span>}
          </button>
        ))}
      </div>
      <span className="stack-total">{total ? hm(total) : "—"}</span>
    </div>
  );
}

type Rec = { at: number; what: string; note: string; example?: boolean };

/** Newest records across the rooms: Steam play, movies, game notes, uploaded tracks. */
function useRecords() {
  const [recs, setRecs] = useState<Rec[] | null>(null);
  useEffect(() => {
    void Promise.all([getGames(), getMovies(), getTracks()]).then(([g, m, t]) => {
      const out: Rec[] = [];
      if (g.ok) {
        for (const s of g.data.slots) if (s.recentMinutes > 0 && s.lastPlayed) out.push({ at: s.lastPlayed, what: `${s.title} · 최근 2주 ${playtime(s.recentMinutes)}`, note: "게임", example: s.example });
        for (const n of g.data.notes.slice(0, 6)) {
          const title = g.data.slots.find((s) => s.id === n.slotId)?.title ?? "게임";
          out.push({ at: Date.parse(`${n.date}T21:00:00+09:00`), what: `${title} 메모`, note: n.text, example: n.example });
        }
      }
      if (m.ok) for (const x of m.data.slice(0, 6)) out.push({ at: Date.parse(`${x.watchedAt}T22:00:00+09:00`), what: `『${x.title}』 기록`, note: "영화", example: x.example });
      for (const x of t.slice(0, 6)) out.push({ at: x.addedAt, what: `「${x.title}」 올림`, note: "음악" });
      setRecs(out.filter((r) => r.at && r.at <= Date.now()).sort((a, b) => b.at - a.at).slice(0, 10));
    });
  }, []);
  return recs;
}

export default function Today() {
  const { activity } = useActivity();
  const [table, setTable] = useState(false);
  const recs = useRecords();
  const days = activity?.days ?? [];
  const today = days[days.length - 1];
  const max = Math.max(0, ...days.map((d) => totalMinutes(d.minutes)));
  const used = CATEGORY_KEYS.filter((k) => days.some((d) => (d.minutes[k] ?? 0) > 0));
  const empty = max === 0;

  return (
    <div className="today">
      {activity?.live && (
        <p className="today-live"><i aria-hidden />{Math.max(1, Math.round((Date.now() - activity.live.at) / 60_000))}분 전 · {DOING[activity.live.category]}이었어요</p>
      )}
      <section aria-labelledby="today-pc">
        <h3 id="today-pc" className="save-h">PC에서 보낸 시간{activity?.example && <span>예시</span>}</h3>
        {!activity && <p className="hint">불러오는 중…</p>}
        {activity && empty && <p className="hint">아직 PC 기록이 없어요. 방 주인이 Windows 도우미를 연결하면 분류별 시간이 여기에 쌓여요.</p>}
        {activity && !empty && (
          <>
            <p className="today-total">오늘 <b>{today && totalMinutes(today.minutes) ? hm(totalMinutes(today.minutes)) : "아직 없음"}</b></p>
            <ul className="legend" aria-label="분류">
              {used.map((k) => <li key={k}><i style={{ background: CATEGORY_COLOR[k] }} />{CATEGORIES[k]}</li>)}
            </ul>
            {table ? (
              <table className="today-table">
                <thead><tr><th>날짜</th>{used.map((k) => <th key={k}>{CATEGORIES[k]}</th>)}<th>합계</th></tr></thead>
                <tbody>{days.map((d) => (
                  <tr key={d.date}><td>{dayLabel(d.date)}</td>{used.map((k) => <td key={k}>{d.minutes[k] ? hm(d.minutes[k]!) : "—"}</td>)}<td>{hm(totalMinutes(d.minutes))}</td></tr>
                ))}</tbody>
              </table>
            ) : (
              <div className="stacks">
                {[...days].reverse().map((d, i) => <Stack key={d.date} day={d} max={max} label={i === 0 ? "오늘" : dayLabel(d.date)} />)}
              </div>
            )}
            <button className="link today-switch" onClick={() => setTable((v) => !v)}>{table ? "막대로 보기" : "표로 보기"}</button>
          </>
        )}
        <p className="hint">앱 이름이나 창 제목은 공개하지 않아요. 분류만 보여요.</p>
      </section>
      <section aria-labelledby="today-rec">
        <h3 id="today-rec" className="save-h">최근 기록</h3>
        {!recs && <p className="hint">불러오는 중…</p>}
        {recs && recs.length === 0 && <p className="hint">아직 기록이 없어요.</p>}
        <ul className="feed today-feed">
          {recs?.map((r, i) => (
            <li key={i}>
              <span className="when">{ago(r.at)}</span>
              <span className="what">{r.what}{r.example && <span className="tag">예시</span>}<small>{r.note}</small></span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

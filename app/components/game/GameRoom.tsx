"use client";
import { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { getGames } from "@/lib/client";
import { playtime, STATUSES, type GamesPayload } from "@/lib/games";
import { PageLink } from "../PageLink";
import { Cover } from "./Cover";

/** Game room drawer: the three most recently played slots, the newest note, and the way into /game. */
export default function GameRoom() {
  const [data, setData] = useState<GamesPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { void getGames().then((r) => (r.ok ? setData(r.data) : setError(r.error))); }, []);
  if (error) return <p className="form-error" role="alert">{error}</p>;
  if (!data) return <p className="hint">세이브 파일을 불러오는 중…</p>;
  if (!data.slots.length) return <p className="hint">아직 슬롯에 건 게임이 없어요. 첫 게임을 걸면 여기에 보여요.</p>;
  const latest = data.notes[0];
  const title = (id: string) => data.slots.find((s) => s.id === id)?.title ?? "";
  return (
    <>
      <ol className="mini-slots">
        {data.slots.slice(0, 3).map((s) => (
          <li key={s.id}>
            <Cover slot={s} />
            <span className="tt-wrap"><b>{s.title}{s.example && <em className="ex-tag">예시</em>}</b><small>{[STATUSES[s.status], s.progressLabel].filter(Boolean).join(", ")}</small></span>
            <span className="n">{playtime(s.minutes)}</span>
          </li>
        ))}
      </ol>
      {latest && (
        <ul className="thread"><li><span className="meta">{latest.date.slice(5).replace("-", ".")} · {title(latest.slotId)}{latest.hours ? ` · +${latest.hours}h` : ""}</span>{latest.text}</li></ul>
      )}
      <PageLink to="game" className="btn-ghost mini-more">세이브 파일 열기 <ArrowUpRight size={14} aria-hidden /></PageLink>
    </>
  );
}

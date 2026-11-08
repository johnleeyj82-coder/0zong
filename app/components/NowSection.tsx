"use client";
import { useMemo } from "react";
import { ROOMS } from "../data";
import { SCHEMA } from "../rooms/schema";
import { ago, dayStart } from "@/lib/time";
import { Reveal } from "./Reveal";
import { useRoom } from "./RoomContext";

const MAX = 6;

/** Newest records across every room. One line per room per day, so a busy day in one room doesn't fill the feed. */
export default function NowSection() {
  const { entries, entriesReady, openDrawer } = useRoom();
  const feed = useMemo(() => {
    const seen = new Set<string>();
    const out = [];
    for (const e of entries) {
      const k = `${e.room}:${dayStart(e.at)}`;
      if (seen.has(k)) continue;
      seen.add(k); out.push(e);
      if (out.length === MAX) break;
    }
    return out;
  }, [entries]);
  const anyExample = feed.some((e) => e.example);

  return (
    <section className="section" aria-labelledby="now-h">
      <Reveal><span className="label">Lately{anyExample && " · 예시 기록"}</span></Reveal>
      <Reveal index={1}><h2 id="now-h" className="display">요즘 이 방에서 일어난 일</h2></Reveal>
      <ul className="feed">
        {entriesReady && !feed.length && <li className="feed-empty">아직 남긴 기록이 없어요. 방에 기록이 쌓이면 여기에 최신순으로 보여요.</li>}
        {feed.map((e, i) => {
          const room = ROOMS.find((r) => r.key === e.room);
          if (!room) return null;
          const Icon = room.icon;
          return (
            <Reveal as="li" key={e.id} index={i}>
              <span className="when">{ago(e.at)}</span>
              <span className="icon-ring" style={{ width: 32, height: 32 }} aria-label={room.label}><Icon size={15} aria-hidden /></span>
              <button className="what feed-open" onClick={() => openDrawer(room.key)}>
                {SCHEMA[room.key].line(e)}
                {e.notes[0] && <small>{e.notes[0]}</small>}
              </button>
            </Reveal>
          );
        })}
      </ul>
    </section>
  );
}

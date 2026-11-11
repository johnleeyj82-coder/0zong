"use client";
import { useEffect, useMemo, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { ROOMS, SPACES, routeOf } from "../data";
import { DEMO } from "@/lib/client";
import { ago, dayStart } from "@/lib/time";
import { SCHEMA } from "../rooms/schema";
import { PageLink } from "./PageLink";
import Guestbook from "./Guestbook";
import Today from "./Today";
import { useRoom, type Panel } from "./RoomContext";

const EASE = [0.16, 1, 0.3, 1] as const;

const HEAD: Record<Panel, { label: string; title: string }> = {
  about: { label: "About this room", title: "취미도, 공부도, 전부 이 집에." },
  guestbook: { label: "Guestbook", title: "다녀간 사람들" },
  today: { label: "Today · 오늘의 방", title: "요즘 이 방에서 한 일" },
};

function About() {
  const { entries, entriesReady } = useRoom();
  // One line per hobby per day, so a busy day in one room does not fill the feed.
  const feed = useMemo(() => {
    const seen = new Set<string>(), out: typeof entries = [];
    for (const e of entries) {
      const k = `${e.room}:${dayStart(e.at)}`;
      if (seen.has(k)) continue;
      seen.add(k); out.push(e);
      if (out.length === 6) break;
    }
    return out;
  }, [entries]);
  return (
    <>
      <p className="drawer-desc">
        노션에 적어두고 다시 안 보던 공부 기록, 게임하다 찍은 스크린샷, 책을 읽으며 혼자 상상한 세계, 친구들과 겨룬 테트리스
        기록까지. 흩어져 있던 것들을 방 세 개에 모았어요.
      </p>
      <ul className="about-spaces">
        {SPACES.map((s) => (
          <li key={s.id}>
            <b>{s.label}</b>
            <span>{s.id === "bedroom" ? "침대에 누우면 집 안의 시간을 바꿀 수 있어요." : ROOMS.filter((r) => r.space === s.id).map((r) => r.label).join(" · ")}</span>
          </li>
        ))}
      </ul>
      <p className="hint">물건에 마우스를 올리면 불이 들어와요. 누르면 그 취미의 기록이, 문을 누르면 옆방이 나와요.</p>
      <img className="frame-img" src={`${DEMO ? "" : "/"}room/about.jpg`} alt="포커 테이블과 듀얼 모니터 책상이 보이는 방 안" loading="lazy" />
      <section aria-labelledby="lately-h">
        <span className="label">Lately{feed.some((e) => e.example) && " · 예시 기록"}</span>
        <h3 id="lately-h" className="save-h">요즘 이 집에서 일어난 일</h3>
        <ul className="feed">
          {entriesReady && !feed.length && <li className="feed-empty">아직 남긴 기록이 없어요. 기록이 쌓이면 여기에 최신순으로 보여요.</li>}
          {feed.map((e) => {
            const room = ROOMS.find((r) => r.key === e.room);
            if (!room) return null;
            return (
              <li key={e.id}>
                <span className="when">{ago(e.at)}</span>
                <span className="icon-ring" style={{ width: 32, height: 32 }} aria-label={room.label}><room.icon size={15} aria-hidden /></span>
                <PageLink to={routeOf(room.key)} className="what feed-open">{SCHEMA[room.key].line(e)}{e.notes[0] && <small>{e.notes[0]}</small>}</PageLink>
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}

/** The about page and the guestbook, as right-side sheets over the room (bottom sheets on phones). */
export default function Panels() {
  const { panel, setPanel } = useRoom();
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!panel) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setPanel(null); };
    window.addEventListener("keydown", onKey);
    const t = setTimeout(() => closeRef.current?.focus(), 50);
    return () => { window.removeEventListener("keydown", onKey); clearTimeout(t); };
  }, [panel, setPanel]);

  return (
    <AnimatePresence>
      {panel && (
        <motion.div key="panel" className="scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setPanel(null)}>
          <motion.aside className="drawer" role="dialog" aria-modal="true" aria-labelledby="panel-h" onClick={(e) => e.stopPropagation()}
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ duration: 0.6, ease: EASE }}>
            <button ref={closeRef} className="drawer-close" onClick={() => setPanel(null)} aria-label="닫기"><X size={18} /></button>
            <header className="panel-head">
              <span className="label">{HEAD[panel].label}</span>
              <h2 id="panel-h" className="display">{HEAD[panel].title}</h2>
            </header>
            {panel === "about" ? <About /> : panel === "today" ? <Today /> : <Guestbook />}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

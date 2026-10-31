"use client";
import { Fragment } from "react";
import { motion } from "framer-motion";
import { BarChart3, CalendarClock, Info, MessageSquareText } from "lucide-react";
import { SPACES } from "../data";
import { useRoom } from "./RoomContext";
import { useScene } from "./SceneContext";

/** Fixed dock: every hobby grouped by the room it stands in, then 오늘의 방, the about page, guestbook and (owner) the dashboard. */
export default function IconBar() {
  const { rooms, track, owner, name, mode, setDashboard, setPanel, phase } = useRoom();
  const { select, selected } = useScene();
  const chip = owner ? "편집 모드" : mode === "named" || mode === "anonymous" ? `${name}님` : null;

  return (
    <motion.nav className="dock" aria-label="취미 바로가기" style={{ x: "-50%" }} initial={{ opacity: 0, y: 24 }}
      animate={phase === "done" ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
      {chip && <span className={owner ? "dock-chip owner" : "dock-chip"}>{chip}</span>}
      {SPACES.map((s, i) => (
        <Fragment key={s.id}>
          {i > 0 && <span className="dock-sep" aria-hidden />}
          {rooms.filter((r) => r.space === s.id).map((r) => (
            <button key={r.key} className="dock-btn" aria-label={`${r.label} (${s.label})`} aria-current={selected === r.key}
              onClick={() => { track("dock", r.key); select(r.key); }}>
              <r.icon size={19} aria-hidden /><span className="dock-tip">{r.label} · {s.label}</span>
            </button>
          ))}
        </Fragment>
      ))}
      <span className="dock-sep" aria-hidden />
      <button className="dock-btn" onClick={() => setPanel("today")} aria-label="오늘의 방">
        <CalendarClock size={19} aria-hidden /><span className="dock-tip">오늘의 방</span>
      </button>
      <button className="dock-btn" onClick={() => setPanel("about")} aria-label="이 집 이야기">
        <Info size={19} aria-hidden /><span className="dock-tip">이 집 이야기</span>
      </button>
      <button className="dock-btn" onClick={() => setPanel("guestbook")} aria-label="방명록">
        <MessageSquareText size={19} aria-hidden /><span className="dock-tip">방명록</span>
      </button>
      {owner && (
        <button className="dock-btn owner" onClick={() => setDashboard(true)} aria-label="방문 기록">
          <BarChart3 size={19} aria-hidden /><span className="dock-tip">방문 기록</span>
        </button>
      )}
    </motion.nav>
  );
}

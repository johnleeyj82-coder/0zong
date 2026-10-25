"use client";
import { useState } from "react";
import { motion, useMotionValueEvent, useTransform } from "framer-motion";
import { BarChart3, MessageSquareText } from "lucide-react";
import { HOME_ICON, MARKS, type RoomKey } from "../data";
import { scrollToId, scrollToProgress, useHero } from "./HeroContext";
import { useRoom } from "./RoomContext";

/** Fixed dock: home, every room, guestbook, and (owner) the dashboard. A tungsten line on top shows tour progress. */
export default function IconBar() {
  const { progress, heroRef } = useHero();
  const { rooms, track, openDrawer, owner, name, mode, setDashboard, phase } = useRoom();
  const [active, setActive] = useState<RoomKey | null>(null);
  const width = useTransform(progress, (p) => `${Math.round(p * 100)}%`);

  useMotionValueEvent(progress, "change", (p) => {
    const hit = rooms.find((r) => r.mark !== undefined && Math.abs(MARKS[r.mark] - p) < 0.044);
    setActive(p >= 1 ? null : hit ? hit.key : null);
  });

  const go = (key: RoomKey) => {
    const room = rooms.find((r) => r.key === key)!;
    track("dock", key);
    if (room.mark !== undefined) scrollToProgress(heroRef.current, MARKS[room.mark]);
    else openDrawer(key);
  };
  const Home = HOME_ICON;
  const chip = owner ? "편집 모드" : mode === "named" || mode === "anonymous" ? `${name}님` : null;

  return (
    <motion.nav className="dock" aria-label="방 바로가기" style={{ x: "-50%" }} initial={{ opacity: 0, y: 24 }}
      animate={phase === "done" ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
      <motion.span className="dock-progress" style={{ width }} aria-hidden />
      {chip && <span className={owner ? "dock-chip owner" : "dock-chip"}>{chip}</span>}
      <button className="dock-btn" onClick={() => scrollToProgress(heroRef.current, 0)} aria-label="처음으로">
        <Home size={19} aria-hidden /><span className="dock-tip">처음으로</span>
      </button>
      <span className="dock-sep" aria-hidden />
      {rooms.map((r) => (
        <button key={r.key} className="dock-btn" onClick={() => go(r.key)} aria-label={r.label} aria-current={active === r.key}>
          <r.icon size={19} aria-hidden /><span className="dock-tip">{r.label}</span>
        </button>
      ))}
      <span className="dock-sep" aria-hidden />
      <button className="dock-btn" onClick={() => scrollToId("guestbook")} aria-label="방명록">
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

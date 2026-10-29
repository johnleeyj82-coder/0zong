"use client";
import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, BedDouble, X } from "lucide-react";
import { spaceLabel, type RoomKey } from "../data";
import { TIMES, timeWithRo, type TimeOfDay } from "@/lib/env";
import { useRoom } from "./RoomContext";
import { useScene } from "./SceneContext";

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * The card for the selected object. The camera does not move: the card appears beside the room.
 * A hobby gets its title, line and "열어보기"; the bed gets the time picker.
 */
export default function Caption() {
  const { selected, select } = useScene();
  const { rooms, drawer, panel, track } = useRoom();
  const seen = useRef(new Set<string>());

  // A hobby counts as viewed once its card has been on screen for 1.2s (once per visit).
  useEffect(() => {
    if (!selected || selected === "bed" || seen.current.has(selected)) return;
    const t = setTimeout(() => { seen.current.add(selected); track("view", selected); }, 1200);
    return () => clearTimeout(t);
  }, [selected, track]);

  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !drawer && !panel) select(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, drawer, panel, select]);

  const room = selected && selected !== "bed" ? rooms.find((r) => r.key === selected) : null;
  return (
    <div className="caption-pos" aria-live="polite">
      <AnimatePresence mode="wait">
        {room && (
          <motion.section key={room.key} className="caption lamp-card" aria-label={room.title}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.45, ease: EASE }}>
            <i /><i /><i /><i />
            <button className="caption-x icon-btn" onClick={() => select(null)} aria-label="닫기"><X size={16} /></button>
            <div className="caption-head">
              <span className="icon-disc"><room.icon size={20} aria-hidden /></span>
              <div>
                <div className="count">{spaceLabel(room.space)} · {room.label}</div>
                <h2>{room.title}</h2>
              </div>
            </div>
            <p>{room.desc}</p>
            <div className="update">{room.update}</div>
            <OpenButton k={room.key} />
          </motion.section>
        )}
        {selected === "bed" && <BedCard key="bed" />}
      </AnimatePresence>
    </div>
  );
}

function OpenButton({ k }: { k: RoomKey }) {
  const { openDrawer } = useRoom();
  return <button className="caption-open" onClick={() => openDrawer(k)}>열어보기 <ArrowUpRight size={15} aria-hidden /></button>;
}

const ORDER: TimeOfDay[] = ["dawn", "morning", "day", "sunset", "night"];

function BedCard() {
  const { select, time, timeOverride, setTime } = useScene();
  return (
    <motion.section className="caption lamp-card" aria-label="침대: 시간 바꾸기"
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.45, ease: EASE }}>
      <i /><i /><i /><i />
      <button className="caption-x icon-btn" onClick={() => select(null)} aria-label="닫기"><X size={16} /></button>
      <div className="caption-head">
        <span className="icon-disc"><BedDouble size={20} aria-hidden /></span>
        <div>
          <div className="count">침실 · 침대</div>
          <h2>몇 시로 맞출까요?</h2>
        </div>
      </div>
      <p>눈을 감았다 뜨면 그 시간이에요. 내 화면에서만 바뀌어요.</p>
      <div className="time-grid" role="group" aria-label="집 안의 시간">
        {ORDER.map((t) => (
          <button key={t} className="time-btn" aria-pressed={timeOverride === t} onClick={() => setTime(t)}>{TIMES[t]}</button>
        ))}
        <button className="time-btn now" aria-pressed={timeOverride === null} onClick={() => setTime(null)}>지금 (서울)</button>
      </div>
      <div className="update">{timeOverride ? `${timeWithRo(time)} 맞춰 뒀어요` : `서울 지금 · ${TIMES[time]}`}</div>
    </motion.section>
  );
}

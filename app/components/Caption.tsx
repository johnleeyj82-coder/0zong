"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import { BedDouble, X } from "lucide-react";
import { TIMES, timeWithRo, type TimeOfDay } from "@/lib/env";
import { useRoom } from "./RoomContext";
import { useScene } from "./SceneContext";

const EASE = [0.16, 1, 0.3, 1] as const;

// Each hobby's scene (and its fonts, sounds and canvas code) loads only when an object is opened.
const Stage = dynamic(() => import("../stages/Stage"), { ssr: false });

/**
 * What opens for the selected object (the camera does not move): a hobby opens its own full-screen scene,
 * the bed opens the time picker card beside the room.
 */
export default function Caption() {
  const { selected, select } = useScene();
  const { drawer, panel } = useRoom();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (selected !== "bed") return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !drawer && !panel) select(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, drawer, panel, select]);

  return (
    <>
      {/* On <body>, so the scene covers the dock (the room's <main> is its own stacking context). */}
      {mounted && createPortal(
        <AnimatePresence>
          {selected && selected !== "bed" && <Stage key="stage" k={selected} onClose={() => select(null)} />}
        </AnimatePresence>,
        document.body,
      )}
      <div className="caption-pos" aria-live="polite">
        <AnimatePresence mode="wait">
          {selected === "bed" && <BedCard key="bed" />}
        </AnimatePresence>
      </div>
    </>
  );
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

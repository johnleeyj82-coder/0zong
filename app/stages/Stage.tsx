"use client";
// A hobby's own full-screen moment. Each object opens a different, art-directed scene (ink, vinyl, film leader, CRT...)
// instead of a shared card. The records (the old drawer body) open inside the scene, dressed in its style.
import { useCallback, useEffect, useRef, useState, type ComponentType } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, Pencil, X } from "lucide-react";
import type { Room, RoomKey } from "../data";
import { RoomBody } from "../rooms/bodies";
import { useRoom } from "../components/RoomContext";
import "./stages.css";
import ArtScene from "./scenes/Art";
import MusicScene from "./scenes/Music";
import MovieScene from "./scenes/Movie";
import VideoScene from "./scenes/Video";
import BookScene from "./scenes/Book";
import GameScene from "./scenes/Game";
import HackScene from "./scenes/Hack";
import PokerScene from "./scenes/Poker";
import WhiskyScene from "./scenes/Whisky";
import ChessScene from "./scenes/Chess";
import TetrisScene from "./scenes/Tetris";

export type SceneProps = {
  room: Room;
  /** prefers-reduced-motion: skip intros, show the settled state. */
  reduce: boolean;
  openRecords: () => void;
  close: () => void;
};

const SCENES: Record<RoomKey, ComponentType<SceneProps>> = {
  art: ArtScene, music: MusicScene, movie: MovieScene, video: VideoScene, book: BookScene, game: GameScene,
  hack: HackScene, poker: PokerScene, whisky: WhiskyScene, chess: ChessScene, tetris: TetrisScene,
};

/** What the records panel is called inside each scene. */
const RECORDS: Record<RoomKey, string> = {
  art: "연습장", music: "판 고르기", movie: "상영 기록", video: "테이프 목록", book: "세계관 노트", game: "플레이 기록",
  hack: "notes/", poker: "테이블", whisky: "실습 노트", chess: "단계 기록", tetris: "기록판",
};
const seen = new Set<string>();
export const recordsLabel = (k: RoomKey) => RECORDS[k];

export default function Stage({ k, onClose }: { k: RoomKey; onClose: () => void }) {
  const { rooms, track, owner, openDrawer, drawer } = useRoom();
  const room = rooms.find((r) => r.key === k)!;
  const reduce = !!useReducedMotion();
  const [records, setRecords] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const Scene = SCENES[k];

  // Viewed once the scene has been up for 1.2s (once per hobby per visit).
  useEffect(() => {
    if (seen.has(k)) return;
    const t = setTimeout(() => { seen.add(k); track("view", k); }, 1200);
    return () => clearTimeout(t);
  }, [k, track]);

  useEffect(() => { setRecords(false); }, [k]);

  const openRecords = useCallback(() => { setRecords(true); track("open", k); }, [k, track]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || drawer) return;
      if (records) setRecords(false); else onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [records, drawer, onClose]);

  useEffect(() => { closeRef.current?.focus({ preventScroll: true }); }, [k]);

  return (
    <motion.div className={`stage-x sc-${k}`} role="dialog" aria-modal="true" aria-label={`${room.label}: ${room.title}`}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduce ? 0 : 0.25 }}>
      <Scene room={room} reduce={reduce} openRecords={openRecords} close={onClose} />
      <div className="stage-tools">
        {owner && <button className="stage-tool" onClick={() => openDrawer(k)} aria-label="이 취미 소개 고치기"><Pencil size={16} /></button>}
        <button ref={closeRef} className="stage-tool" onClick={onClose} aria-label="방으로 돌아가기"><X size={18} /></button>
      </div>
      <AnimatePresence>
        {records && (
          <motion.aside className="stage-records" aria-label={RECORDS[k]}
            initial={reduce ? { opacity: 0 } : { x: "100%" }} animate={reduce ? { opacity: 1 } : { x: 0 }} exit={reduce ? { opacity: 0 } : { x: "100%" }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}>
            <header className="stage-records-head">
              <button className="stage-back" onClick={() => setRecords(false)}><ArrowLeft size={16} aria-hidden /> 돌아가기</button>
              <h2>{RECORDS[k]}</h2>
            </header>
            <p className="stage-records-desc">{room.update}</p>
            <div className="drawer-body"><RoomBody k={k} /></div>
          </motion.aside>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

"use client";
// A hobby's own full-screen moment. Each object opens a different, art-directed scene (ink, vinyl, film leader, CRT...)
// instead of a shared card. The scene is the doorway: its button goes to that hobby's own page (/art, /hack, /bar...).
import { useCallback, useEffect, useRef, type ComponentType } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Pencil, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { routeOf, type Room, type RoomKey } from "../data";
import { DEMO, pageHref } from "@/lib/client";
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

/** What each scene calls the page it leads to. */
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
  const router = useRouter();
  const closeRef = useRef<HTMLButtonElement>(null);
  const Scene = SCENES[k];

  // Viewed once the scene has been up for 1.2s (once per hobby per visit).
  useEffect(() => {
    if (seen.has(k)) return;
    const t = setTimeout(() => { seen.add(k); track("view", k); }, 1200);
    return () => clearTimeout(t);
  }, [k, track]);

  // The page itself records the "open" event when it loads.
  const openRecords = useCallback(() => {
    const href = pageHref(routeOf(k));
    if (DEMO) location.assign(href); else router.push(href);
  }, [k, router]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || drawer) return;
      onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawer, onClose]);

  useEffect(() => { closeRef.current?.focus({ preventScroll: true }); }, [k]);

  return (
    <motion.div className={`stage-x sc-${k}`} role="dialog" aria-modal="true" aria-label={`${room.label}: ${room.title}`}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduce ? 0 : 0.25 }}>
      <Scene room={room} reduce={reduce} openRecords={openRecords} close={onClose} />
      <div className="stage-tools">
        {owner && <button className="stage-tool" onClick={() => openDrawer(k)} aria-label="이 취미 소개 고치기"><Pencil size={16} /></button>}
        <button ref={closeRef} className="stage-tool" onClick={onClose} aria-label="방으로 돌아가기"><X size={18} /></button>
      </div>
    </motion.div>
  );
}

"use client";
import { AnimatePresence, motion } from "framer-motion";
import { Pause, Play, Sunrise } from "lucide-react";
import { usePlayer } from "./PlayerContext";

/** Small glass pill, bottom left, on every page once something has played. */
export default function MiniPlayer() {
  const { started, listen, current, playing, toggle, position, duration, setListen, tracks, rain, fire } = usePlayer();
  const label = current?.title ?? (rain || fire ? "환경음 켜짐" : "음악");
  return (
    <AnimatePresence>
      {started && !listen && (
        <motion.div className="mini" role="region" aria-label="음악 플레이어"
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
          <button className="play-btn small" onClick={toggle} disabled={!tracks.length} aria-label={playing ? "일시정지" : "재생"}>
            {playing ? <Pause size={15} /> : <Play size={15} />}
          </button>
          <span className="mini-title">
            <b>{label}</b>
            <i className="mini-bar" aria-hidden><i style={{ width: `${duration ? (position / duration) * 100 : 0}%` }} /></i>
          </span>
          <button className="icon-btn" onClick={() => setListen(true)} aria-label="듣기 모드"><Sunrise size={16} /></button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

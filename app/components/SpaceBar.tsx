"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { CloudRain, Settings2 } from "lucide-react";
import { SPACES } from "../data";
import { seoulClock, TIMES, timeWithRo, WEATHERS, type EnvOverride } from "@/lib/env";
import { usePlayer } from "./music/PlayerContext";
import { useRoom } from "./RoomContext";
import { useScene, type QualitySetting } from "./SceneContext";

const QUALITY: Record<QualitySetting, string> = { auto: "자동", high: "높게", medium: "보통", low: "낮게", off: "끄기 (사진)" };
const OVERRIDE: Record<EnvOverride, string> = { auto: "서울 따라가기", ...WEATHERS };

/** Top left: where you are in the house, the rooms you can walk to, Seoul's time and weather, and view settings. */
export default function SpaceBar() {
  const { space, go, env, now, time, timeOverride, setTime, qualitySetting, setQuality, setWeather } = useScene();
  const { owner, phase } = useRoom();
  const { rain, set } = usePlayer();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wet = env?.weather === "rain" || env?.weather === "storm";

  return (
    <motion.div className="spacebar" initial={{ opacity: 0, y: -12 }} animate={phase === "done" ? { opacity: 1, y: 0 } : { opacity: 0, y: -12 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
      <div className="spacebar-row">
        <h1 className="spacebar-title display">0zong의 방</h1>
        <button className="icon-btn" aria-label="보기 설정" aria-expanded={open} onClick={() => setOpen((v) => !v)}><Settings2 size={16} /></button>
      </div>
      <nav className="space-tabs" aria-label="방 이동">
        {SPACES.map((s) => (
          <button key={s.id} aria-current={space === s.id ? "location" : undefined} onClick={() => go(s.id)}>{s.label}</button>
        ))}
      </nav>
      <p className="spacebar-meta">
        <span>서울 {now ? seoulClock(now) : "--:--"}{env ? ` · ${WEATHERS[env.weather]}${env.temp !== null ? ` ${env.temp}°` : ""}` : ""}</span>
        {env?.source === "owner" && <span className="dim"> · 주인이 고른 날씨</span>}
      </p>
      {timeOverride && (
        <p className="spacebar-meta accent">
          {timeWithRo(time)} 맞춤 · <button className="link" onClick={() => setTime(null)}>지금으로</button>
        </p>
      )}
      {wet && rain === 0 && (
        <button className="chip-btn" onClick={() => set({ rain: 0.5 })}><CloudRain size={14} aria-hidden /> 밖에 비가 와요 · 빗소리 켜기</button>
      )}
      {open && (
        <div className="spacebar-settings">
          <label className="mini-field"><span>화질</span>
            <select value={qualitySetting} onChange={(e) => setQuality(e.target.value as QualitySetting)}>
              {Object.entries(QUALITY).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
          {owner && (
            <label className="mini-field"><span>날씨 (모두에게)</span>
              <select value={env?.override ?? "auto"} onChange={async (e) => setError(await setWeather(e.target.value as EnvOverride))}>
                {Object.entries(OVERRIDE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </label>
          )}
          {error && <p className="form-error" role="alert">{error}</p>}
          <p className="hint">지금 시간대: {TIMES[time]}. 침실 침대에서 바꿀 수 있어요.</p>
        </div>
      )}
    </motion.div>
  );
}

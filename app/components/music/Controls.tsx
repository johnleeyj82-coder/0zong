"use client";
import { useEffect, useState } from "react";
import { Pause, Play, SkipBack, SkipForward, Timer } from "lucide-react";
import { clock } from "@/lib/music";
import { BREAK_MIN, FOCUS_MIN, usePlayer } from "./PlayerContext";

/** One labeled range control with its value shown beside the label. */
export function Slider({ id, label, value, min, max, step, show, onChange }: {
  id: string; label: string; value: number; min: number; max: number; step: number; show: string; onChange: (v: number) => void;
}) {
  return (
    <label className="ctl" htmlFor={id}>
      <span>{label}<output htmlFor={id}>{show}</output></span>
      <input id={id} type="range" min={min} max={max} step={step} value={value} aria-valuetext={show}
        onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}

export function Transport({ size = 18 }: { size?: number }) {
  const { playing, toggle, next, prev, tracks } = usePlayer();
  const none = !tracks.length;
  return (
    <div className="transport">
      <button className="icon-btn" onClick={prev} disabled={none} aria-label="이전 곡"><SkipBack size={size - 2} /></button>
      <button className="play-btn" onClick={toggle} disabled={none} aria-label={playing ? "일시정지" : "재생"}>
        {playing ? <Pause size={size} /> : <Play size={size} />}
      </button>
      <button className="icon-btn" onClick={next} disabled={none} aria-label="다음 곡"><SkipForward size={size - 2} /></button>
    </div>
  );
}

export function Seek({ id }: { id: string }) {
  const { position, duration, seek, current } = usePlayer();
  return (
    <div className="seek">
      <span>{clock(position)}</span>
      <input id={id} type="range" min={0} max={Math.max(1, duration)} step={0.5} value={Math.min(position, duration || position)}
        disabled={!current} aria-label="재생 위치" aria-valuetext={`${clock(position)} / ${clock(duration)}`}
        onChange={(e) => seek(Number(e.target.value))} />
      <span>{clock(duration)}</span>
    </div>
  );
}

const remain = (endsAt: number, now: number) => clock(Math.max(0, (endsAt - now) / 1000));

/** Sleep timer and pomodoro. Shows what is running; the menu sets or clears it. */
export function TimerMenu() {
  const { sleepEndsAt, setSleep, pomodoro, setPomodoro } = usePlayer();
  const [open, setOpen] = useState(false);
  const [, tick] = useState(0);
  useEffect(() => {
    if (!sleepEndsAt && !pomodoro) return;
    const t = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [sleepEndsAt, pomodoro]);
  const now = Date.now();

  return (
    <div className="timer">
      <button className="btn-ghost" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <Timer size={14} aria-hidden /> 타이머
        {sleepEndsAt && <span className="timer-chip">잠자기 {remain(sleepEndsAt, now)}</span>}
        {pomodoro && <span className="timer-chip">{pomodoro.phase === "focus" ? "집중" : "휴식"} {remain(pomodoro.endsAt, now)}</span>}
      </button>
      {open && (
        <div className="timer-menu" role="group" aria-label="타이머">
          <p>잠자기 <small>끝나기 30초 전부터 서서히 작아져요</small></p>
          <div className="chips-row">
            {[15, 30, 60].map((m) => <button key={m} className="chip-btn" onClick={() => { setSleep(m); setOpen(false); }}>{m}분</button>)}
            {sleepEndsAt && <button className="chip-btn" onClick={() => setSleep(null)}>끄기</button>}
          </div>
          <p>포모도로 <small>{FOCUS_MIN}분 집중, {BREAK_MIN}분 휴식을 종소리로 알려줘요</small></p>
          <div className="chips-row">
            <button className="chip-btn" aria-pressed={!!pomodoro} onClick={() => { setPomodoro(!pomodoro); setOpen(false); }}>{pomodoro ? "끄기" : "시작"}</button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Everything adjustable: volume, track speed and pitch, scene speed, the two ambient beds. */
export function Mixer({ prefix }: { prefix: string }) {
  const { volume, rate, keepPitch, scene, rain, fire, set } = usePlayer();
  const pct = (v: number) => `${Math.round(v * 100)}%`;
  return (
    <div className="mixer">
      <Slider id={`${prefix}-vol`} label="음량" value={volume} min={0} max={1} step={0.01} show={pct(volume)} onChange={(v) => set({ volume: v })} />
      <div className="ctl-pair">
        <Slider id={`${prefix}-rate`} label="곡 속도" value={rate} min={0.5} max={1.5} step={0.05} show={`${rate.toFixed(2)}×`} onChange={(v) => set({ rate: v })} />
        <label className="pitch"><input type="checkbox" checked={keepPitch} onChange={(e) => set({ keepPitch: e.target.checked })} /> 음 높이 유지</label>
      </div>
      <Slider id={`${prefix}-scene`} label="화면 속도" value={scene} min={0} max={2} step={0.1} show={scene === 0 ? "멈춤" : `${scene.toFixed(1)}×`} onChange={(v) => set({ scene: v })} />
      <Slider id={`${prefix}-rain`} label="빗소리" value={rain} min={0} max={1} step={0.01} show={rain ? pct(rain) : "꺼짐"} onChange={(v) => set({ rain: v })} />
      <Slider id={`${prefix}-fire`} label="모닥불" value={fire} min={0} max={1} step={0.01} show={fire ? pct(fire) : "꺼짐"} onChange={(v) => set({ fire: v })} />
    </div>
  );
}

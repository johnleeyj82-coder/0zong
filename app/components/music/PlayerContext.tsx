"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { getTracks, trackUrl } from "@/lib/client";
import type { Track } from "@/lib/music";
import { Engine } from "./engine";

/** Settings remembered per browser (a convenience; nothing here is shared or sent anywhere). */
type Settings = { volume: number; rate: number; keepPitch: boolean; rain: number; fire: number; scene: number; lastId: string | null };
const KEY = "room.player";
const DEFAULTS: Settings = { volume: 0.8, rate: 1, keepPitch: true, rain: 0, fire: 0, scene: 1, lastId: null };

export type Pomodoro = { phase: "focus" | "break"; endsAt: number } | null;
export const FOCUS_MIN = 25, BREAK_MIN = 5, SLEEP_FADE_S = 30;

type Ctx = Settings & {
  tracks: Track[];
  reloadTracks: () => Promise<void>;
  current: Track | null;
  playing: boolean;
  position: number;
  duration: number;
  /** True once anything was played or an ambient bed turned on: the mini player shows from then on. */
  started: boolean;
  listen: boolean;
  setListen: (v: boolean) => void;
  play: (id?: string) => void;
  pause: () => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  seek: (sec: number) => void;
  set: (patch: Partial<Settings>) => void;
  sleepEndsAt: number | null;
  setSleep: (minutes: number | null) => void;
  pomodoro: Pomodoro;
  setPomodoro: (on: boolean) => void;
};
const C = createContext<Ctx | null>(null);

function load(): Settings {
  let s: Partial<Settings> = {};
  try { s = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { /* storage blocked */ }
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  return { ...DEFAULTS, scene: reduce ? 0 : DEFAULTS.scene, ...s };
}

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const engine = useRef<Engine | null>(null);
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [started, setStarted] = useState(false);
  const [listen, setListen] = useState(false);
  const [sleepEndsAt, setSleepEndsAt] = useState<number | null>(null);
  const [pomodoro, setPomo] = useState<Pomodoro>(null);
  const tracksRef = useRef<Track[]>([]);
  const currentRef = useRef<string | null>(null);

  const reloadTracks = useCallback(async () => {
    const t = await getTracks();
    tracksRef.current = t; setTracks(t);
  }, []);

  useEffect(() => {
    const e = new Engine();
    engine.current = e;
    const s = load();
    setSettings(s);
    e.setVolume(s.volume); e.setRate(s.rate, s.keepPitch);
    const a = e.audio;
    const onTime = () => setPosition(a.currentTime);
    const onMeta = () => { setDuration(a.duration || 0); e.setRate(settingsRef.current.rate, settingsRef.current.keepPitch); };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => step(1, true);
    a.addEventListener("timeupdate", onTime); a.addEventListener("loadedmetadata", onMeta);
    a.addEventListener("play", onPlay); a.addEventListener("pause", onPause); a.addEventListener("ended", onEnded);
    void reloadTracks().then(() => {
      const last = tracksRef.current.find((t) => t.id === s.lastId) ?? tracksRef.current[0];
      if (last) { currentRef.current = last.id; setCurrentId(last.id); a.src = trackUrl(last); }
    });
    return () => {
      a.pause();
      a.removeEventListener("timeupdate", onTime); a.removeEventListener("loadedmetadata", onMeta);
      a.removeEventListener("play", onPlay); a.removeEventListener("pause", onPause); a.removeEventListener("ended", onEnded);
    };
    // `step` and `settingsRef` are declared below; both are stable, and the listeners only run after this render.
  }, [reloadTracks]);

  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const set = useCallback((patch: Partial<Settings>) => {
    const e = engine.current;
    setSettings((cur) => {
      const s = { ...cur, ...patch };
      if (e) {
        if (patch.volume !== undefined) e.setVolume(s.volume);
        if (patch.rate !== undefined || patch.keepPitch !== undefined) e.setRate(s.rate, s.keepPitch);
        if (patch.rain !== undefined) e.setAmbient("rain", s.rain);
        if (patch.fire !== undefined) e.setAmbient("fire", s.fire);
      }
      if ((patch.rain ?? 0) > 0 || (patch.fire ?? 0) > 0) setStarted(true);
      try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* storage blocked */ }
      return s;
    });
  }, []);

  const playId = useCallback((id: string) => {
    const e = engine.current, t = tracksRef.current.find((x) => x.id === id);
    if (!e || !t) return;
    e.start();
    if (currentRef.current !== id || !e.audio.src) { e.audio.src = trackUrl(t); currentRef.current = id; setCurrentId(id); setPosition(0); }
    e.setRate(settingsRef.current.rate, settingsRef.current.keepPitch);
    void e.audio.play().catch(() => setPlaying(false));
    setStarted(true);
    set({ lastId: id });
  }, [set]);

  /** Moves through the list; wraps around. `auto` is the end of a track. */
  const step = useCallback((dir: 1 | -1, auto = false) => {
    const list = tracksRef.current;
    if (!list.length) return;
    const i = Math.max(0, list.findIndex((t) => t.id === currentRef.current));
    const nextTrack = list[(i + dir + list.length) % list.length];
    if (auto && list.length === 1) { engine.current!.audio.currentTime = 0; void engine.current!.audio.play(); return; }
    playId(nextTrack.id);
  }, [playId]);

  const play = useCallback((id?: string) => {
    const target = id ?? currentRef.current ?? tracksRef.current[0]?.id;
    if (target) playId(target);
  }, [playId]);
  const pause = useCallback(() => engine.current?.audio.pause(), []);
  const toggle = useCallback(() => (engine.current && !engine.current.audio.paused ? pause() : play()), [pause, play]);
  const next = useCallback(() => step(1), [step]);
  const prev = useCallback(() => {
    const a = engine.current?.audio;
    if (a && a.currentTime > 3) { a.currentTime = 0; return; }
    step(-1);
  }, [step]);
  const seek = useCallback((sec: number) => {
    const a = engine.current?.audio;
    if (a && Number.isFinite(sec)) { a.currentTime = Math.max(0, Math.min(sec, a.duration || sec)); setPosition(a.currentTime); }
  }, []);

  // Sleep timer: fade the master over the last SLEEP_FADE_S seconds, then stop and restore the level.
  const setSleep = useCallback((minutes: number | null) => {
    engine.current?.fadeMaster(1, 0.2);
    setSleepEndsAt(minutes ? Date.now() + minutes * 60_000 : null);
  }, []);
  // Pomodoro: focus and break alternate until turned off; a chime marks each switch.
  const setPomodoro = useCallback((on: boolean) => {
    if (on) engine.current?.start();
    setPomo(on ? { phase: "focus", endsAt: Date.now() + FOCUS_MIN * 60_000 } : null);
  }, []);

  useEffect(() => {
    if (!sleepEndsAt && !pomodoro) return;
    let fading = false;
    const t = setInterval(() => {
      const now = Date.now(), e = engine.current;
      if (sleepEndsAt && e) {
        const left = (sleepEndsAt - now) / 1000;
        if (left <= SLEEP_FADE_S && !fading) { fading = true; e.fadeMaster(0, Math.max(0.1, left)); }
        if (left <= 0) {
          e.audio.pause();
          set({ rain: 0, fire: 0 });
          e.fadeMaster(1, 0.2);
          setSleepEndsAt(null);
        }
      }
      if (pomodoro && now >= pomodoro.endsAt) {
        e?.chime();
        setPomo(pomodoro.phase === "focus"
          ? { phase: "break", endsAt: now + BREAK_MIN * 60_000 }
          : { phase: "focus", endsAt: now + FOCUS_MIN * 60_000 });
      }
    }, 500);
    return () => clearInterval(t);
  }, [sleepEndsAt, pomodoro, set]);

  const current = tracks.find((t) => t.id === currentId) ?? null;
  const value = useMemo<Ctx>(() => ({
    ...settings, tracks, reloadTracks, current, playing, position, duration: duration || current?.duration || 0, started,
    listen, setListen, play, pause, toggle, next, prev, seek, set, sleepEndsAt, setSleep, pomodoro, setPomodoro,
  }), [settings, tracks, reloadTracks, current, playing, position, duration, started, listen, play, pause, toggle, next, prev, seek, set,
    sleepEndsAt, setSleep, pomodoro, setPomodoro]);

  return <C.Provider value={value}>{children}</C.Provider>;
}

export function usePlayer() {
  const v = useContext(C);
  if (!v) throw new Error("usePlayer must be used inside PlayerProvider");
  return v;
}

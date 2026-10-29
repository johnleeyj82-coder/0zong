"use client";
// State of the 3D house shared by the canvas and the UI on top of it: which room you are in, what is selected or hovered,
// the picture quality, Seoul's time and weather, and the time you set from the bed (this tab only).
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { ROOMS, SPACES, type RoomKey, type SpaceId } from "../data";
import { getEnv, setEnvOverride } from "@/lib/client";
import { isTime, timeOfDay, type EnvOverride, type EnvPayload, type TimeOfDay } from "@/lib/env";
import { useRoom } from "./RoomContext";

export type Quality = "high" | "medium" | "low" | "off";
export type QualitySetting = Quality | "auto";
export type Selected = RoomKey | "bed" | null;
export type Hover = { id: string; label: string } | null;

type Ctx = {
  space: SpaceId;
  /** The room you came from (the camera starts at that door). */
  cameFrom: SpaceId | null;
  go: (to: SpaceId, then?: Selected) => void;
  /** True while the screen is dark between two rooms (or while blinking on the bed). */
  dark: boolean;
  selected: Selected;
  select: (s: Selected) => void;
  hover: Hover;
  setHover: React.Dispatch<React.SetStateAction<Hover>>;
  /** null until the device has been checked. */
  quality: Quality | null;
  qualitySetting: QualitySetting;
  setQuality: (q: QualitySetting) => void;
  /** Lower the automatic quality one step (the canvas was too slow). */
  degrade: () => void;
  env: EnvPayload | null;
  setWeather: (o: EnvOverride) => Promise<string | null>;
  now: number;
  /** Time shown in the house: the bed's choice, else Seoul's. */
  time: TimeOfDay;
  timeOverride: TimeOfDay | null;
  setTime: (t: TimeOfDay | null) => void;
};
const C = createContext<Ctx | null>(null);

const QKEY = "room.quality";
const TKEY = "room.time";
const FADE_MS = 300;
const isSpace = (v: unknown): v is SpaceId => SPACES.some((s) => s.id === v);

/** A first guess from the device: phones and small machines start low, everything else medium. */
function autoQuality(): Quality {
  if (!hasWebGL()) return "off";
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const cores = navigator.hardwareConcurrency ?? 4;
  return coarse || cores <= 4 ? "low" : "medium";
}

export function SceneProvider({ children }: { children: React.ReactNode }) {
  const { track } = useRoom();
  const [space, setSpace] = useState<SpaceId>("main");
  const [cameFrom, setCameFrom] = useState<SpaceId | null>(null);
  const [dark, setDark] = useState(false);
  const [selected, setSelected] = useState<Selected>(null);
  const [hover, setHover] = useState<Hover>(null);
  const [qualitySetting, setQualitySetting] = useState<QualitySetting>("auto");
  const [auto, setAuto] = useState<Quality | null>(null);
  const [env, setEnv] = useState<EnvPayload | null>(null);
  // 0 until mounted, so the server render and the first client render agree (the clock is drawn after that).
  const [now, setNow] = useState(0);
  const [timeOverride, setTimeOverride] = useState<TimeOfDay | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const busy = useRef(false);

  useEffect(() => {
    const q = new URLSearchParams(location.search).get("room");
    if (isSpace(q)) setSpace(q);
    setAuto(autoQuality());
    try {
      const s = localStorage.getItem(QKEY);
      if (s === "auto" || s === "high" || s === "medium" || s === "low" || s === "off") setQualitySetting(s);
      const t = sessionStorage.getItem(TKEY);
      if (isTime(t)) setTimeOverride(t);
    } catch { /* storage blocked */ }
    setNow(Date.now());
    void getEnv().then(setEnv);
    const clock = setInterval(() => setNow(Date.now()), 30_000);
    const forecast = setInterval(() => void getEnv().then(setEnv), 30 * 60_000);
    const pending = timers.current;
    return () => { clearInterval(clock); clearInterval(forecast); pending.forEach(clearTimeout); };
  }, []);

  /** Dark for a moment, do `swap` in the dark, then light again. Reduced motion: instant. */
  const blink = useCallback((swap: () => void) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { swap(); return; }
    if (busy.current) return;
    busy.current = true;
    setDark(true);
    timers.current.push(setTimeout(() => { swap(); setDark(false); busy.current = false; }, FADE_MS));
  }, []);

  const go = useCallback((to: SpaceId, then: Selected = null) => {
    if (to === space) { setSelected(then); return; }
    blink(() => {
      setCameFrom(space); setSpace(to); setSelected(then); setHover(null);
      const url = new URL(location.href);
      url.searchParams.set("room", to);
      history.replaceState(history.state, "", url);
    });
    track("move", to);
  }, [space, blink, track]);

  /** Selecting a hobby that lives in another room walks there first. */
  const select = useCallback((s: Selected) => {
    const home = s === "bed" ? "bedroom" : s ? ROOMS.find((r) => r.key === s)?.space : undefined;
    if (home && home !== space) go(home, s);
    else setSelected(s);
  }, [space, go]);

  const setQuality = useCallback((q: QualitySetting) => {
    setQualitySetting(q);
    try { localStorage.setItem(QKEY, q); } catch { /* storage blocked */ }
  }, []);
  const degrade = useCallback(() => setAuto((q) => (q === "high" ? "medium" : q === "medium" ? "low" : q)), []);

  const setWeather = useCallback(async (o: EnvOverride) => {
    const r = await setEnvOverride(o);
    if (!r.ok) return r.error;
    setEnv(r.data);
    return null;
  }, []);

  const setTime = useCallback((t: TimeOfDay | null) => {
    blink(() => {
      setTimeOverride(t);
      try { if (t) sessionStorage.setItem(TKEY, t); else sessionStorage.removeItem(TKEY); } catch { /* storage blocked */ }
    });
  }, [blink]);

  // null until the browser has been checked (server render and the first paint): nothing is drawn yet.
  // Without WebGL the automatic guess is "off", and no setting can turn the canvas back on.
  const quality: Quality | null = auto === null ? null : qualitySetting === "auto" || auto === "off" ? auto : qualitySetting;
  const time = useMemo<TimeOfDay>(
    () => timeOverride ?? (env ? timeOfDay(now, env.sunrise, env.sunset) : "night"),
    [timeOverride, env, now],
  );

  const value: Ctx = {
    space, cameFrom, go, dark, selected, select, hover, setHover, quality, qualitySetting, setQuality, degrade,
    env, setWeather, now, time, timeOverride, setTime,
  };
  return <C.Provider value={value}>{children}</C.Provider>;
}

let webgl: boolean | null = null;
function hasWebGL() {
  if (webgl !== null) return webgl;
  try {
    const c = document.createElement("canvas");
    webgl = !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch { webgl = false; }
  return webgl;
}

export function useScene() {
  const v = useContext(C);
  if (!v) throw new Error("useScene must be used inside SceneProvider");
  return v;
}

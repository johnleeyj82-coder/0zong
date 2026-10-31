"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { ROOMS, type Room, type RoomKey } from "../data";
import { checkOwner, getRoomOverrides, saveRoom, sendEvents } from "@/lib/client";
import type { EventType, RoomOverride, TrackEvent } from "@/lib/types";

/** How this visitor entered: left a name, went anonymous, skipped (never tracked), or is the owner (never tracked). */
export type Mode = "named" | "anonymous" | "skip" | "owner";
export type Phase = "dark" | "lights" | "gate" | "done";
/** Side panels opened from the dock (the old sections below the hero). */
export type Panel = "about" | "guestbook" | "today";

type Saved = { id: string; name: string; mode: Mode };
const STORE = "room.visitor";

type Ctx = {
  visitorId: string;
  name: string;
  mode: Mode | null;
  owner: boolean;
  returning: boolean;
  ready: boolean;
  phase: Phase;
  setPhase: (p: Phase) => void;
  enter: (mode: Mode, name: string) => void;
  setOwner: (v: boolean) => void;
  track: (type: EventType, room?: string, value?: number) => void;
  rooms: Room[];
  editRoom: (key: RoomKey, o: RoomOverride) => Promise<string | null>;
  drawer: RoomKey | null;
  openDrawer: (key: RoomKey | null) => void;
  dashboard: boolean;
  setDashboard: (v: boolean) => void;
  panel: Panel | null;
  setPanel: (p: Panel | null) => void;
};
const C = createContext<Ctx | null>(null);

const newId = () => (crypto.randomUUID ? crypto.randomUUID() : `v-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`);
function loadSaved(): Saved | null {
  try { const raw = localStorage.getItem(STORE); return raw ? (JSON.parse(raw) as Saved) : null; } catch { return null; }
}
function save(s: Saved) {
  try { localStorage.setItem(STORE, JSON.stringify(s)); } catch { /* storage blocked: the choice lasts for this visit only */ }
}

export function RoomProvider({ children }: { children: React.ReactNode }) {
  const [visitorId, setVisitorId] = useState("");
  const [name, setName] = useState("");
  const [mode, setMode] = useState<Mode | null>(null);
  const [owner, setOwnerState] = useState(false);
  const [returning, setReturning] = useState(false);
  const [ready, setReady] = useState(false);
  const [phase, setPhase] = useState<Phase>("dark");
  const [overrides, setOverrides] = useState<Record<string, RoomOverride>>({});
  const [drawer, setDrawer] = useState<RoomKey | null>(null);
  const [dashboard, setDashboard] = useState(false);
  const [panel, setPanel] = useState<Panel | null>(null);
  const queue = useRef<TrackEvent[]>([]);
  const modeRef = useRef<Mode | null>(null);
  const idRef = useRef("");

  useEffect(() => {
    const s = loadSaved();
    const id = s?.id || newId();
    setVisitorId(id); idRef.current = id;
    if (s && s.mode !== "owner") {
      setName(s.name); setMode(s.mode); modeRef.current = s.mode; setReturning(true);
      if (s.mode === "named" || s.mode === "anonymous") queue.current.push({ type: "enter", at: Date.now() });
    }
    void checkOwner().then((o) => { if (o) { setOwnerState(true); setMode("owner"); modeRef.current = "owner"; } setReady(true); });
    void getRoomOverrides().then(setOverrides);
  }, []);

  const flush = useCallback((beacon = false) => {
    const m = modeRef.current;
    if (m !== "named" && m !== "anonymous") { queue.current = []; return; }
    const batch = queue.current.splice(0);
    sendEvents(idRef.current, batch, beacon);
  }, []);

  useEffect(() => {
    const t = setInterval(() => flush(), 5000);
    const onHide = () => flush(true);
    window.addEventListener("pagehide", onHide);
    return () => { clearInterval(t); window.removeEventListener("pagehide", onHide); };
  }, [flush]);

  const track = useCallback((type: EventType, room?: string, value?: number) => {
    const m = modeRef.current;
    if (m !== "named" && m !== "anonymous") return;
    queue.current.push({ type, room, value, at: Date.now() });
  }, []);

  const enter = useCallback((m: Mode, n: string) => {
    setMode(m); modeRef.current = m; setName(n);
    save({ id: idRef.current, name: n, mode: m });
    if (m === "named" || m === "anonymous") { queue.current.push({ type: "enter", at: Date.now() }); flush(); }
  }, [flush]);

  const setOwner = useCallback((v: boolean) => {
    setOwnerState(v);
    if (v) { setMode("owner"); modeRef.current = "owner"; }
    else { setMode(null); modeRef.current = null; try { localStorage.removeItem(STORE); } catch { /* ignore */ } }
  }, []);

  const rooms = useMemo(() => ROOMS.map((r) => ({ ...r, ...overrides[r.key] })), [overrides]);

  const editRoom = useCallback(async (key: RoomKey, o: RoomOverride) => {
    const r = await saveRoom(key, o);
    if (!r.ok) return r.error;
    setOverrides((cur) => ({ ...cur, [key]: r.data.room }));
    return null;
  }, []);

  const openDrawer = useCallback((key: RoomKey | null) => {
    setDrawer(key);
    if (key) track("open", key);
  }, [track]);

  const value: Ctx = {
    visitorId, name, mode, owner, returning, ready, phase, setPhase, enter, setOwner, track,
    rooms, editRoom, drawer, openDrawer, dashboard, setDashboard, panel, setPanel,
  };
  return <C.Provider value={value}>{children}</C.Provider>;
}

export function useRoom() {
  const v = useContext(C);
  if (!v) throw new Error("useRoom must be used inside RoomProvider");
  return v;
}

"use client";
// Browser-side API. With NEXT_PUBLIC_DEMO=1 (the hosted static preview) there is no server, so everything is kept in
// this browser's localStorage instead, and owner mode uses the demo password "demo". Never enable demo mode in production.
import type { Dashboard, Message, RoomOverride, TrackEvent, Visitor, VisitMode } from "./types";

export const DEMO = process.env.NEXT_PUBLIC_DEMO === "1";
const DEMO_OWNER = "0zong";
const DEMO_PASSWORD = "demo";

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

async function call<T>(url: string, init?: RequestInit): Promise<Result<T>> {
  try {
    const r = await fetch(url, { ...init, headers: { "Content-Type": "application/json" }, credentials: "same-origin" });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) return { ok: false, error: data.error || "잠시 문제가 생겼어요. 다시 시도해주세요." };
    return { ok: true, data };
  } catch {
    return { ok: false, error: "서버에 연결하지 못했어요. 인터넷 연결을 확인해주세요." };
  }
}

/* ---------- demo store (localStorage) ---------- */
type DemoDB = { visitors: Record<string, Visitor>; messages: Message[]; rooms: Record<string, RoomOverride>; owner: boolean };
const KEY = "room.demo.db";
function demoRead(): DemoDB {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* storage blocked */ }
  return seed();
}
function demoWrite(db: DemoDB) {
  try { localStorage.setItem(KEY, JSON.stringify(db)); } catch { /* storage blocked */ }
}
function seed(): DemoDB {
  const now = Date.now(), h = 3600_000;
  const ev = (type: TrackEvent["type"], room: string | undefined, ago: number): TrackEvent => ({ type, room, at: now - ago });
  return {
    owner: false,
    rooms: {},
    visitors: {
      "demo-visitor-0001": { id: "demo-visitor-0001", name: "하늘 (예시)", mode: "named", firstAt: now - 26 * h, lastAt: now - 25 * h,
        events: [ev("enter", undefined, 26 * h), ev("view", "game", 26 * h - 60e3), ev("view", "poker", 26 * h - 90e3), ev("open", "poker", 26 * h - 120e3), ev("dock", "tetris", 25.5 * h), ev("score", "tetris", 25 * h)] },
      "demo-visitor-0002": { id: "demo-visitor-0002", name: "익명 0412 (예시)", mode: "anonymous", firstAt: now - 5 * h, lastAt: now - 5 * h,
        events: [ev("enter", undefined, 5 * h), ev("view", "movie", 5 * h - 30e3), ev("open", "movie", 5 * h - 40e3), ev("view", "book", 5 * h - 80e3)] },
    },
    messages: [
      { id: "m1", visitorId: "demo-visitor-0001", name: "하늘 (예시)", text: "포커 테이블 실시간 방 열리면 꼭 불러줘요!", at: now - 25 * h },
      { id: "m2", visitorId: "demo-visitor-0002", name: "익명 0412 (예시)", text: "영화 평점 기준이 궁금해요. 애프터썬 5점 동의합니다.", at: now - 5 * h },
    ],
  };
}

/* ---------- API ---------- */
export async function registerVisit(visitorId: string, name: string, mode: VisitMode): Promise<Result<{ name?: string; mode?: VisitMode; needsPassword?: boolean }>> {
  if (!DEMO) return call("/api/visit", { method: "POST", body: JSON.stringify({ visitorId, name, mode }) });
  if (mode === "named" && !name.trim()) return { ok: false, error: "이름을 입력해주세요." };
  if (mode === "named" && name.trim().toLowerCase() === DEMO_OWNER) return { ok: true, data: { needsPassword: true } };
  const db = demoRead();
  const finalName = mode === "anonymous" ? `익명 ${visitorId.replace(/[^0-9]/g, "").slice(-4).padStart(4, "0")}` : name.trim().slice(0, 20);
  const v = db.visitors[visitorId] ?? { id: visitorId, name: finalName, mode, firstAt: Date.now(), lastAt: Date.now(), events: [] };
  v.name = finalName; v.mode = mode; v.lastAt = Date.now();
  db.visitors[visitorId] = v; demoWrite(db);
  return { ok: true, data: { name: finalName, mode } };
}

export async function login(name: string, password: string): Promise<Result<{ owner: boolean }>> {
  if (!DEMO) return call("/api/auth", { method: "POST", body: JSON.stringify({ name, password }) });
  if (name.trim().toLowerCase() !== DEMO_OWNER || password !== DEMO_PASSWORD) return { ok: false, error: "비밀번호가 맞지 않아요." };
  const db = demoRead(); db.owner = true; demoWrite(db);
  return { ok: true, data: { owner: true } };
}

export async function logout() {
  if (!DEMO) return call("/api/auth", { method: "DELETE" });
  const db = demoRead(); db.owner = false; demoWrite(db);
  return { ok: true as const, data: { owner: false } };
}

export async function checkOwner(): Promise<boolean> {
  if (DEMO) return demoRead().owner;
  const r = await call<{ owner: boolean }>("/api/auth");
  return r.ok && r.data.owner;
}

export function sendEvents(visitorId: string, events: TrackEvent[], beacon = false) {
  if (!events.length) return;
  if (DEMO) {
    const db = demoRead(); const v = db.visitors[visitorId];
    if (v) { v.events.push(...events); v.lastAt = Date.now(); demoWrite(db); }
    return;
  }
  const body = JSON.stringify({ visitorId, events });
  if (beacon && navigator.sendBeacon) navigator.sendBeacon("/api/events", new Blob([body], { type: "application/json" }));
  else void call("/api/events", { method: "POST", body, keepalive: true });
}

export async function getMessages(): Promise<Message[]> {
  if (DEMO) { const db = demoRead(); return [...db.messages].filter((m) => db.owner || !m.hidden).sort((a, b) => b.at - a.at); }
  const r = await call<{ messages: Message[] }>("/api/guestbook");
  return r.ok ? r.data.messages : [];
}

export async function postMessage(visitorId: string, name: string, text: string): Promise<Result<{ message: Message }>> {
  if (!DEMO) return call("/api/guestbook", { method: "POST", body: JSON.stringify({ visitorId, name, text }) });
  if (!text.trim()) return { ok: false, error: "남길 말을 적어주세요." };
  const db = demoRead();
  const m: Message = { id: crypto.randomUUID(), visitorId, name: name.trim().slice(0, 20) || "익명", text: text.trim().slice(0, 300), at: Date.now() };
  db.messages.push(m); demoWrite(db);
  return { ok: true, data: { message: m } };
}

export async function hideMessage(id: string, hidden: boolean) {
  if (!DEMO) return call("/api/guestbook", { method: "PATCH", body: JSON.stringify({ id, hidden }) });
  const db = demoRead(); const m = db.messages.find((x) => x.id === id); if (m) m.hidden = hidden; demoWrite(db);
  return { ok: true as const, data: {} };
}

export async function getRoomOverrides(): Promise<Record<string, RoomOverride>> {
  if (DEMO) return demoRead().rooms;
  const r = await call<{ rooms: Record<string, RoomOverride> }>("/api/rooms");
  return r.ok ? r.data.rooms : {};
}

export async function saveRoom(key: string, o: RoomOverride): Promise<Result<{ room: RoomOverride }>> {
  if (!DEMO) return call("/api/rooms", { method: "PUT", body: JSON.stringify({ key, ...o }) });
  const db = demoRead(); db.rooms[key] = { ...db.rooms[key], ...o }; demoWrite(db);
  return { ok: true, data: { room: db.rooms[key] } };
}

export async function getDashboard(): Promise<Result<Dashboard>> {
  if (!DEMO) return call("/api/admin");
  const db = demoRead();
  if (!db.owner) return { ok: false, error: "방 주인만 볼 수 있어요." };
  const interest: Record<string, number> = {};
  const visitors = Object.values(db.visitors).sort((a, b) => b.lastAt - a.lastAt);
  for (const v of visitors) for (const e of v.events) if (e.room && e.type !== "enter" && e.type !== "guestbook") interest[e.room] = (interest[e.room] ?? 0) + (e.type === "open" ? 2 : 1);
  return { ok: true, data: { visitors, interest, messages: [...db.messages].sort((a, b) => b.at - a.at) } };
}

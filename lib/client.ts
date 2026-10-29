"use client";
// Browser-side API. With NEXT_PUBLIC_DEMO=1 (the hosted static preview) there is no server, so everything is kept in
// this browser's localStorage instead, and owner mode uses the demo password "demo". Never enable demo mode in production.
import type { Dashboard, Message, RoomOverride, TrackEvent, Visitor, VisitMode } from "./types";
import type { Movie, MovieInput } from "./movies";
import type { Track } from "./music";
import { buildView, EXAMPLE_NOTES, EXAMPLE_SLOTS, type GamesPayload, type Note, type Slot, type SteamGame } from "./games";
import type { TmdbHit, TmdbMovie } from "./tmdb.types";
import { EXAMPLE_MOVIES } from "./movies.example";

export const DEMO = process.env.NEXT_PUBLIC_DEMO === "1";
const DEMO_OWNER = "0zong";
const DEMO_PASSWORD = "demo";

/** Links between pages. The static preview may live under any folder, so it uses relative paths (subpages get <base href="../">). */
export const pageHref = (to: "home" | "movie" | "game") => (DEMO ? (to === "home" ? "./index.html" : `./${to}/index.html`) : to === "home" ? "/" : `/${to}`);

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
type DemoDB = { visitors: Record<string, Visitor>; messages: Message[]; rooms: Record<string, RoomOverride>; owner: boolean; movies?: Movie[]; games?: { slots: Slot[]; notes: Note[] } };
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

export async function getMovies(): Promise<Result<Movie[]>> {
  if (DEMO) { const m = demoRead().movies; return { ok: true, data: m?.length ? m : EXAMPLE_MOVIES }; }
  const r = await call<{ movies: Movie[] }>("/api/movies");
  return r.ok ? { ok: true, data: r.data.movies } : r;
}

/** Owner only. Creates when `id` is missing, otherwise replaces. */
export async function saveMovie(m: MovieInput): Promise<Result<Movie>> {
  if (!DEMO) {
    const r = await call<{ movie: Movie }>("/api/movies", { method: m.id ? "PUT" : "POST", body: JSON.stringify(m) });
    return r.ok ? { ok: true, data: r.data.movie } : r;
  }
  const db = demoRead();
  if (!db.owner) return { ok: false, error: "권한이 없어요." };
  const movie: Movie = { ...m, id: m.id || crypto.randomUUID() };
  const list = db.movies ?? [];
  const i = list.findIndex((x) => x.id === movie.id);
  if (i >= 0) list[i] = movie; else list.push(movie);
  db.movies = list; demoWrite(db);
  return { ok: true, data: movie };
}

export async function deleteMovie(id: string): Promise<Result<unknown>> {
  if (!DEMO) return call(`/api/movies?id=${encodeURIComponent(id)}`, { method: "DELETE" });
  const db = demoRead();
  if (!db.owner) return { ok: false, error: "권한이 없어요." };
  db.movies = (db.movies ?? []).filter((x) => x.id !== id); demoWrite(db);
  return { ok: true, data: {} };
}

export async function importMovies(movies: MovieInput[]): Promise<Result<{ added: number; updated: number; skipped: number }>> {
  if (!DEMO) return call("/api/movies/import", { method: "POST", body: JSON.stringify({ movies }) });
  const db = demoRead();
  if (!db.owner) return { ok: false, error: "권한이 없어요." };
  const list = db.movies ?? [];
  let added = 0, updated = 0;
  for (const m of movies) {
    const movie = { ...m, id: m.id || crypto.randomUUID() };
    const i = list.findIndex((x) => x.id === movie.id);
    if (i >= 0) { list[i] = movie; updated++; } else { list.push(movie); added++; }
  }
  db.movies = list; demoWrite(db);
  return { ok: true, data: { added, updated, skipped: 0 } };
}

const NO_TMDB_DEMO = "미리보기에는 서버가 없어서 TMDB 검색을 쓸 수 없어요. 직접 입력해주세요.";

export async function searchTmdb(q: string, signal?: AbortSignal): Promise<Result<TmdbHit[]>> {
  if (DEMO) return { ok: false, error: NO_TMDB_DEMO };
  const r = await call<{ results: TmdbHit[] }>(`/api/tmdb?q=${encodeURIComponent(q)}`, { signal });
  return r.ok ? { ok: true, data: r.data.results } : r;
}

export async function tmdbDetails(id: number): Promise<Result<TmdbMovie>> {
  if (DEMO) return { ok: false, error: NO_TMDB_DEMO };
  const r = await call<{ movie: TmdbMovie }>(`/api/tmdb?id=${id}`);
  return r.ok ? { ok: true, data: r.data.movie } : r;
}

/* ---------- music ---------- */
const NO_UPLOAD_DEMO = "미리보기에는 서버가 없어서 곡을 올릴 수 없어요. 환경음과 듣기 모드는 쓸 수 있어요.";

export async function getTracks(): Promise<Track[]> {
  if (DEMO) return [];
  const r = await call<{ tracks: Track[] }>("/api/music");
  return r.ok ? r.data.tracks : [];
}

export const trackUrl = (t: Track) => `/api/music/file/${t.id}`;

/** Owner only. Multipart, so it does not go through call() (which sends JSON). */
export async function uploadTrack(form: FormData): Promise<Result<Track>> {
  if (DEMO) return { ok: false, error: NO_UPLOAD_DEMO };
  try {
    const r = await fetch("/api/music", { method: "POST", body: form, credentials: "same-origin" });
    const data = await r.json().catch(() => ({}));
    return r.ok ? { ok: true, data: data.track } : { ok: false, error: data.error || "올리지 못했어요. 다시 시도해주세요." };
  } catch {
    return { ok: false, error: "서버에 연결하지 못했어요. 인터넷 연결을 확인해주세요." };
  }
}

export async function editTrack(id: string, o: Pick<Track, "title" | "artist" | "credit">): Promise<Result<Track>> {
  if (DEMO) return { ok: false, error: NO_UPLOAD_DEMO };
  const r = await call<{ track: Track }>("/api/music", { method: "PUT", body: JSON.stringify({ id, ...o }) });
  return r.ok ? { ok: true, data: r.data.track } : r;
}

export async function reorderTracks(order: string[]): Promise<Result<Track[]>> {
  if (DEMO) return { ok: false, error: NO_UPLOAD_DEMO };
  const r = await call<{ tracks: Track[] }>("/api/music", { method: "PATCH", body: JSON.stringify({ order }) });
  return r.ok ? { ok: true, data: r.data.tracks } : r;
}

export async function deleteTrack(id: string): Promise<Result<unknown>> {
  if (DEMO) return { ok: false, error: NO_UPLOAD_DEMO };
  return call(`/api/music?id=${encodeURIComponent(id)}`, { method: "DELETE" });
}

/* ---------- games ---------- */
const NO_STEAM_DEMO = "미리보기에는 서버가 없어서 Steam 연결과 스크린샷 올리기를 쓸 수 없어요. 슬롯과 메모는 이 브라우저에 저장돼요.";
type SlotInput = Partial<Pick<Slot, "id" | "title" | "status" | "progress" | "progressLabel" | "lastSpot" | "manualMinutes" | "appid">>;
type NoteInput = Omit<Note, "id" | "example"> & { id?: string };

export async function getGames(): Promise<Result<GamesPayload>> {
  if (!DEMO) return call<GamesPayload>("/api/games");
  const g = demoRead().games, empty = !g?.slots.length;
  const slots = empty ? EXAMPLE_SLOTS : g!.slots, notes = empty ? EXAMPLE_NOTES : g!.notes;
  return { ok: true, data: { slots: buildView(slots, notes), notes: [...notes].sort((a, b) => b.date.localeCompare(a.date)), syncedAt: null } };
}

export const shotUrl = (id: string) => `/api/games/shot/${id}`;

export async function syncSteam(): Promise<Result<{ count: number }>> {
  if (DEMO) return { ok: false, error: NO_STEAM_DEMO };
  return call("/api/games/sync", { method: "POST" });
}

export async function getLibrary(q: string): Promise<Result<{ games: (SteamGame & { pinned: boolean })[]; syncedAt: number | null; error?: string }>> {
  if (DEMO) return { ok: false, error: NO_STEAM_DEMO };
  return call(`/api/games/library?q=${encodeURIComponent(q)}`);
}

/** Owner only. No id creates (pins `appid` or adds by hand), an id edits. */
export async function saveSlot(input: SlotInput): Promise<Result<Slot>> {
  if (!DEMO) {
    const r = await call<{ slot: Slot }>("/api/games/slots", { method: input.id ? "PUT" : "POST", body: JSON.stringify(input) });
    return r.ok ? { ok: true, data: r.data.slot } : r;
  }
  const db = demoRead();
  if (!db.owner) return { ok: false, error: "권한이 없어요." };
  if (input.appid !== undefined) return { ok: false, error: NO_STEAM_DEMO };
  if (!input.title?.trim()) return { ok: false, error: "게임 이름을 적어주세요." };
  const g = (db.games ??= { slots: [], notes: [] });
  const cur = g.slots.find((x) => x.id === input.id);
  const slot: Slot = {
    id: cur?.id ?? crypto.randomUUID(), kind: "manual", addedAt: cur?.addedAt ?? Date.now(),
    title: input.title.trim().slice(0, 80), status: input.status ?? "playing", progressLabel: input.progressLabel ?? "",
    lastSpot: input.lastSpot ?? "", ...(input.progress !== undefined && { progress: input.progress }),
    ...(input.manualMinutes !== undefined && { manualMinutes: input.manualMinutes }),
  };
  g.slots = cur ? g.slots.map((x) => (x.id === slot.id ? slot : x)) : [...g.slots, slot];
  demoWrite(db);
  return { ok: true, data: slot };
}

export async function deleteSlot(id: string): Promise<Result<unknown>> {
  if (!DEMO) return call(`/api/games/slots?id=${encodeURIComponent(id)}`, { method: "DELETE" });
  const db = demoRead();
  if (!db.owner || !db.games) return { ok: false, error: "권한이 없어요." };
  db.games.slots = db.games.slots.filter((x) => x.id !== id);
  db.games.notes = db.games.notes.filter((n) => n.slotId !== id);
  demoWrite(db);
  return { ok: true, data: {} };
}

export async function saveNote(input: NoteInput): Promise<Result<Note>> {
  if (!DEMO) {
    const r = await call<{ note: Note }>("/api/games/notes", { method: input.id ? "PUT" : "POST", body: JSON.stringify(input) });
    return r.ok ? { ok: true, data: r.data.note } : r;
  }
  const db = demoRead();
  if (!db.owner || !db.games?.slots.some((x) => x.id === input.slotId)) return { ok: false, error: "그 게임 슬롯을 찾지 못했어요." };
  if (!input.text.trim()) return { ok: false, error: "메모를 적어주세요." };
  const note: Note = { ...input, id: input.id ?? crypto.randomUUID(), text: input.text.trim().slice(0, 500), shots: [] };
  db.games.notes = input.id ? db.games.notes.map((n) => (n.id === note.id ? note : n)) : [...db.games.notes, note];
  demoWrite(db);
  return { ok: true, data: note };
}

export async function deleteNote(id: string): Promise<Result<unknown>> {
  if (!DEMO) return call(`/api/games/notes?id=${encodeURIComponent(id)}`, { method: "DELETE" });
  const db = demoRead();
  if (!db.owner || !db.games) return { ok: false, error: "권한이 없어요." };
  db.games.notes = db.games.notes.filter((n) => n.id !== id);
  demoWrite(db);
  return { ok: true, data: {} };
}

/** Owner only: one screenshot. Multipart, so not through call(). */
export async function uploadShot(file: File): Promise<Result<{ id: string }>> {
  if (DEMO) return { ok: false, error: NO_STEAM_DEMO };
  try {
    const form = new FormData(); form.set("file", file);
    const r = await fetch("/api/games/shots", { method: "POST", body: form, credentials: "same-origin" });
    const data = await r.json().catch(() => ({}));
    return r.ok ? { ok: true, data: { id: data.shot.id } } : { ok: false, error: data.error || "올리지 못했어요. 다시 시도해주세요." };
  } catch {
    return { ok: false, error: "서버에 연결하지 못했어요. 인터넷 연결을 확인해주세요." };
  }
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

import { MAX_SHOTS_PER_NOTE, STATUSES, type Note, type Slot, type Status } from "./games";
import { CRITERIA, type Movie, type Scores } from "./movies";

export const clean = (s: unknown, max: number) =>
  typeof s === "string" ? s.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, max) : "";
export const isId = (s: unknown): s is string => typeof s === "string" && /^[a-zA-Z0-9-]{8,64}$/.test(s);
/** The rooms of the house you walk between (doors). Hobbies live inside them. */
export const SPACE_IDS = ["main", "cinema", "bedroom"];
export const ROOM_KEYS = ["music", "video", "book", "game", "hack", "poker", "art", "whisky", "chess", "movie", "tetris"];

/* ---------- movies ---------- */

const POSTER = /^\/[A-Za-z0-9_-]+\.(jpg|jpeg|png)$/;
const MOVIE_ID = /^[a-zA-Z0-9-]{1,64}$/;
const int = (v: unknown) => (typeof v === "number" ? v : typeof v === "string" && v.trim() ? Number(v) : NaN);

function realDate(s: unknown): s is string {
  if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

/** Checks one movie record from a request. Returns the cleaned record (without `id` unless one was given and valid) or a Korean error. */
export function parseMovie(b: Record<string, unknown>): { ok: true; movie: Omit<Movie, "id"> & { id?: string } } | { ok: false; error: string } {
  const title = clean(b.title, 100);
  if (!title) return { ok: false, error: "제목을 적어주세요." };
  const year = int(b.year);
  if (!Number.isInteger(year) || year < 1888 || year > 2100) return { ok: false, error: "연도를 확인해주세요." };
  if (!realDate(b.watchedAt)) return { ok: false, error: "본 날을 확인해주세요." };
  const scores = {} as Scores;
  const raw = (b.scores && typeof b.scores === "object" ? b.scores : {}) as Record<string, unknown>;
  for (const c of CRITERIA) {
    const v = int(raw[c.key]);
    if (!Number.isFinite(v) || v < 0 || v > c.max) return { ok: false, error: `${c.label} 점수는 0부터 ${c.max}까지예요.` };
    scores[c.key] = Math.round(v * 10) / 10;
  }
  const runtime = int(b.runtime);
  const tmdbId = int(b.tmdbId);
  const genres = Array.isArray(b.genres) ? b.genres.map((g) => clean(g, 20)).filter(Boolean).slice(0, 6) : [];
  return {
    ok: true,
    movie: {
      ...(typeof b.id === "string" && MOVIE_ID.test(b.id) && { id: b.id }),
      title,
      ...(clean(b.originalTitle, 100) && { originalTitle: clean(b.originalTitle, 100) }),
      year,
      director: clean(b.director, 60),
      genres,
      ...(Number.isInteger(runtime) && runtime >= 1 && runtime <= 999 && { runtime }),
      ...(typeof b.posterPath === "string" && POSTER.test(b.posterPath) && { posterPath: b.posterPath }),
      ...(Number.isInteger(tmdbId) && tmdbId > 0 && { tmdbId }),
      watchedAt: b.watchedAt,
      scores,
    },
  };
}

/* ---------- games ---------- */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** The owner-editable part of a slot. kind/appid/id/addedAt are set by the route. */
export function parseSlotFields(b: Record<string, unknown>): { ok: true; fields: Pick<Slot, "title" | "status" | "progress" | "progressLabel" | "lastSpot" | "manualMinutes"> } | { ok: false; error: string } {
  const title = clean(b.title, 80);
  if (!title) return { ok: false, error: "게임 이름을 적어주세요." };
  const status = (typeof b.status === "string" && b.status in STATUSES ? b.status : "playing") as Status;
  const progress = int(b.progress);
  const minutes = int(b.manualMinutes);
  return {
    ok: true,
    fields: {
      title, status, progressLabel: clean(b.progressLabel, 30), lastSpot: clean(b.lastSpot, 60),
      ...(Number.isInteger(progress) && progress >= 0 && progress <= 100 && { progress }),
      ...(Number.isFinite(minutes) && minutes >= 0 && minutes <= 10_000_000 && { manualMinutes: Math.round(minutes) }),
    },
  };
}

export function parseNote(b: Record<string, unknown>): { ok: true; note: Omit<Note, "id"> } | { ok: false; error: string } {
  if (typeof b.slotId !== "string" || !b.slotId) return { ok: false, error: "어느 게임의 메모인지 골라주세요." };
  if (!realDate(b.date)) return { ok: false, error: "날짜를 확인해주세요." };
  const text = typeof b.text === "string" ? b.text.replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, "").trim().slice(0, 500) : "";
  if (!text) return { ok: false, error: "메모를 적어주세요." };
  const hours = int(b.hours);
  const shots = Array.isArray(b.shots) ? b.shots.filter((s): s is string => typeof s === "string" && UUID.test(s)) : [];
  if (shots.length > MAX_SHOTS_PER_NOTE) return { ok: false, error: `스크린샷은 메모 하나에 ${MAX_SHOTS_PER_NOTE}장까지예요.` };
  return {
    ok: true,
    note: {
      slotId: b.slotId, date: b.date, text, shots: [...new Set(shots)],
      ...(Number.isFinite(hours) && hours > 0 && hours <= 24 && { hours: Math.round(hours * 10) / 10 }),
    },
  };
}

/** Validates an entry from the owner. Returns the cleaned fields or an error message (Korean, shown to the owner). */
export function cleanEntry(b: Record<string, unknown>):
  { ok: true; v: { room: string; at: number; title: string; tag?: string; value?: number; notes: string[] } } | { ok: false; error: string } {
  if (!ROOM_KEYS.includes(b.room as string)) return { ok: false, error: "없는 방이에요." };
  const title = clean(b.title, 40);
  if (!title) return { ok: false, error: "이름을 적어주세요." };
  const at = Number(b.at);
  if (!Number.isFinite(at) || at < Date.UTC(2000, 0, 1) || at > Date.now() + 2 * 86400_000) return { ok: false, error: "날짜를 확인해주세요." };
  let value: number | undefined;
  if (b.value !== undefined && b.value !== null && b.value !== "") {
    value = Number(b.value);
    if (!Number.isFinite(value) || Math.abs(value) > 1e6) return { ok: false, error: "숫자를 확인해주세요." };
    value = Math.round(value * 10) / 10;
  }
  const tag = clean(b.tag, 24) || undefined;
  const notes = (Array.isArray(b.notes) ? b.notes : []).slice(0, 3).map((n) => clean(n, 400));
  while (notes.length && !notes[notes.length - 1]) notes.pop();
  return { ok: true, v: { room: b.room as string, at, title, tag, value, notes } };
}

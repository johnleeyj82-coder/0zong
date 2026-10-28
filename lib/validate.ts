import { CRITERIA, type Movie, type Scores } from "./movies";

export const clean = (s: unknown, max: number) =>
  typeof s === "string" ? s.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, max) : "";
export const isId = (s: unknown): s is string => typeof s === "string" && /^[a-zA-Z0-9-]{8,64}$/.test(s);
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

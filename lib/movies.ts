// The movie room's scoring system, carried over from 0zong-cinema: six criteria that add up to 100, and stars = total / 20.
// Shared by the server (store, API) and the browser (drawer, /movie). Totals and stars are always computed, never stored.

export const CRITERIA = [
  { key: "engagement", label: "몰입감", sub: "재미", max: 25 },
  { key: "aftertaste", label: "여운", sub: "사유", max: 20 },
  { key: "story", label: "서사", sub: "메시지", max: 20 },
  { key: "character", label: "인물", sub: "연기", max: 15 },
  { key: "visual", label: "연출", sub: "시청각", max: 15 },
  { key: "personal", label: "취향", sub: "개인적", max: 5 },
] as const;

export type CriterionKey = (typeof CRITERIA)[number]["key"];
export type Scores = Record<CriterionKey, number>;

export type Movie = {
  id: string;
  title: string;
  originalTitle?: string;
  year: number;
  director: string;
  genres: string[];
  runtime?: number;
  /** TMDB poster path ("/abc.jpg"). Empty means the lettered placeholder poster is shown. */
  posterPath?: string;
  tmdbId?: number;
  /** YYYY-MM-DD */
  watchedAt: string;
  scores: Scores;
  /** Example records are labeled "예시" until the owner replaces them. */
  example?: boolean;
};

export type SortKey = "total" | "watched" | CriterionKey;
export type SortDir = "desc" | "asc";

export const total = (m: Movie) => CRITERIA.reduce((s, c) => s + (m.scores[c.key] ?? 0), 0);
export const stars = (m: Movie) => Math.round((total(m) / 20) * 10) / 10;

export const posterUrl = (path: string, size: "w92" | "w185" | "w342" = "w185") => `https://image.tmdb.org/t/p/${size}${path}`;

function value(m: Movie, key: SortKey) {
  if (key === "total") return total(m);
  if (key === "watched") return Date.parse(m.watchedAt) || 0;
  return m.scores[key] ?? 0;
}

/** Sorts a copy. Ties fall back to the most recently watched first. */
export function sortMovies(list: Movie[], key: SortKey, dir: SortDir = "desc"): Movie[] {
  const sign = dir === "desc" ? -1 : 1;
  return [...list].sort((a, b) => sign * (value(a, key) - value(b, key)) || value(b, "watched") - value(a, "watched"));
}

/** Count, average stars, and the criterion scored most generously (average as a share of its max). */
export function summarize(list: Movie[]) {
  if (!list.length) return { count: 0, avgStars: 0, best: null };
  const avgStars = Math.round((list.reduce((s, m) => s + stars(m), 0) / list.length) * 10) / 10;
  const best = CRITERIA.map((c) => ({ c, ratio: list.reduce((s, m) => s + (m.scores[c.key] ?? 0), 0) / list.length / c.max }))
    .sort((a, b) => b.ratio - a.ratio)[0];
  return { count: list.length, avgStars, best: { label: best.c.label, percent: Math.round(best.ratio * 100) } };
}

/** A movie as the editor sends it: no id for a new one. */
export type MovieInput = Omit<Movie, "id" | "example"> & { id?: string };

export const emptyScores = (): Scores => ({ engagement: 0, aftertaste: 0, story: 0, character: 0, visual: 0, personal: 0 });

/**
 * Converts 0zong-cinema's localStorage export (`localStorage['0zong-films']`, an array of ticket entries) into movie records.
 * Only scores and film facts come over; the review fields (memo, watchedPlace, overview) and the TMDB rating are dropped.
 * Ids become `cin-<original id>` so importing the same export again overwrites instead of duplicating.
 */
export function fromCinema(json: string): { movies: MovieInput[]; skipped: number } | { error: string } {
  let data: unknown;
  try { data = JSON.parse(json); } catch { return { error: "JSON 형식이 아니에요. 복사한 내용을 그대로 붙여넣어 주세요." }; }
  if (!Array.isArray(data)) return { error: "0zong-cinema 기록은 [ ... ] 로 시작하는 목록이에요." };
  const movies: MovieInput[] = [];
  let skipped = 0;
  for (const e of data as Record<string, unknown>[]) {
    if (!e || typeof e !== "object") { skipped++; continue; }
    const str = (v: unknown) => (typeof v === "string" ? v.trim() : typeof v === "number" ? String(v) : "");
    const title = str(e.title);
    const year = parseInt(str(e.year), 10);
    const date = /^\d{4}-\d{2}-\d{2}/.test(str(e.watchedDate)) ? str(e.watchedDate).slice(0, 10) : str(e.savedAt).slice(0, 10);
    if (!title || !Number.isInteger(year) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) { skipped++; continue; }
    const scores = emptyScores();
    for (const c of CRITERIA) scores[c.key] = Math.min(c.max, Math.max(0, parseFloat(str(e[c.key])) || 0));
    const runtime = parseInt(str(e.runtime), 10);
    const tmdbId = parseInt(str(e.tmdbId), 10);
    movies.push({
      id: `cin-${str(e.id).replace(/[^a-zA-Z0-9-]/g, "").slice(0, 60) || movies.length}`,
      title, year, watchedAt: date, scores,
      director: str(e.director) === "—" ? "" : str(e.director),
      genres: Array.isArray(e.genres) ? e.genres.filter((g): g is string => typeof g === "string") : [],
      ...(str(e.originalTitle) && { originalTitle: str(e.originalTitle) }),
      ...(runtime > 0 && { runtime }),
      ...(str(e.posterPath) && { posterPath: str(e.posterPath) }),
      ...(tmdbId > 0 && { tmdbId }),
    });
  }
  return { movies, skipped };
}

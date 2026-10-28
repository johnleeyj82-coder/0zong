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

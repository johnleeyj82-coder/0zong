// Server-only TMDB client. The key never reaches the browser: the owner-only /api/tmdb route calls these.
// TMDB_API_KEY takes a v3 key (sent as api_key) or a v4 read token (starts with "eyJ", sent as a Bearer header).
// TMDB_API_BASE only exists so tests can point at a local stand-in.
import "server-only";

import type { TmdbHit, TmdbMovie } from "./tmdb.types";

export class TmdbError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

const key = () => (process.env.TMDB_API_KEY || "").trim();
export const tmdbEnabled = () => !!key();

async function get<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const k = key();
  if (!k) throw new TmdbError(503, "TMDB 키가 없어서 검색은 꺼져 있어요. 직접 입력할 수 있어요.");
  const url = new URL((process.env.TMDB_API_BASE || "https://api.themoviedb.org/3") + path);
  for (const [n, v] of Object.entries({ ...params, language: "ko-KR" })) url.searchParams.set(n, v);
  const headers: Record<string, string> = { accept: "application/json" };
  if (k.startsWith("eyJ")) headers.Authorization = `Bearer ${k}`; else url.searchParams.set("api_key", k);
  let r: Response;
  try {
    r = await fetch(url, { headers, cache: "no-store", signal: AbortSignal.timeout(8000) });
  } catch {
    throw new TmdbError(502, "TMDB에 연결하지 못했어요. 잠시 후 다시 시도해주세요.");
  }
  if (r.status === 401) throw new TmdbError(502, "TMDB 키가 맞지 않아요. .env.local의 TMDB_API_KEY를 확인해주세요.");
  if (r.status === 404) throw new TmdbError(404, "TMDB에서 그 영화를 찾지 못했어요.");
  if (!r.ok) throw new TmdbError(502, "TMDB에 연결하지 못했어요. 잠시 후 다시 시도해주세요.");
  return r.json() as Promise<T>;
}

type Raw = { id: number; title?: string; original_title?: string; release_date?: string; poster_path?: string | null };
const year = (d?: string) => (d && /^\d{4}/.test(d) ? Number(d.slice(0, 4)) : undefined);
const hit = (m: Raw): TmdbHit => ({
  tmdbId: m.id, title: m.title || m.original_title || "",
  ...(m.original_title && m.original_title !== m.title && { originalTitle: m.original_title }),
  ...(year(m.release_date) && { year: year(m.release_date) }),
  ...(m.poster_path && { posterPath: m.poster_path }),
});

export async function searchTmdb(query: string): Promise<TmdbHit[]> {
  const d = await get<{ results?: Raw[] }>("/search/movie", { query, include_adult: "false", page: "1" });
  return (d.results ?? []).slice(0, 8).map(hit).filter((h) => h.title);
}

export async function tmdbMovie(id: number): Promise<TmdbMovie> {
  const d = await get<Raw & { runtime?: number; genres?: { name: string }[]; credits?: { crew?: { job: string; name: string }[] } }>(
    `/movie/${id}`, { append_to_response: "credits" });
  const directors = (d.credits?.crew ?? []).filter((c) => c.job === "Director").map((c) => c.name);
  return {
    ...hit(d),
    director: directors.length > 2 ? `${directors[0]} 외` : directors.join(", "),
    genres: (d.genres ?? []).map((g) => g.name).slice(0, 6),
    ...(d.runtime && { runtime: d.runtime }),
  };
}

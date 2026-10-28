export type TmdbHit = { tmdbId: number; title: string; originalTitle?: string; year?: number; posterPath?: string };
export type TmdbMovie = TmdbHit & { director: string; genres: string[]; runtime?: number };

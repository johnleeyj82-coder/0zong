import { posterUrl, type Movie } from "@/lib/movies";

/** TMDB poster when the record has one, otherwise a lettered placeholder (never an invented image). */
export function Poster({ movie, size = "w185" }: { movie: Movie; size?: "w92" | "w185" }) {
  if (movie.posterPath) {
    return <img className="poster" src={posterUrl(movie.posterPath, size)} alt="" loading="lazy" decoding="async" />;
  }
  return (
    <span className="poster poster-ph" aria-hidden>
      <b>{movie.title}</b>
      <small>{movie.year}</small>
    </span>
  );
}

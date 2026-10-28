import { CRITERIA, total, type CriterionKey, type Movie } from "@/lib/movies";

/** The score anatomy: one bar where 100% width is 100 points, split into the six criteria. No background track, only an end tick at 100. */
export function ScoreBar({ movie, focus, compact }: { movie: Movie; focus?: CriterionKey | null; compact?: boolean }) {
  const label = `총점 ${total(movie)}점. ` + CRITERIA.map((c) => `${c.label} ${movie.scores[c.key]}/${c.max}`).join(", ");
  return (
    <div className={compact ? "sbar compact" : "sbar"} role="img" aria-label={label} data-focus={focus ? "" : undefined}>
      {CRITERIA.map((c, i) => (
        <span key={c.key} className={`seg s${i + 1}`} data-on={focus === c.key ? "" : undefined}
          style={{ width: `${movie.scores[c.key]}%` }} />
      ))}
      <i className="sbar-end" aria-hidden />
    </div>
  );
}

/** One swatch per criterion, in bar order, for the legend. */
export function Swatch({ i }: { i: number }) {
  return <span className={`seg s${i + 1} swatch`} aria-hidden />;
}

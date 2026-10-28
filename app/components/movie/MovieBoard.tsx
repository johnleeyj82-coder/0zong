"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowDown, ArrowLeft, ArrowUp } from "lucide-react";
import { getMovies } from "@/lib/client";
import { CRITERIA, sortMovies, stars, summarize, total, type Movie, type SortDir, type SortKey } from "@/lib/movies";
import { Poster } from "./Poster";
import { ScoreBar, Swatch } from "./ScoreBar";

const EASE = [0.16, 1, 0.3, 1] as const;
const SORTS: { key: SortKey; label: string }[] = [
  { key: "total", label: "총점" },
  { key: "watched", label: "본 날" },
  ...CRITERIA.map((c) => ({ key: c.key as SortKey, label: c.label })),
];

const watched = (d: string) => d.slice(2).replace(/-/g, ".");

/** /movie: every rated film as a score anatomy row, sortable by total, watch date, or any one criterion. */
export default function MovieBoard() {
  const reduce = useReducedMotion();
  const [movies, setMovies] = useState<Movie[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: "total", dir: "desc" });
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    void getMovies().then((r) => (r.ok ? setMovies(r.data) : setError(r.error)));
  }, []);

  const sorted = useMemo(() => (movies ? sortMovies(movies, sort.key, sort.dir) : []), [movies, sort]);
  const sum = useMemo(() => summarize(movies ?? []), [movies]);
  const focus = sort.key === "total" || sort.key === "watched" ? null : sort.key;
  const pick = (key: SortKey) => setSort((s) => ({ key, dir: s.key === key && s.dir === "desc" ? "asc" : "desc" }));

  return (
    <main className="film">
      <Link href="/" className="film-back"><ArrowLeft size={15} aria-hidden /> 방으로 돌아가기</Link>

      <header className="film-head">
        <span className="label">Film log</span>
        <h1 className="display">내가 매긴 점수들</h1>
        <p>몰입감, 여운, 서사, 인물, 연출, 취향. 여섯 가지를 더하면 100점이고, 20으로 나누면 별점이에요.</p>
      </header>

      {movies && movies.length > 0 && (
        <dl className="film-stats">
          <div><dt>본 영화</dt><dd>{sum.count}<small>편</small></dd></div>
          <div><dt>평균 별점</dt><dd>{sum.avgStars.toFixed(1)}<small>/ 5</small></dd></div>
          {sum.best && <div><dt>가장 후하게 준 항목</dt><dd>{sum.best.label}<small>{sum.best.percent}%</small></dd></div>}
        </dl>
      )}

      <div className="film-tools">
        <ul className="film-legend" aria-label="막대 색이 뜻하는 항목">
          {CRITERIA.map((c, i) => <li key={c.key} data-on={focus === c.key ? "" : undefined}><Swatch i={i} />{c.label}<span>{c.max}</span></li>)}
        </ul>
        <div className="film-sort" role="group" aria-label="정렬">
          {SORTS.map((s) => {
            const on = sort.key === s.key;
            return (
              <button key={s.key} aria-pressed={on} onClick={() => pick(s.key)}>
                {s.label}
                {on && (sort.dir === "desc" ? <ArrowDown size={12} aria-label="높은 순" /> : <ArrowUp size={12} aria-label="낮은 순" />)}
              </button>
            );
          })}
        </div>
      </div>

      {error && <p className="form-error" role="alert">{error}</p>}
      {!movies && !error && (
        <ol className="film-list" aria-hidden>
          {Array.from({ length: 4 }, (_, i) => <li key={i} className="film-row skeleton"><span /><span /><span /></li>)}
        </ol>
      )}
      {movies && movies.length === 0 && (
        <p className="hint film-empty">아직 점수를 매긴 영화가 없어요. 첫 영화를 기록하면 여기에 줄이 생겨요.</p>
      )}

      {movies && movies.length > 0 && (
        <ol className="film-list">
          {sorted.map((m, i) => {
            const expanded = open === m.id;
            return (
              <motion.li key={m.id} layout={reduce ? false : "position"} transition={{ duration: 0.55, ease: EASE }}
                className="film-row" data-open={expanded ? "" : undefined}>
                <button className="film-hit" aria-expanded={expanded} aria-controls={`film-${m.id}`} onClick={() => setOpen(expanded ? null : m.id)}>
                  <span className="rank">{String(i + 1).padStart(2, "0")}</span>
                  <Poster movie={m} size="w92" />
                  <span className="who">
                    <b><span className="tt">{m.title}</span>{m.example && <em className="ex-tag">예시</em>}</b>
                    <small>{m.year}, {m.director}</small>
                  </span>
                  <ScoreBar movie={m} focus={focus} />
                  <span className="score">
                    <b>{stars(m).toFixed(1)}</b>
                    <small>{focus ? `${m.scores[focus]}/${CRITERIA.find((c) => c.key === focus)!.max}` : `${total(m)}점`}</small>
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {expanded && (
                    <motion.div id={`film-${m.id}`} className="film-detail"
                      initial={reduce ? false : { height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                      exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }} transition={{ duration: reduce ? 0 : 0.45, ease: EASE }}>
                      <div className="film-detail-in">
                        <ul className="crit">
                          {CRITERIA.map((c, ci) => (
                            <li key={c.key} data-on={focus === c.key ? "" : undefined}>
                              <span className="crit-name">{c.label}<small>{c.sub}</small></span>
                              <span className="crit-bar" style={{ width: `${c.max * 4}%` }}>
                                <span className={`seg s${ci + 1}`} style={{ width: `${(m.scores[c.key] / c.max) * 100}%` }} />
                              </span>
                              <span className="crit-n">{m.scores[c.key]}<small>/{c.max}</small></span>
                            </li>
                          ))}
                        </ul>
                        <p className="film-meta">
                          {m.originalTitle && <span>{m.originalTitle}</span>}
                          <span>{m.genres.join(", ")}{m.runtime ? `, ${m.runtime}분` : ""}</span>
                          <span>본 날 {watched(m.watchedAt)}</span>
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.li>
            );
          })}
        </ol>
      )}
    </main>
  );
}

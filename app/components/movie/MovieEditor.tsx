"use client";
import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { saveMovie, searchTmdb, tmdbDetails } from "@/lib/client";
import { CRITERIA, emptyScores, posterUrl, stars, total, type Movie, type Scores } from "@/lib/movies";
import type { TmdbHit, TmdbMovie } from "@/lib/tmdb.types";
import { ScoreBar } from "./ScoreBar";

type Form = {
  title: string; originalTitle: string; year: string; director: string; genres: string; runtime: string;
  watchedAt: string; posterPath?: string; tmdbId?: number; scores: Scores;
};

const today = () => new Date().toISOString().slice(0, 10);
const toForm = (m?: Movie): Form => m
  ? { title: m.title, originalTitle: m.originalTitle ?? "", year: String(m.year), director: m.director, genres: m.genres.join(", "),
      runtime: m.runtime ? String(m.runtime) : "", watchedAt: m.watchedAt, posterPath: m.posterPath, tmdbId: m.tmdbId, scores: { ...m.scores } }
  : { title: "", originalTitle: "", year: "", director: "", genres: "", runtime: "", watchedAt: today(), scores: emptyScores() };

/** Owner editor: TMDB search fills the film facts, the six sliders set the score. `movie` undefined means a new record. */
export function MovieEditor({ movie, onSaved, onCancel }: { movie?: Movie; onSaved: () => void; onCancel: () => void }) {
  const [form, setForm] = useState<Form>(() => toForm(movie));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  const fill = (d: TmdbMovie) =>
    setForm((f) => ({
      ...f, title: d.title, originalTitle: d.originalTitle ?? "", year: d.year ? String(d.year) : f.year, director: d.director,
      genres: d.genres.join(", "), runtime: d.runtime ? String(d.runtime) : "", posterPath: d.posterPath, tmdbId: d.tmdbId,
    }));

  const preview: Movie = { id: "preview", title: form.title, year: 0, director: "", genres: [], watchedAt: form.watchedAt, scores: form.scores };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (!form.title.trim()) { setError("제목을 적어주세요."); return; }
    if (!/^\d{4}$/.test(form.year.trim())) { setError("연도를 네 자리 숫자로 적어주세요."); return; }
    setBusy(true); setError(null);
    const r = await saveMovie({
      ...(movie && { id: movie.id }),
      title: form.title.trim(), year: Number(form.year), director: form.director.trim(), watchedAt: form.watchedAt, scores: form.scores,
      genres: form.genres.split(",").map((g) => g.trim()).filter(Boolean),
      ...(form.originalTitle.trim() && { originalTitle: form.originalTitle.trim() }),
      ...(Number(form.runtime) > 0 && { runtime: Number(form.runtime) }),
      ...(form.posterPath && { posterPath: form.posterPath }),
      ...(form.tmdbId && { tmdbId: form.tmdbId }),
    });
    setBusy(false);
    if (!r.ok) { setError(r.error); return; }
    onSaved();
  };

  return (
    <form className="edit movie-edit" onSubmit={submit}>
      <TmdbSearch onPick={fill} />

      <div className="me-film">
        {form.posterPath
          ? <span className="me-poster">
              <img className="poster" src={posterUrl(form.posterPath, "w92")} alt="" />
              <button type="button" className="icon-btn" onClick={() => setForm((f) => ({ ...f, posterPath: undefined }))} aria-label="포스터 빼기"><X size={14} /></button>
            </span>
          : <span className="poster poster-ph me-ph" aria-hidden><b>{form.title || "포스터"}</b><small>{form.year}</small></span>}
        <div className="me-grid">
          <label className="field wide"><span>제목</span><input id="me-title" value={form.title} maxLength={100} onChange={(e) => set("title", e.target.value)} /></label>
          <label className="field wide"><span>원제</span><input id="me-original" value={form.originalTitle} maxLength={100} onChange={(e) => set("originalTitle", e.target.value)} /></label>
          <label className="field"><span>연도</span><input id="me-year" value={form.year} inputMode="numeric" maxLength={4} onChange={(e) => set("year", e.target.value.replace(/\D/g, ""))} /></label>
          <label className="field"><span>상영 시간 (분)</span><input id="me-runtime" value={form.runtime} inputMode="numeric" maxLength={3} onChange={(e) => set("runtime", e.target.value.replace(/\D/g, ""))} /></label>
          <label className="field wide"><span>감독</span><input id="me-director" value={form.director} maxLength={60} onChange={(e) => set("director", e.target.value)} /></label>
          <label className="field wide"><span>장르 (쉼표로 나눠요)</span><input id="me-genres" value={form.genres} maxLength={130} onChange={(e) => set("genres", e.target.value)} /></label>
          <label className="field"><span>본 날</span><input id="me-watched" type="date" value={form.watchedAt} max={today()} onChange={(e) => set("watchedAt", e.target.value)} /></label>
        </div>
      </div>

      <fieldset className="me-scores">
        <legend>점수</legend>
        <div className="me-total">
          <ScoreBar movie={preview} />
          <span><b>{stars(preview).toFixed(1)}</b><small>{total(preview)}점</small></span>
        </div>
        {CRITERIA.map((c, i) => (
          <label key={c.key} className="me-range">
            <span className="crit-name"><i className={`seg s${i + 1} swatch`} aria-hidden />{c.label}<small>{c.sub}</small></span>
            <input type="range" min={0} max={c.max} step={1} value={form.scores[c.key]} aria-valuetext={`${form.scores[c.key]}점, 만점 ${c.max}점`}
              onChange={(e) => setForm((f) => ({ ...f, scores: { ...f.scores, [c.key]: Number(e.target.value) } }))} />
            <output className="crit-n">{form.scores[c.key]}<small>/{c.max}</small></output>
          </label>
        ))}
      </fieldset>

      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="gate-actions">
        <button className="btn" disabled={busy}>{movie ? "고친 내용 저장" : "기록하기"}</button>
        <button type="button" className="btn-ghost" onClick={onCancel}>취소</button>
      </div>
    </form>
  );
}

/** Searches TMDB through the owner-only API once typing pauses; earlier requests are cancelled. */
function TmdbSearch({ onPick }: { onPick: (d: TmdbMovie) => void }) {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<TmdbHit[] | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const ctl = useRef<AbortController | null>(null);

  useEffect(() => {
    ctl.current?.abort();
    if (!q.trim()) { setHits(null); setMsg(null); setLoading(false); return; }
    const c = new AbortController(); ctl.current = c;
    setLoading(true);
    const t = setTimeout(async () => {
      const r = await searchTmdb(q.trim(), c.signal);
      if (c.signal.aborted) return;
      setLoading(false);
      if (r.ok) { setHits(r.data); setMsg(r.data.length ? null : "검색 결과가 없어요. 원제로 찾아보거나 직접 입력해주세요."); }
      else { setHits(null); setMsg(r.error); }
    }, 350);
    return () => { clearTimeout(t); c.abort(); };
  }, [q]);

  const pick = async (h: TmdbHit) => {
    setHits(null); setLoading(true); setMsg(null);
    const r = await tmdbDetails(h.tmdbId);
    setLoading(false);
    if (!r.ok) { setMsg(r.error); return; }
    onPick(r.data); setQ("");
  };

  return (
    <div className="tmdb">
      <label className="field"><span><Search size={13} aria-hidden /> TMDB에서 찾기</span>
        <input id="me-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="영화 제목으로 검색해요" autoComplete="off" />
      </label>
      {loading && <p className="hint">찾는 중…</p>}
      {msg && <p className="hint" role="status">{msg}</p>}
      {hits && hits.length > 0 && (
        <ul className="tmdb-hits">
          {hits.map((h) => (
            <li key={h.tmdbId}>
              <button type="button" onClick={() => pick(h)}>
                {h.posterPath ? <img className="poster" src={posterUrl(h.posterPath, "w92")} alt="" loading="lazy" /> : <span className="poster poster-ph" aria-hidden />}
                <span><b>{h.title}</b><small>{[h.year, h.originalTitle].filter(Boolean).join(", ")}</small></span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

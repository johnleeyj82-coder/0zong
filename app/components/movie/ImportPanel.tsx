"use client";
import { useMemo, useState } from "react";
import { importMovies } from "@/lib/client";
import { fromCinema } from "@/lib/movies";

/** Owner import: paste 0zong-cinema's localStorage export, preview what will come over, then save. */
export function ImportPanel({ onDone, onCancel }: { onDone: (msg: string) => void; onCancel: () => void }) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const parsed = useMemo(() => (text.trim() ? fromCinema(text) : null), [text]);

  const run = async () => {
    if (!parsed || "error" in parsed || !parsed.movies.length || busy) return;
    setBusy(true); setError(null);
    const r = await importMovies(parsed.movies);
    setBusy(false);
    if (!r.ok) { setError(r.error); return; }
    const skipped = r.data.skipped + parsed.skipped;
    onDone(`${r.data.added}편을 새로 가져왔어요.` + (r.data.updated ? ` ${r.data.updated}편은 이미 있어서 새 내용으로 바꿨어요.` : "")
      + (skipped ? ` ${skipped}편은 형식이 맞지 않아 건너뛰었어요.` : ""));
  };

  return (
    <div className="edit">
      <ol className="import-steps">
        <li>0zong-cinema를 쓰던 브라우저에서 그 사이트를 열어요.</li>
        <li>F12를 눌러 콘솔을 열고 <code>copy(localStorage.getItem(&apos;0zong-films&apos;))</code>를 입력해요.</li>
        <li>복사된 내용을 아래에 붙여넣어요. 점수와 영화 정보만 가져오고, 감상 메모는 가져오지 않아요.</li>
      </ol>
      <label className="field"><span>0zong-cinema 기록</span>
        <textarea id="import-text" rows={6} value={text} spellCheck={false} placeholder='[{"title":"...","engagement":"21",...}]'
          onChange={(e) => { setText(e.target.value); setError(null); }} />
      </label>
      {parsed && "error" in parsed && <p className="form-error" role="alert">{parsed.error}</p>}
      {parsed && !("error" in parsed) && (
        <div className="import-preview" role="status">
          <p><b>{parsed.movies.length}편</b>을 가져올 수 있어요.{parsed.skipped ? ` ${parsed.skipped}편은 제목, 연도, 날짜가 없어 건너뛰어요.` : ""}</p>
          {parsed.movies.length > 0 && <p className="hint">{parsed.movies.slice(0, 5).map((m) => m.title).join(", ")}{parsed.movies.length > 5 ? " 외" : ""}</p>}
        </div>
      )}
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="gate-actions">
        <button className="btn" onClick={run} disabled={busy || !parsed || "error" in parsed || !parsed.movies.length}>가져오기</button>
        <button className="btn-ghost" onClick={onCancel}>취소</button>
      </div>
    </div>
  );
}

"use client";
// Owner-only: add, edit and delete the records of one room. Visitors never see this.
import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import type { Entry } from "@/lib/types";
import { md, toDateInput } from "@/lib/time";
import type { RoomKey } from "../data";
import { useRoom } from "../components/RoomContext";
import { SCHEMA } from "./schema";

type Draft = { id?: string; date: string; title: string; tag: string; value: string; notes: string[]; at?: number };

const blank = (k: RoomKey): Draft => {
  const s = SCHEMA[k];
  return { date: toDateInput(Date.now()), title: "", tag: s.tag?.fixed ? s.tag.options![0] : "", value: s.value?.default !== undefined ? String(s.value.default) : "", notes: s.notes.map(() => "") };
};
const fromEntry = (k: RoomKey, e: Entry): Draft => ({
  id: e.id, at: e.at, date: toDateInput(e.at), title: e.title, tag: e.tag ?? "", value: e.value !== undefined ? String(e.value) : "",
  notes: SCHEMA[k].notes.map((_, i) => e.notes[i] ?? ""),
});

/** Keeps the original time when the day is unchanged; today means "now"; another day means noon of that day. */
function toAt(d: Draft): number {
  if (d.at !== undefined && toDateInput(d.at) === d.date) return d.at;
  if (d.date === toDateInput(Date.now())) return Date.now();
  const [y, m, day] = d.date.split("-").map(Number);
  return new Date(y, m - 1, day, 12).getTime();
}

export default function EntryEditor({ k, entries }: { k: RoomKey; entries: Entry[] }) {
  const { putEntry, deleteEntry, clearExamples } = useRoom();
  const s = SCHEMA[k];
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [all, setAll] = useState(false);
  const examples = entries.filter((e) => e.example).length;
  // Suggestions for free-text tags: the schema's options plus tags already used in this room.
  const tagOptions = [...new Set([...(s.tag?.options ?? []), ...entries.map((e) => e.tag).filter((t): t is string => !!t)])];

  const run = async (fn: () => Promise<string | null>) => {
    setBusy(true); setError(null);
    const err = await fn();
    setBusy(false);
    if (err) setError(err);
    return !err;
  };

  const save = async () => {
    if (!draft) return;
    if (!draft.title.trim()) { setError(`${s.title.label}을(를) 적어주세요.`); return; }
    if (!draft.date) { setError("날짜를 골라주세요."); return; }
    let value: number | undefined;
    const wish = k === "movie" && draft.tag === "보고 싶어요";
    if (s.value && !wish && draft.value.trim() !== "") {
      value = Number(draft.value);
      if (!Number.isFinite(value) || value < s.value.min || value > s.value.max) { setError(`${s.value.label}은(는) ${s.value.min}~${s.value.max} 사이로 적어주세요.`); return; }
    }
    const ok = await run(() => putEntry({
      id: draft.id, room: k, at: toAt(draft), title: draft.title.trim(), tag: draft.tag.trim() || undefined, value,
      notes: draft.notes.map((n) => n.trim()),
    }));
    if (ok) setDraft(null);
  };

  if (draft) {
    const set = (p: Partial<Draft>) => setDraft({ ...draft, ...p });
    return (
      <form className="edit entry-form" noValidate onSubmit={(e) => { e.preventDefault(); void save(); }}>
        <span className="label">{draft.id ? "기록 고치기" : s.add}</span>
        <div className="row2">
          <label className="field"><span>{s.title.label}</span><input autoFocus value={draft.title} maxLength={40} placeholder={s.title.placeholder} onChange={(e) => set({ title: e.target.value })} /></label>
          <label className="field"><span>날짜</span><input type="date" value={draft.date} max={toDateInput(Date.now())} onChange={(e) => set({ date: e.target.value })} /></label>
        </div>
        {(s.tag || s.value) && (
          <div className="row2">
            {s.tag && (
              <label className="field"><span>{s.tag.label}</span>
                {s.tag.fixed
                  ? <select value={draft.tag} onChange={(e) => set({ tag: e.target.value })}>{s.tag.options!.map((o) => <option key={o}>{o}</option>)}</select>
                  : <><input value={draft.tag} maxLength={24} placeholder={s.tag.placeholder} list={`tags-${k}`} onChange={(e) => set({ tag: e.target.value })} />
                      <datalist id={`tags-${k}`}>{tagOptions.map((o) => <option key={o} value={o} />)}</datalist></>}
              </label>
            )}
            {s.value && !(k === "movie" && draft.tag === "보고 싶어요") && (
              <label className="field"><span>{s.value.label}{s.value.unit && ` (${s.value.unit})`}</span>
                <input type="number" inputMode="decimal" value={draft.value} min={s.value.min} max={s.value.max} step={s.value.step} onChange={(e) => set({ value: e.target.value })} />
              </label>
            )}
          </div>
        )}
        {s.notes.map((f, i) => (
          <label key={f.label} className="field"><span>{f.label}</span>
            <textarea rows={2} maxLength={400} value={draft.notes[i]} placeholder={f.placeholder}
              onChange={(e) => set({ notes: draft.notes.map((n, j) => (j === i ? e.target.value : n)) })} />
          </label>
        ))}
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="gate-actions">
          <button className="btn" type="submit" disabled={busy}>{busy ? "저장하는 중…" : "저장"}</button>
          <button className="btn-ghost" type="button" onClick={() => { setDraft(null); setError(null); }}>취소</button>
        </div>
      </form>
    );
  }

  const list = all ? entries : entries.slice(0, 8);
  return (
    <section className="owner-panel" aria-label="기록 관리">
      <div className="owner-head">
        <span className="label">내 기록 · {entries.length}개</span>
        <button className="btn-ghost" onClick={() => { setDraft(blank(k)); setError(null); }}><Plus size={14} aria-hidden /> {s.add}</button>
      </div>
      {examples > 0 && (
        <p className="hint">예시 기록이 {examples}개 있어요. 하나씩 고치면 진짜 기록이 되고, 한 번에 지울 수도 있어요.{" "}
          <button className="link" disabled={busy} onClick={() => void run(() => clearExamples(k))}>예시 모두 지우기</button>
        </p>
      )}
      {entries.length === 0 && <p className="hint">아직 기록이 없어요. 위의 「{s.add}」로 첫 기록을 남겨보세요.</p>}
      <ul className="owner-list">
        {list.map((e) => (
          <li key={e.id}>
            <span className="when">{md(e.at)}</span>
            <span className="what">{s.line(e)}{e.example && <em>예시</em>}</span>
            {confirmId === e.id ? (
              <span className="confirm">
                <button className="link danger" onClick={() => void run(() => deleteEntry(e.id)).then(() => setConfirmId(null))}>지우기</button>
                <button className="link" onClick={() => setConfirmId(null)}>취소</button>
              </span>
            ) : (
              <span className="acts">
                <button className="icon-btn" aria-label={`${e.title} 고치기`} onClick={() => { setDraft(fromEntry(k, e)); setError(null); }}><Pencil size={14} /></button>
                <button className="icon-btn" aria-label={`${e.title} 지우기`} onClick={() => setConfirmId(e.id)}><Trash2 size={14} /></button>
              </span>
            )}
          </li>
        ))}
      </ul>
      {entries.length > 8 && <button className="link" onClick={() => setAll(!all)}>{all ? "접기" : `${entries.length - 8}개 더 보기`}</button>}
      {error && <p className="form-error" role="alert">{error}</p>}
    </section>
  );
}

"use client";
import { useEffect, useRef, useState } from "react";
import { ImagePlus, Search, X } from "lucide-react";
import { DEMO, getLibrary, saveNote, saveSlot, shotUrl, uploadShot } from "@/lib/client";
import { MAX_SHOT_BYTES, MAX_SHOTS_PER_NOTE, playtime, STATUSES, steamCover, type GameView, type Note, type Status, type SteamGame } from "@/lib/games";

const today = () => new Date().toISOString().slice(0, 10);

/** Owned Steam games, recently played first; picking one pins it as a slot. */
export function PinPicker({ onDone }: { onDone: (msg: string) => void }) {
  const [q, setQ] = useState("");
  const [games, setGames] = useState<(SteamGame & { pinned: boolean })[] | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let live = true;
    const t = setTimeout(async () => {
      const r = await getLibrary(q.trim());
      if (!live) return;
      if (!r.ok) { setGames([]); setMsg(r.error); return; }
      setGames(r.data.games);
      setMsg(r.data.error ?? (!r.data.syncedAt ? "아직 Steam을 가져오지 않았어요. 'Steam에서 가져오기'를 먼저 눌러주세요." : null));
    }, 250);
    return () => { live = false; clearTimeout(t); };
  }, [q]);

  const pin = async (g: SteamGame) => {
    if (busy) return;
    setBusy(true);
    const r = await saveSlot({ appid: g.appid, title: g.name, status: "playing" });
    setBusy(false);
    if (!r.ok) { setMsg(r.error); return; }
    onDone(`「${g.name}」을 슬롯에 걸었어요. '슬롯 고치기'에서 진행 상황을 적어주세요.`);
  };

  return (
    <div className="edit">
      <label className="field"><span><Search size={13} aria-hidden /> 가진 게임에서 찾기</span>
        <input id="pin-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="게임 이름" autoComplete="off" />
      </label>
      {msg && <p className="hint" role="status">{msg}</p>}
      {games && games.length > 0 && (
        <ul className="tmdb-hits pin-hits">
          {games.map((g) => (
            <li key={g.appid}>
              <button type="button" onClick={() => pin(g)} disabled={g.pinned || busy}>
                <img className="poster" src={steamCover(g.appid, "header")} alt="" loading="lazy" />
                <span>
                  <b>{g.name}</b>
                  <small>{playtime(g.minutes)}{g.recentMinutes ? `, 최근 2주 ${playtime(g.recentMinutes)}` : ""}{g.pinned ? ", 이미 걸림" : ""}</small>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {games && !games.length && !msg && <p className="hint">찾는 게임이 없어요. Steam 밖 게임이면 '직접 추가'를 써주세요.</p>}
    </div>
  );
}

/** Adds a game by hand (no slot) or edits a slot's status, progress, last spot, and (hand-added only) play time. */
export function SlotEditor({ slot, onDone, onCancel }: { slot?: GameView; onDone: (msg: string) => void; onCancel: () => void }) {
  const manual = !slot || slot.kind === "manual";
  const [f, setF] = useState({
    title: slot?.title ?? "", status: (slot?.status ?? "playing") as Status, hasProgress: slot?.progress !== undefined,
    progress: slot?.progress ?? 0, progressLabel: slot?.progressLabel ?? "", lastSpot: slot?.lastSpot ?? "",
    h: slot?.manualMinutes ? String(Math.floor(slot.manualMinutes / 60)) : "", m: slot?.manualMinutes ? String(slot.manualMinutes % 60) : "",
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (p: Partial<typeof f>) => setF((cur) => ({ ...cur, ...p }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (!f.title.trim()) { setError("게임 이름을 적어주세요."); return; }
    setBusy(true); setError(null);
    const minutes = (Number(f.h) || 0) * 60 + (Number(f.m) || 0);
    const r = await saveSlot({
      ...(slot && { id: slot.id }), title: f.title.trim(), status: f.status, progressLabel: f.progressLabel, lastSpot: f.lastSpot,
      ...(f.hasProgress && { progress: f.progress }), ...(manual && { manualMinutes: minutes }),
    });
    setBusy(false);
    if (!r.ok) { setError(r.error); return; }
    onDone(slot ? "슬롯을 고쳤어요." : `「${r.data.title}」을 슬롯에 추가했어요.`);
  };

  return (
    <form className="edit" onSubmit={submit}>
      <label className="field"><span>게임 이름</span><input id="slot-title" value={f.title} maxLength={80} onChange={(e) => set({ title: e.target.value })} /></label>
      <fieldset className="chips-field">
        <legend>진행 상태</legend>
        <div className="chips-row">
          {(Object.keys(STATUSES) as Status[]).map((k) => (
            <button type="button" key={k} className="chip-btn" aria-pressed={f.status === k} onClick={() => set({ status: k })}>{STATUSES[k]}</button>
          ))}
        </div>
      </fieldset>
      <label className="pitch"><input type="checkbox" checked={f.hasProgress} onChange={(e) => set({ hasProgress: e.target.checked })} /> 진행률을 숫자로 보여주기</label>
      {f.hasProgress && (
        <label className="ctl" htmlFor="slot-progress"><span>진행률<output htmlFor="slot-progress">{f.progress}%</output></span>
          <input id="slot-progress" type="range" min={0} max={100} step={5} value={f.progress} onChange={(e) => set({ progress: Number(e.target.value) })} />
        </label>
      )}
      <label className="field"><span>진행 한 줄 (예: 엔딩 전, 2막, 112%)</span><input id="slot-label" value={f.progressLabel} maxLength={30} onChange={(e) => set({ progressLabel: e.target.value })} /></label>
      <label className="field"><span>마지막으로 저장한 곳</span><input id="slot-spot" value={f.lastSpot} maxLength={60} placeholder="예: 말레니아 앞 축복" onChange={(e) => set({ lastSpot: e.target.value })} /></label>
      {manual ? (
        <div className="me-grid">
          <label className="field"><span>플레이 시간 (시간)</span><input id="slot-h" inputMode="numeric" value={f.h} maxLength={5} onChange={(e) => set({ h: e.target.value.replace(/\D/g, "") })} /></label>
          <label className="field"><span>(분)</span><input id="slot-m" inputMode="numeric" value={f.m} maxLength={2} onChange={(e) => set({ m: e.target.value.replace(/\D/g, "") })} /></label>
        </div>
      ) : <p className="hint">플레이 시간은 Steam에서 가져와요.</p>}
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="gate-actions">
        <button className="btn" disabled={busy}>{slot ? "고친 내용 저장" : "슬롯에 추가"}</button>
        <button type="button" className="btn-ghost" onClick={onCancel}>취소</button>
      </div>
    </form>
  );
}

/** A dated play note: hours that day, what happened, up to four screenshots (uploaded as they are picked). */
export function NoteEditor({ slot, note, onDone, onCancel }: { slot: GameView; note?: Note; onDone: (msg: string) => void; onCancel: () => void }) {
  const [f, setF] = useState({ date: note?.date ?? today(), hours: note?.hours ? String(note.hours) : "", text: note?.text ?? "" });
  const [shots, setShots] = useState<string[]>(note?.shots ?? []);
  const [uploading, setUploading] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const add = async (files: FileList | null) => {
    if (!files) return;
    setError(null);
    const room = MAX_SHOTS_PER_NOTE - shots.length;
    const list = Array.from(files).slice(0, room);
    if (files.length > room) setError(`스크린샷은 메모 하나에 ${MAX_SHOTS_PER_NOTE}장까지예요.`);
    for (const file of list) {
      if (file.size > MAX_SHOT_BYTES) { setError("스크린샷은 한 장에 5MB까지 올릴 수 있어요."); continue; }
      setUploading((n) => n + 1);
      const r = await uploadShot(file);
      setUploading((n) => n - 1);
      if (r.ok) setShots((cur) => [...cur, r.data.id]); else setError(r.error);
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || uploading) return;
    if (!f.text.trim()) { setError("메모를 적어주세요."); return; }
    setBusy(true); setError(null);
    const hours = Number(f.hours);
    const r = await saveNote({ ...(note && { id: note.id }), slotId: slot.id, date: f.date, text: f.text, shots, ...(hours > 0 && { hours }) });
    setBusy(false);
    if (!r.ok) { setError(r.error); return; }
    onDone(note ? "메모를 고쳤어요." : "메모를 남겼어요.");
  };

  return (
    <form className="edit" onSubmit={submit}>
      <div className="me-grid">
        <label className="field"><span>날짜</span><input id="note-date" type="date" value={f.date} max={today()} onChange={(e) => setF({ ...f, date: e.target.value })} /></label>
        <label className="field"><span>그날 한 시간 (선택)</span>
          <input id="note-hours" inputMode="decimal" value={f.hours} maxLength={4} placeholder="예: 2.5" onChange={(e) => setF({ ...f, hours: e.target.value.replace(/[^\d.]/g, "") })} />
        </label>
      </div>
      <label className="field"><span>본 것, 깬 것, 공략 메모</span>
        <textarea id="note-text" rows={5} maxLength={500} value={f.text} onChange={(e) => setF({ ...f, text: e.target.value })} />
      </label>
      <span className="hint">{f.text.length} / 500</span>
      <div className="shot-edit">
        {shots.map((id) => (
          <span key={id} className="shot-thumb">
            <img src={shotUrl(id)} alt="" />
            <button type="button" className="icon-btn" onClick={() => setShots((cur) => cur.filter((x) => x !== id))} aria-label="스크린샷 빼기"><X size={12} /></button>
          </span>
        ))}
        {shots.length < MAX_SHOTS_PER_NOTE && !DEMO && (
          <label className="shot-add">
            <ImagePlus size={18} aria-hidden /><span>{uploading ? "올리는 중…" : "스크린샷"}</span>
            <input ref={fileRef} id="note-shots" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(e) => add(e.target.files)} />
          </label>
        )}
      </div>
      {DEMO && <p className="hint">미리보기에서는 스크린샷을 올릴 수 없어요.</p>}
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="gate-actions">
        <button className="btn" disabled={busy || uploading > 0}>{note ? "고친 메모 저장" : "메모 남기기"}</button>
        <button type="button" className="btn-ghost" onClick={onCancel}>취소</button>
      </div>
    </form>
  );
}

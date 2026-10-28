"use client";
import { useRef, useState } from "react";
import { ArrowDown, ArrowUp, Pencil, Sunrise, Trash2, Upload } from "lucide-react";
import { DEMO, deleteTrack, editTrack, reorderTracks, uploadTrack } from "@/lib/client";
import { clock, MAX_TRACK_BYTES, type Track } from "@/lib/music";
import { useRoom } from "../RoomContext";
import { usePlayer } from "./PlayerContext";
import { Seek, Transport } from "./Controls";

/** The music room drawer: what is playing, the track list, the way into listening mode, and (owner) managing tracks. */
export default function MusicRoom() {
  const { owner } = useRoom();
  const p = usePlayer();
  const [editing, setEditing] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const move = async (i: number, dir: -1 | 1) => {
    const ids = p.tracks.map((t) => t.id);
    [ids[i], ids[i + dir]] = [ids[i + dir], ids[i]];
    const r = await reorderTracks(ids);
    if (!r.ok) setMsg(r.error); else void p.reloadTracks();
  };
  const remove = async (t: Track) => {
    if (confirm !== t.id) { setConfirm(t.id); return; }
    setConfirm(null);
    if (p.current?.id === t.id) p.pause();
    const r = await deleteTrack(t.id);
    setMsg(r.ok ? `「${t.title}」을 지웠어요.` : r.error);
    void p.reloadTracks();
  };

  return (
    <>
      <div className="now">
        <span className="disc" data-playing={p.playing ? "" : undefined} aria-hidden />
        <div>
          <b>{p.current?.title ?? (p.tracks.length ? "곡을 골라주세요" : "아직 올린 곡이 없어요")}</b>
          <span className="hint">{p.current ? [p.current.artist, p.current.credit].filter(Boolean).join(", ") || "출처 미기재" : "빗소리만 틀어두고 쉬어가도 돼요."}</span>
        </div>
        <Transport />
      </div>
      {p.current && <Seek id="drawer-seek" />}
      <button className="btn listen-cta" onClick={() => p.setListen(true)}><Sunrise size={15} aria-hidden /> 듣기 모드로 들어가기</button>

      {p.tracks.length > 0 && (
        <ol className="tracks">
          {p.tracks.map((t, i) => (
            <li key={t.id} aria-current={p.current?.id === t.id ? "true" : undefined}>
              {editing === t.id ? (
                <TrackEdit t={t} onDone={(m) => { setEditing(null); if (m) setMsg(m); void p.reloadTracks(); }} />
              ) : (
                <>
                  <button className="track-hit" onClick={() => (p.current?.id === t.id ? p.toggle() : p.play(t.id))}>
                    <span className="n">{String(i + 1).padStart(2, "0")}</span>
                    <span className="tt-wrap"><b>{t.title}</b><small>{[t.artist, t.credit].filter(Boolean).join(", ")}</small></span>
                    <span className="d">{clock(t.duration)}</span>
                  </button>
                  {owner && (
                    <span className="track-tools">
                      <button className="icon-btn" onClick={() => move(i, -1)} disabled={i === 0} aria-label="위로"><ArrowUp size={14} /></button>
                      <button className="icon-btn" onClick={() => move(i, 1)} disabled={i === p.tracks.length - 1} aria-label="아래로"><ArrowDown size={14} /></button>
                      <button className="icon-btn" onClick={() => setEditing(t.id)} aria-label="정보 고치기"><Pencil size={14} /></button>
                      <button className="icon-btn danger" onClick={() => remove(t)} onBlur={() => setConfirm(null)}
                        aria-label={confirm === t.id ? "한 번 더 누르면 지워져요" : "지우기"} title={confirm === t.id ? "한 번 더 누르면 지워져요" : "지우기"}
                        data-armed={confirm === t.id ? "" : undefined}><Trash2 size={14} /></button>
                    </span>
                  )}
                </>
              )}
            </li>
          ))}
        </ol>
      )}
      {msg && <p className="hint" role="status">{msg}</p>}
      {owner && <UploadForm onDone={(m) => { setMsg(m); void p.reloadTracks(); }} />}
    </>
  );
}

function TrackEdit({ t, onDone }: { t: Track; onDone: (msg?: string) => void }) {
  const [d, setD] = useState({ title: t.title, artist: t.artist, credit: t.credit });
  const [error, setError] = useState<string | null>(null);
  const save = async () => {
    const r = await editTrack(t.id, d);
    if (!r.ok) { setError(r.error); return; }
    onDone("곡 정보를 고쳤어요.");
  };
  return (
    <div className="edit track-edit">
      <label className="field"><span>제목</span><input value={d.title} maxLength={80} onChange={(e) => setD({ ...d, title: e.target.value })} /></label>
      <label className="field"><span>아티스트</span><input value={d.artist} maxLength={60} onChange={(e) => setD({ ...d, artist: e.target.value })} /></label>
      <label className="field"><span>출처와 라이선스</span><input value={d.credit} maxLength={160} onChange={(e) => setD({ ...d, credit: e.target.value })} /></label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="gate-actions"><button className="btn" onClick={save}>저장</button><button className="btn-ghost" onClick={() => onDone()}>취소</button></div>
    </div>
  );
}

/** Measures the length in the browser (so the server never has to decode audio). */
function measure(file: File): Promise<number> {
  return new Promise((resolve) => {
    const a = new Audio(), url = URL.createObjectURL(file);
    const done = (v: number) => { URL.revokeObjectURL(url); resolve(Number.isFinite(v) ? v : 0); };
    a.preload = "metadata";
    a.onloadedmetadata = () => done(a.duration);
    a.onerror = () => done(0);
    a.src = url;
  });
}

function UploadForm({ onDone }: { onDone: (msg: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [d, setD] = useState({ title: "", artist: "", credit: "" });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (DEMO) return <p className="hint upload-note">미리보기에는 서버가 없어서 곡을 올릴 수 없어요. 환경음과 듣기 모드는 쓸 수 있어요.</p>;

  const pick = (f: File | null) => {
    setError(null); setFile(f);
    if (f && !d.title) setD((cur) => ({ ...cur, title: f.name.replace(/\.[^.]+$/, "").slice(0, 80) }));
    if (f && f.size > MAX_TRACK_BYTES) setError("한 곡은 30MB까지 올릴 수 있어요.");
  };
  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || busy) return;
    if (file.size > MAX_TRACK_BYTES) { setError("한 곡은 30MB까지 올릴 수 있어요."); return; }
    setBusy(true); setError(null);
    const form = new FormData();
    form.set("file", file); form.set("title", d.title); form.set("artist", d.artist); form.set("credit", d.credit);
    form.set("duration", String(await measure(file)));
    const r = await uploadTrack(form);
    setBusy(false);
    if (!r.ok) { setError(r.error); return; }
    setFile(null); setD({ title: "", artist: "", credit: "" });
    if (fileRef.current) fileRef.current.value = "";
    onDone(`「${r.data.title}」을 올렸어요.`);
  };

  return (
    <form className="edit upload" onSubmit={send}>
      <p className="upload-title"><Upload size={14} aria-hidden /> 곡 올리기</p>
      <p className="hint">직접 만든 곡이나 공개해도 되는 라이선스의 곡만 올려주세요. 방문자 모두가 들을 수 있어요.</p>
      <label className="field"><span>파일 (mp3, m4a, ogg, wav · 30MB까지)</span>
        <input ref={fileRef} id="music-file" type="file" accept="audio/mpeg,audio/mp4,audio/x-m4a,audio/ogg,audio/wav,.mp3,.m4a,.ogg,.wav"
          onChange={(e) => pick(e.target.files?.[0] ?? null)} />
      </label>
      <label className="field"><span>제목</span><input id="music-title" value={d.title} maxLength={80} onChange={(e) => setD({ ...d, title: e.target.value })} /></label>
      <label className="field"><span>아티스트</span><input id="music-artist" value={d.artist} maxLength={60} onChange={(e) => setD({ ...d, artist: e.target.value })} /></label>
      <label className="field"><span>출처와 라이선스</span>
        <input id="music-credit" value={d.credit} maxLength={160} placeholder="예: 직접 만듦 / CC BY 4.0, 원작자 이름" onChange={(e) => setD({ ...d, credit: e.target.value })} />
      </label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="btn" disabled={!file || busy}>{busy ? "올리는 중…" : "올리기"}</button>
    </form>
  );
}

"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ChevronLeft, Eye, EyeOff, Pencil, PenLine, Pin, Plus, RefreshCw, Trash2, X } from "lucide-react";
import { checkOwner, deleteNote, deleteSlot, getGames, setShowPresence, shotUrl, syncSteam } from "@/lib/client";
import { playtime, shownProgress, STATUSES, type Achievement, type GamesPayload, type GameView, type Note } from "@/lib/games";
import { ago } from "../GuestbookSection";
import { PageLink } from "../PageLink";
import { Sheet } from "../movie/Sheet";
import { Cover } from "./Cover";
import { NoteEditor, PinPicker, SlotEditor } from "./Editors";
import { AchievementPanel, PlatformLine, recentUnlocks, StatsTable, StoreBlock, UnlockRow } from "./Details";

const EASE = [0.16, 1, 0.3, 1] as const;
const day = (iso: string) => iso.slice(5).replace("-", ".");

type Tool = { kind: "pin" } | { kind: "manual" } | { kind: "edit"; slot: GameView } | { kind: "note"; slot: GameView; note?: Note };

/** /game: a LOAD GAME screen. Slots on the left (↑↓ to choose, Enter to open), the chosen save on the right. */
export default function GameBoard() {
  const reduce = useReducedMotion();
  const [data, setData] = useState<GamesPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [owner, setOwner] = useState(false);
  const [sel, setSel] = useState(0);
  const [detailOpen, setDetailOpen] = useState(false); // phones show the list or the save, one at a time
  const [tool, setTool] = useState<Tool | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<string | null>(null);
  const [shot, setShot] = useState<string | null>(null);
  const listRef = useRef<HTMLOListElement>(null);

  const load = useCallback(() => getGames().then((r) => (r.ok ? (setData(r.data), setError(null)) : setError(r.error))), []);
  useEffect(() => { void load(); void checkOwner().then(setOwner); }, [load]);

  const slots = data?.slots ?? [];
  const current = slots[Math.min(sel, slots.length - 1)];
  const notes = useMemo(() => (data?.notes ?? []).filter((n) => n.slotId === current?.id), [data, current]);
  /** Play log: the owner's notes and recent achievement unlocks, newest first. */
  const log = useMemo(() => {
    if (!current) return [];
    const rows: ({ k: "note"; at: number; n: Note } | { k: "ach"; at: number; a: Achievement })[] = [
      ...notes.map((n) => ({ k: "note" as const, at: Date.parse(`${n.date}T23:59:59`), n })),
      ...recentUnlocks(current).map((a) => ({ k: "ach" as const, at: a.unlockedAt, a })),
    ];
    return rows.sort((x, y) => y.at - x.at);
  }, [notes, current]);
  const examples = !!slots.length && slots.every((s) => s.example);
  const closeTool = useCallback(() => setTool(null), []);

  const move = (i: number) => {
    const next = (i + slots.length) % slots.length;
    setSel(next);
    listRef.current?.querySelectorAll<HTMLButtonElement>(".slot-hit")[next]?.focus();
  };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); move(sel + 1); }
    if (e.key === "ArrowUp") { e.preventDefault(); move(sel - 1); }
  };

  const sync = async () => {
    setBusy(true); setNotice(null);
    const r = await syncSteam();
    setBusy(false);
    setNotice(r.ok ? `Steam에서 게임 ${r.data.count}개를 가져왔어요.` : r.error);
    void load();
  };
  const removeSlot = async (s: GameView) => {
    if (confirm !== s.id) { setConfirm(s.id); return; }
    setConfirm(null);
    const r = await deleteSlot(s.id);
    setNotice(r.ok ? `「${s.title}」 슬롯을 내렸어요.` : r.error);
    setSel(0); setDetailOpen(false); void load();
  };
  const removeNote = async (n: Note) => {
    if (confirm !== n.id) { setConfirm(n.id); return; }
    setConfirm(null);
    const r = await deleteNote(n.id);
    setNotice(r.ok ? "메모를 지웠어요." : r.error);
    void load();
  };
  const saved = (msg: string) => { setTool(null); setNotice(msg); void load(); };
  const togglePresence = async () => {
    const on = !data?.showPresence;
    const r = await setShowPresence(on);
    setNotice(r.ok ? (on ? "지금 하는 게임을 방문자에게 보여줘요. 2분마다 확인해요." : "지금 하는 게임 표시를 껐어요.") : r.error);
    void load();
  };

  const renderNote = (n: Note) => (
    <li key={n.id}>
      <span className="log-meta">{day(n.date)}{n.hours ? ` · +${n.hours}h` : ""}{n.example ? " · 예시" : ""}</span>
      <p>{n.text}</p>
      {n.shots.length > 0 && (
        <div className="shots">
          {n.shots.map((id) => (
            <button key={id} onClick={() => setShot(id)} aria-label="스크린샷 크게 보기">
              <img src={shotUrl(id)} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}
      {owner && !n.example && (
        <span className="log-tools">
          <button className="icon-btn" onClick={() => setTool({ kind: "note", slot: current, note: n })} aria-label="메모 고치기"><Pencil size={13} /></button>
          <button className="icon-btn danger" onClick={() => removeNote(n)} onBlur={() => setConfirm(null)} data-armed={confirm === n.id ? "" : undefined}
            aria-label={confirm === n.id ? "한 번 더 누르면 지워져요" : "메모 지우기"} title={confirm === n.id ? "한 번 더 누르면 지워져요" : "메모 지우기"}><Trash2 size={13} /></button>
        </span>
      )}
    </li>
  );

  return (
    <main className="gamepage">
      <PageLink to="home" className="film-back"><ArrowLeft size={15} aria-hidden /> 방으로 돌아가기</PageLink>
      <header className="film-head">
        <span className="label">Load game</span>
        <h1 className="display">어디까지 했더라</h1>
        <p>슬롯마다 플레이 시간과 마지막으로 저장한 곳, 그날 본 것과 깬 것을 남겨둬요. 키보드 ↑↓로 고르고 Enter로 열어요.</p>
      </header>
      {data?.nowPlaying && (
        <p className="now-playing" role="status"><i aria-hidden /> 지금 <b>{data.nowPlaying.name}</b> 하는 중</p>
      )}

      {owner && (
        <div className="film-owner">
          <p className="hint" role="status">
            {notice ?? data?.steamError ?? (examples ? "지금 보이는 슬롯은 예시예요. 첫 게임을 슬롯에 걸면 예시는 사라져요."
              : data?.syncedAt ? `Steam에서 ${ago(data.syncedAt) === "방금" ? "방금" : `${ago(data.syncedAt)}에`} 가져왔어요.` : "Steam을 아직 가져오지 않았어요.")}
          </p>
          <div className="gate-actions">
            <button className="btn-ghost" onClick={sync} disabled={busy}><RefreshCw size={14} aria-hidden /> {busy ? "가져오는 중…" : "Steam에서 가져오기"}</button>
            <button className="btn" onClick={() => setTool({ kind: "pin" })}><Pin size={14} aria-hidden /> 슬롯에 걸기</button>
            <button className="btn-ghost" onClick={() => setTool({ kind: "manual" })}><Plus size={14} aria-hidden /> 직접 추가</button>
            <button className="btn-ghost" aria-pressed={!!data?.showPresence} onClick={togglePresence}>
              {data?.showPresence ? <Eye size={14} aria-hidden /> : <EyeOff size={14} aria-hidden />} 지금 하는 게임 {data?.showPresence ? "공개 중" : "숨김"}
            </button>
          </div>
        </div>
      )}

      {error && <p className="form-error" role="alert">{error}</p>}
      {!data && !error && <p className="hint">세이브 파일을 불러오는 중…</p>}
      {data && !slots.length && <p className="hint film-empty">아직 슬롯에 건 게임이 없어요. 첫 게임을 걸면 여기에 세이브 슬롯이 생겨요.</p>}

      {current && (
        <div className="saves" data-detail={detailOpen ? "" : undefined}>
          <ol className="slot-list" ref={listRef} onKeyDown={onKey} aria-label="세이브 슬롯">
            {slots.map((s, i) => (
              <li key={s.id} className="slot" data-sel={i === sel ? "" : undefined}>
                <button className="slot-hit" aria-current={i === sel} onFocus={() => setSel(i)}
                  onClick={() => { setSel(i); setDetailOpen(true); }}>
                  <span className="slot-cursor" aria-hidden>▶</span>
                  <Cover slot={s} />
                  <span className="slot-body">
                    <span className="slot-no">SLOT {String(i + 1).padStart(2, "0")}{s.example && <em className="ex-tag">예시</em>}</span>
                    <b className="slot-title">{s.title}</b>
                    <span className="slot-time">{playtime(s.minutes)}</span>
                    {s.lastSpot && <span className="slot-spot">{s.lastSpot}</span>}
                    <span className="slot-progress">
                      <Blocks value={shownProgress(s)} />
                      <small>{[STATUSES[s.status], s.progressLabel, s.progress === undefined && s.ach ? `업적 ${s.ach.done}/${s.ach.total}` : ""].filter(Boolean).join(", ")}</small>
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ol>

          <AnimatePresence mode="wait" initial={false}>
            <motion.section key={current.id} className="save" aria-label={`${current.title} 세이브`}
              initial={reduce ? false : { opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={reduce ? undefined : { opacity: 0 }}
              transition={{ duration: 0.4, ease: EASE }}>
              <button className="btn-ghost save-back" onClick={() => setDetailOpen(false)}><ChevronLeft size={14} aria-hidden /> 슬롯으로 돌아가기</button>
              <div className="save-head lamp">
                <i /><i /><i /><i />
                <Cover slot={current} className="cover big" />
                <div>
                  <span className="label">{STATUSES[current.status]}{current.example ? " · 예시" : ""}</span>
                  <h2 className="display">{current.title}</h2>
                  {(current.lastSpot || current.progressLabel) && <p className="save-spot">{[current.progressLabel, current.lastSpot].filter(Boolean).join(", ")}</p>}
                </div>
              </div>
              <StoreBlock v={current} />
              <dl className="save-stats">
                <div><dt>플레이 시간</dt><dd>{playtime(current.minutes)}</dd></div>
                <div><dt>최근 2주</dt><dd>{current.recentMinutes ? playtime(current.recentMinutes) : "없음"}</dd></div>
                <div><dt>마지막 플레이</dt><dd>{current.lastPlayed ? ago(current.lastPlayed) : "기록 없음"}</dd></div>
              </dl>
              <PlatformLine v={current} />
              {shownProgress(current) !== undefined && (
                <div className="save-progress"><Blocks value={shownProgress(current)} />
                  <span>{shownProgress(current)}%{current.progress === undefined && current.ach ? ` (업적 ${current.ach.done}/${current.ach.total})` : ""}</span></div>
              )}

              {owner && !current.example && (
                <div className="film-actions">
                  <button className="btn" onClick={() => setTool({ kind: "note", slot: current })}><PenLine size={13} aria-hidden /> 메모 쓰기</button>
                  <button className="btn-ghost" onClick={() => setTool({ kind: "edit", slot: current })}><Pencil size={13} aria-hidden /> 슬롯 고치기</button>
                  <button className="btn-ghost danger" onClick={() => removeSlot(current)} onBlur={() => setConfirm(null)}>
                    <Trash2 size={13} aria-hidden /> {confirm === current.id ? "한 번 더 누르면 내려가요" : "슬롯 내리기"}
                  </button>
                </div>
              )}

              <AchievementPanel v={current} />
              <StatsTable v={current} />

              <h3 className="save-h">플레이 일지</h3>
              {!log.length && <p className="hint">아직 이 게임의 메모가 없어요.{owner && !current.example ? " '메모 쓰기'로 첫 메모를 남겨보세요." : ""}</p>}
              <ol className="log">
                {log.map((row) => row.k === "ach" ? <li key={`a-${row.a.id}`} className="log-row-ach"><UnlockRow a={row.a} /></li> : renderNote(row.n))}
              </ol>
            </motion.section>
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {shot && (
          <motion.div className="lightbox" role="dialog" aria-modal="true" aria-label="스크린샷" onClick={() => setShot(null)}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <img src={shotUrl(shot)} alt="" />
            <button className="icon-btn" onClick={() => setShot(null)} aria-label="닫기"><X size={18} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      <Sheet open={tool?.kind === "pin"} label="Pin a game" title="슬롯에 걸기" onClose={closeTool}>
        {tool?.kind === "pin" && <PinPicker onDone={saved} />}
      </Sheet>
      <Sheet open={tool?.kind === "manual" || tool?.kind === "edit"} label={tool?.kind === "edit" ? "Edit slot" : "New slot"}
        title={tool?.kind === "edit" ? "슬롯 고치기" : "직접 추가"} onClose={closeTool}>
        {(tool?.kind === "manual" || tool?.kind === "edit") && (
          <SlotEditor key={tool.kind === "edit" ? tool.slot.id : "new"} slot={tool.kind === "edit" ? tool.slot : undefined} onCancel={closeTool} onDone={saved} />
        )}
      </Sheet>
      <Sheet open={tool?.kind === "note"} label={tool?.kind === "note" ? tool.slot.title : ""} title={tool?.kind === "note" && tool.note ? "메모 고치기" : "메모 쓰기"} onClose={closeTool}>
        {tool?.kind === "note" && <NoteEditor key={tool.note?.id ?? "new"} slot={tool.slot} note={tool.note} onCancel={closeTool} onDone={saved} />}
      </Sheet>
    </main>
  );
}

/** Ten blocks, filled to the nearest 10%; nothing when there is no percentage. */
export function Blocks({ value }: { value?: number }) {
  if (value === undefined) return null;
  const on = Math.round(value / 10);
  return (
    <span className="blocks" role="img" aria-label={`진행률 ${value}%`}>
      {Array.from({ length: 10 }, (_, i) => <i key={i} data-on={i < on ? "" : undefined} />)}
    </span>
  );
}

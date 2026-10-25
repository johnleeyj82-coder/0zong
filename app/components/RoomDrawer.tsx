"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Pencil, X } from "lucide-react";
import { RoomBody } from "../rooms/bodies";
import { useRoom } from "./RoomContext";

const EASE = [0.16, 1, 0.3, 1] as const;

export default function RoomDrawer() {
  const { drawer, openDrawer, rooms, owner, editRoom } = useRoom();
  const room = rooms.find((r) => r.key === drawer);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ title: "", desc: "", update: "" });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!drawer) return;
    setEditing(false); setError(null);
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") openDrawer(null); };
    window.addEventListener("keydown", onKey);
    const t = setTimeout(() => closeRef.current?.focus(), 50);
    return () => { window.removeEventListener("keydown", onKey); clearTimeout(t); };
  }, [drawer, openDrawer]);

  const startEdit = () => { if (!room) return; setDraft({ title: room.title, desc: room.desc, update: room.update }); setEditing(true); };
  const saveEdit = async () => {
    if (!room) return;
    if (!draft.title.trim()) { setError("제목을 비워둘 수 없어요."); return; }
    const err = await editRoom(room.key, draft);
    if (err) setError(err); else setEditing(false);
  };

  return (
    <AnimatePresence>
      {room && (
        <motion.div key="scrim" className="scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => openDrawer(null)}>
          <motion.aside className="drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-h" onClick={(e) => e.stopPropagation()}
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ duration: 0.6, ease: EASE }}>
            <button ref={closeRef} className="drawer-close" onClick={() => openDrawer(null)} aria-label="닫기"><X size={18} /></button>
            <header className="drawer-head lamp">
              <i /><i /><i /><i />
              <span className="icon-disc"><room.icon size={20} aria-hidden /></span>
              <div>
                <span className="label">{room.label} · 예시 기록</span>
                <h2 id="drawer-h" className="display">{room.title}</h2>
              </div>
            </header>
            {editing ? (
              <div className="edit">
                <label className="field"><span>제목</span><input id="edit-title" value={draft.title} maxLength={30} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></label>
                <label className="field"><span>소개</span><textarea id="edit-desc" value={draft.desc} maxLength={200} rows={3} onChange={(e) => setDraft({ ...draft, desc: e.target.value })} /></label>
                <label className="field"><span>최근 소식 (언제 · 무엇)</span><input id="edit-update" value={draft.update} maxLength={60} onChange={(e) => setDraft({ ...draft, update: e.target.value })} /></label>
                {error && <p className="form-error" role="alert">{error}</p>}
                <div className="gate-actions"><button className="btn" onClick={saveEdit}>저장</button><button className="btn-ghost" onClick={() => setEditing(false)}>취소</button></div>
              </div>
            ) : (
              <>
                <p className="drawer-desc">{room.desc}</p>
                <p className="drawer-update">{room.update}</p>
                {owner && <button className="btn-ghost edit-btn" onClick={startEdit}><Pencil size={14} aria-hidden /> 이 방 소개 고치기</button>}
              </>
            )}
            <div className="drawer-body"><RoomBody k={room.key} /></div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

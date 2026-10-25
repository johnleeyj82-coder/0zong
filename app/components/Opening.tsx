"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { KeyRound, Lock } from "lucide-react";
import { login, registerVisit } from "@/lib/client";
import { useRoom } from "./RoomContext";

const EASE = [0.16, 1, 0.3, 1] as const;

/** First load: the room is dark, the lamps flicker on, then the optional guestbook gate (or a greeting for returning visitors). */
export default function Opening() {
  const { phase, setPhase, ready, returning, owner, name, mode, visitorId, enter, setOwner } = useRoom();
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t1 = setTimeout(() => setPhase("lights"), reduce ? 0 : 700);
    const t2 = setTimeout(() => setPhase("gate"), reduce ? 50 : 2400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [setPhase]);

  // Returning visitors and the owner skip the gate and get a short greeting instead.
  useEffect(() => {
    if (phase !== "gate" || !ready) return;
    if (owner) { setToast("어서 와요. 편집 모드가 켜져 있어요."); setPhase("done"); }
    else if (returning) { setToast(mode === "skip" || !name ? "다시 와줘서 고마워요." : `다시 왔네요, ${name}님.`); setPhase("done"); }
  }, [phase, ready, owner, returning, mode, name, setPhase]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(t);
  }, [toast]);

  const showGate = phase === "gate" && ready && !owner && !returning;
  useEffect(() => {
    document.body.style.overflow = showGate ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [showGate]);

  return (
    <>
      <AnimatePresence>
        {showGate && (
          <Gate key="gate" visitorId={visitorId}
            onEnter={(m, n) => { enter(m, n); setToast(m === "skip" ? null : `반가워요, ${n}님.`); setPhase("done"); }}
            onOwner={() => { setOwner(true); setToast("어서 와요. 편집 모드가 켜졌어요."); setPhase("done"); }} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {toast && (
          <motion.div className="toast" role="status" initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.5, ease: EASE }}>
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Gate({ visitorId, onEnter, onOwner }: {
  visitorId: string; onEnter: (mode: "named" | "anonymous" | "skip", name: string) => void; onOwner: () => void;
}) {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [needsPassword, setNeedsPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const pwRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (needsPassword) pwRef.current?.focus(); }, [needsPassword]);

  const submitName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setError(null);
    if (needsPassword) {
      if (!password) { setError("비밀번호를 입력해주세요."); return; }
      setBusy(true);
      const r = await login(name, password);
      setBusy(false);
      if (!r.ok) { setError(r.error); setPassword(""); return; }
      onOwner();
      return;
    }
    if (!name.trim()) { setError("이름을 입력하거나, 아래에서 익명으로 들어와 주세요."); return; }
    setBusy(true);
    const r = await registerVisit(visitorId, name, "named");
    setBusy(false);
    if (!r.ok) { setError(r.error); return; }
    if (r.data.needsPassword) { setNeedsPassword(true); return; }
    onEnter("named", r.data.name || name.trim());
  };

  const anonymous = async () => {
    if (busy) return;
    setBusy(true);
    const r = await registerVisit(visitorId, "", "anonymous");
    setBusy(false);
    if (!r.ok) { setError(r.error); return; }
    onEnter("anonymous", r.data.name || "익명");
  };

  return (
    <motion.div className="gate" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }}>
      <motion.form className="gate-card" onSubmit={submitName} aria-labelledby="gate-h"
        initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }} transition={{ duration: 0.9, ease: EASE }}>
        <span className="label">Guestbook · 선택</span>
        <h2 id="gate-h" className="display">들어오기 전에, 이름을 남길래요?</h2>
        <label className="field">
          <span>이름</span>
          <input id="gate-name" value={name} maxLength={20} autoFocus autoComplete="nickname" disabled={needsPassword}
            placeholder="방명록에 쓸 이름" onChange={(e) => { setName(e.target.value); setError(null); }} />
        </label>
        <AnimatePresence>
          {needsPassword && (
            <motion.label className="field" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
              <span><Lock size={13} aria-hidden /> 방 주인 비밀번호</span>
              <input id="gate-password" ref={pwRef} type="password" value={password} autoComplete="current-password"
                onChange={(e) => { setPassword(e.target.value); setError(null); }} />
            </motion.label>
          )}
        </AnimatePresence>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="gate-actions">
          <button type="submit" className="btn" disabled={busy}>
            {needsPassword ? <><KeyRound size={15} aria-hidden /> 편집 모드로 들어가기</> : "들어가기"}
          </button>
          {needsPassword ? (
            <button type="button" className="btn-ghost" onClick={() => { setNeedsPassword(false); setPassword(""); setName(""); setError(null); }}>다른 이름 쓰기</button>
          ) : (
            <>
              <button type="button" className="btn-ghost" onClick={anonymous} disabled={busy}>익명으로</button>
              <button type="button" className="btn-ghost" onClick={() => onEnter("skip", "")} disabled={busy}>그냥 둘러볼게요</button>
            </>
          )}
        </div>
        <p className="gate-note">이름을 남기면 이 방에서 무엇을 봤는지 방 주인이 볼 수 있어요. IP나 위치는 저장하지 않아요. &lsquo;그냥 둘러볼게요&rsquo;를 고르면 아무것도 기록하지 않아요.</p>
      </motion.form>
    </motion.div>
  );
}

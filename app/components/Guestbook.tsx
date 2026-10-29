"use client";
import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { getMessages, hideMessage, postMessage } from "@/lib/client";
import type { Message } from "@/lib/types";
import { useRoom } from "./RoomContext";

export function ago(at: number) {
  const s = Math.max(1, Math.round((Date.now() - at) / 1000));
  if (s < 60) return "방금";
  const m = Math.round(s / 60); if (m < 60) return `${m}분 전`;
  const h = Math.round(m / 60); if (h < 24) return `${h}시간 전`;
  const d = Math.round(h / 24); if (d < 30) return `${d}일 전`;
  return new Date(at).toLocaleDateString("ko-KR");
}

/** The guestbook: form on top, public messages below. Opened from the dock as a panel. */
export default function Guestbook() {
  const { visitorId, name: myName, mode, owner, track } = useRoom();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { void getMessages().then((m) => { setMessages(m); setLoaded(true); }); }, [owner]);
  useEffect(() => { if (mode === "named" || mode === "anonymous") setName(myName); }, [mode, myName]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) { setError("남길 말을 적어주세요."); return; }
    setBusy(true);
    const r = await postMessage(visitorId, name, text);
    setBusy(false);
    if (!r.ok) { setError(r.error); return; }
    setMessages((cur) => [r.data.message, ...cur]);
    setText("");
    track("guestbook");
  };

  const toggle = async (m: Message) => {
    await hideMessage(m.id, !m.hidden);
    setMessages((cur) => cur.map((x) => (x.id === m.id ? { ...x, hidden: !m.hidden } : x)));
  };

  return (
    <div className="gb">
      <form className="gb-form" onSubmit={submit}>
        <label className="field"><span>이름</span>
          <input id="gb-name" value={name} maxLength={20} placeholder="비워두면 익명" onChange={(e) => setName(e.target.value)} disabled={mode === "anonymous"} />
        </label>
        <label className="field"><span>남길 말</span>
          <textarea id="gb-text" value={text} maxLength={300} rows={3} placeholder="방에서 제일 마음에 든 물건이 뭐였어요?"
            onChange={(e) => { setText(e.target.value); setError(null); }} />
        </label>
        <div className="gb-row">
          <span className="hint">{text.length} / 300 · 방명록은 누구나 볼 수 있어요.</span>
          <button className="btn" disabled={busy}>남기기</button>
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
      </form>
      <ul className="gb-list" aria-live="polite">
        {loaded && messages.length === 0 && <li className="empty">아직 방명록이 없어요. 첫 번째로 이름을 남겨주세요.</li>}
        {messages.map((m) => (
          <li key={m.id} className={m.hidden ? "hidden-msg" : undefined}>
            <div className="gb-meta"><b>{m.name}</b><span>{ago(m.at)}</span>
              {owner && <button className="icon-btn" onClick={() => toggle(m)} aria-label={m.hidden ? "다시 보이기" : "숨기기"}>{m.hidden ? <Eye size={15} /> : <EyeOff size={15} />}</button>}
            </div>
            <p>{m.text}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

"use client";
import { useEffect, useState } from "react";
import { LogOut, X } from "lucide-react";
import { getDashboard, logout } from "@/lib/client";
import type { Dashboard as D, Visitor } from "@/lib/types";
import { spaceLabel, ROOMS } from "../data";
import { ago } from "./Guestbook";
import HelperCard from "./HelperCard";

const TYPE_LABEL: Record<string, string> = { enter: "들어옴", view: "봄", dock: "바로가기", open: "열어봄", guestbook: "방명록 씀", score: "기록 세움", move: "방 이동" };
const roomLabel = (k?: string) => ROOMS.find((r) => r.key === k)?.label ?? spaceLabel(k);

/** Owner-only view: which rooms people care about, who visited, and what each named visitor did. */
export default function Dashboard({ onClose, onLogout }: { onClose?: () => void; onLogout?: () => void }) {
  const [data, setData] = useState<D | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sel, setSel] = useState<Visitor | null>(null);

  useEffect(() => {
    void getDashboard().then((r) => {
      if (r.ok) { setData(r.data); setSel(r.data.visitors[0] ?? null); } else setError(r.error);
    });
  }, []);

  const max = data ? Math.max(1, ...Object.values(data.interest)) : 1;
  const ranked = data ? ROOMS.map((r) => ({ r, n: data.interest[r.key] ?? 0 })).sort((a, b) => b.n - a.n) : [];

  return (
    <div className="dash">
      <header className="dash-head">
        <div><span className="label">Owner only · 방문 기록</span><h2 className="display">누가, 무엇을 봤을까</h2></div>
        <div className="dash-actions">
          {onLogout && <button className="btn-ghost" onClick={async () => { await logout(); onLogout(); }}><LogOut size={14} aria-hidden /> 편집 모드 끄기</button>}
          {onClose && <button className="icon-btn" onClick={onClose} aria-label="닫기"><X size={18} /></button>}
        </div>
      </header>
      {error && <p className="form-error" role="alert">{error}</p>}
      {!data && !error && <p className="hint">불러오는 중…</p>}
      {data && (
        <div className="dash-grid">
          <HelperCard />
          <section className="dash-card">
            <h3>관심 받은 방</h3>
            <p className="hint">본 것 1점, 열어본 것 2점, 바로가기와 기록 1점</p>
            <ul className="bars">
              {ranked.map(({ r, n }) => (
                <li key={r.key}><span className="bl"><r.icon size={14} aria-hidden /> {r.label}</span>
                  <span className="bt"><i style={{ width: `${(n / max) * 100}%` }} /></span><span className="bn">{n}</span></li>
              ))}
            </ul>
          </section>
          <section className="dash-card">
            <h3>방문자 <span className="hint">{data.visitors.length}명</span></h3>
            {data.visitors.length === 0 && <p className="hint">아직 이름을 남긴 방문자가 없어요.</p>}
            <ul className="vlist">
              {data.visitors.map((v) => (
                <li key={v.id}><button aria-pressed={sel?.id === v.id} onClick={() => setSel(v)}>
                  <b>{v.name}</b><span>{v.mode === "anonymous" ? "익명" : "이름"} · {ago(v.lastAt)} · {v.events.length}개 기록</span>
                </button></li>
              ))}
            </ul>
          </section>
          <section className="dash-card wide">
            <h3>{sel ? `${sel.name}님이 한 일` : "방문자를 고르면 기록이 보여요"}</h3>
            {sel && (
              <ol className="timeline">
                {[...sel.events].sort((a, b) => a.at - b.at).map((e, i) => (
                  <li key={i}><span className="when">{new Date(e.at).toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                    <span>{e.room ? `${roomLabel(e.room)} · ` : ""}{TYPE_LABEL[e.type]}{e.value !== undefined ? ` (${e.value})` : ""}</span></li>
                ))}
              </ol>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

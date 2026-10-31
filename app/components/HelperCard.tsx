"use client";
// Owner only: connect the Windows helper (one-time token), see what it reports, and choose whether visitors see it.
import { useCallback, useEffect, useState } from "react";
import { Copy, Download, Plug, Unplug } from "lucide-react";
import { CATEGORIES, hm } from "@/lib/activity";
import { DEMO, disconnectHelper, getActivity, isOwnerActivity, newHelperToken, setPublicLive, type ActivityPayload } from "@/lib/client";
import { ago } from "./Guestbook";

const SCRIPT = `${DEMO ? "" : "/"}tools/0zong-helper.ps1`;

export default function HelperCard() {
  const [a, setA] = useState<ActivityPayload | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const load = useCallback(async () => setA(await getActivity()), []);
  useEffect(() => { void load(); const t = setInterval(load, 30_000); return () => clearInterval(t); }, [load]);

  const own = isOwnerActivity(a) ? a : null;
  const command = token ? `powershell -ExecutionPolicy Bypass -File "$HOME\\Downloads\\0zong-helper.ps1" -Url "${location.origin}" -Token "${token}"` : "";

  const make = async () => {
    if (own?.connected && !confirm("새 토큰을 만들면 지금 연결된 도우미는 끊겨요. 계속할까요?")) return;
    const r = await newHelperToken();
    if (!r.ok) { setError(r.error); return; }
    setToken(r.data.token); setError(null); void load();
  };
  const cut = async () => {
    if (!confirm("도우미 연결을 끊을까요? 지금까지 쌓인 시간은 남아요.")) return;
    const r = await disconnectHelper();
    if (!r.ok) { setError(r.error); return; }
    setToken(null); void load();
  };
  const share = async (on: boolean) => {
    const r = await setPublicLive(on);
    if (!r.ok) setError(r.error); else void load();
  };

  return (
    <section className="dash-card wide helper">
      <h3>PC 도우미 <span className="hint">Windows</span></h3>
      {DEMO && <p className="hint">미리보기에는 서버가 없어서 도우미를 연결할 수 없어요. 오늘의 방은 예시로 보여요.</p>}
      {own && (
        <p className="helper-status">
          {own.connected ? <><Plug size={14} aria-hidden /> 연결됨</> : <><Unplug size={14} aria-hidden /> 연결 안 됨</>}
          {own.lastSeen && <span> · 마지막 신호 {ago(own.lastSeen)}</span>}
          {own.now && <span> · 지금 <b>{own.now.app}</b> ({CATEGORIES[own.now.category]})</span>}
        </p>
      )}
      <p className="hint">30초마다 맨 앞 창의 프로그램 이름만 보고 분류해서 보내요. 창 제목이나 문서 내용은 읽지 않고, 목록에 없는 프로그램은 보내지 않아요. 5분 동안 입력이 없으면 아무것도 보내지 않아요.</p>
      <div className="gate-actions">
        <button className="btn-ghost" onClick={make} disabled={DEMO}><Plug size={14} aria-hidden /> {own?.connected ? "새 토큰 만들기" : "도우미 연결하기"}</button>
        {own?.connected && <button className="btn-ghost" onClick={cut}><Unplug size={14} aria-hidden /> 연결 끊기</button>}
        <a className="btn-ghost" href={SCRIPT} download="0zong-helper.ps1"><Download size={14} aria-hidden /> 도우미 받기 (.ps1)</a>
      </div>
      {token && (
        <div className="helper-token" role="status">
          <p><b>이 토큰은 지금 한 번만 보여요.</b> Windows PowerShell에 아래 줄을 붙여넣으면 도우미가 시작돼요. 창을 닫으면 멈춰요.</p>
          <code>{command}</code>
          <button className="btn-ghost" onClick={async () => { await navigator.clipboard.writeText(command); setCopied(true); }}>
            <Copy size={14} aria-hidden /> {copied ? "복사했어요" : "복사하기"}
          </button>
        </div>
      )}
      {own && (
        <label className="helper-toggle">
          <input type="checkbox" checked={own.publicLive} onChange={(e) => share(e.target.checked)} disabled={!own.connected} />
          <span>구경꾼에게 지금 하는 일 보여주기 <small>분류만, 3분 늦게. 끄면 바로 사라져요.</small></span>
        </label>
      )}
      {own && own.apps.length > 0 && (
        <>
          <h4 className="save-h">오늘 쓴 프로그램 <span>나만 봐요</span></h4>
          <ul className="helper-apps">
            {own.apps.slice(0, 8).map((x) => <li key={x.app}><span>{x.app}</span><span className="hint">{CATEGORIES[x.category]}</span><b>{hm(x.minutes)}</b></li>)}
          </ul>
        </>
      )}
      {error && <p className="form-error" role="alert">{error}</p>}
    </section>
  );
}

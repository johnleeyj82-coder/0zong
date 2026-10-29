"use client";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { playtime, PLATFORMS, type Achievement, type GameView, type Platform } from "@/lib/games";

const stamp = (ms: number) => {
  const d = new Date(ms);
  return `${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
};
const pct = (v?: number) => (v === undefined ? "" : v < 10 ? `${v.toFixed(1)}%` : `${Math.round(v)}%`);

/** Genres, release date, developer and Steam's short description. */
export function StoreBlock({ v }: { v: GameView }) {
  const s = v.details?.store;
  if (!s) return null;
  const facts = [s.released, s.developers.join(", ")].filter(Boolean).join(", ");
  return (
    <div className="store">
      {s.genres.length > 0 && <div className="chips">{s.genres.map((g) => <span key={g}>{g}</span>)}</div>}
      {facts && <p className="hint">{facts}</p>}
      {s.description && <p className="store-desc">{s.description}</p>}
    </div>
  );
}

/** "Steam Deck 30:10, Windows 112:00", only when Steam split the time by platform. */
export function PlatformLine({ v }: { v: GameView }) {
  const list = Object.entries(v.platforms ?? {}).filter(([, m]) => (m ?? 0) > 0) as [Platform, number][];
  if (!list.length) return null;
  return (
    <p className="platforms">
      {list.sort((a, b) => b[1] - a[1]).map(([k, m]) => <span key={k}>{PLATFORMS[k]} <b>{playtime(m)}</b></span>)}
    </p>
  );
}

function Icon({ a }: { a: Achievement }) {
  const src = a.achieved ? a.icon : a.iconGray || a.icon;
  return src ? <img className="ach-icon" src={src} alt="" loading="lazy" data-locked={a.achieved ? undefined : ""} /> : <span className="ach-icon ph" aria-hidden />;
}

/** Count, the three rarest unlocked achievements, and the full list on demand (unlocked first, newest first). */
export function AchievementPanel({ v }: { v: GameView }) {
  const [all, setAll] = useState(false);
  const list = v.details?.achievements;
  if (!list?.length || !v.ach) return null;
  const done = list.filter((a) => a.achieved);
  const rare = [...done].filter((a) => a.globalPct !== undefined).sort((a, b) => a.globalPct! - b.globalPct!).slice(0, 3);
  const ordered = [...done.sort((a, b) => b.unlockedAt - a.unlockedAt), ...list.filter((a) => !a.achieved)];
  return (
    <section className="ach" aria-label="업적">
      <h3 className="save-h">업적 <span>{v.ach.done} / {v.ach.total}</span></h3>
      {rare.length > 0 && (
        <ul className="ach-rare">
          {rare.map((a) => (
            <li key={a.id}>
              <Icon a={a} />
              <span><b>{a.name}</b><small>전체 플레이어 {pct(a.globalPct)} 달성</small></span>
            </li>
          ))}
        </ul>
      )}
      <button className="btn-ghost ach-toggle" aria-expanded={all} onClick={() => setAll((x) => !x)}>
        업적 전체 보기 <ChevronDown size={14} aria-hidden style={{ transform: all ? "rotate(180deg)" : undefined }} />
      </button>
      {all && (
        <ol className="ach-all">
          {ordered.map((a) => (
            <li key={a.id} data-locked={a.achieved ? undefined : ""}>
              <Icon a={a} />
              <span className="tt-wrap"><b>{a.name}</b><small>{a.desc}</small></span>
              <span className="ach-meta">{a.achieved ? stamp(a.unlockedAt) : "미달성"}{a.globalPct !== undefined ? <small>{pct(a.globalPct)}</small> : null}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

/** Named per-game stats Steam keeps (kills, distance, ...), when the game has any. */
export function StatsTable({ v }: { v: GameView }) {
  const st = v.details?.stats;
  if (!st?.length) return null;
  return (
    <section aria-label="게임 통계">
      <h3 className="save-h">게임 통계</h3>
      <dl className="game-stats">
        {st.map((s) => <div key={s.id}><dt>{s.name}</dt><dd>{s.value.toLocaleString("ko-KR")}</dd></div>)}
      </dl>
    </section>
  );
}

/** The most recent unlocks, to mix into the play log. */
export const recentUnlocks = (v: GameView, max = 20) =>
  (v.details?.achievements ?? []).filter((a) => a.achieved && a.unlockedAt).sort((a, b) => b.unlockedAt - a.unlockedAt).slice(0, max);

export function UnlockRow({ a }: { a: Achievement }) {
  return (
    <>
      <span className="log-meta">{stamp(a.unlockedAt)} · 업적{a.globalPct !== undefined ? ` · 전체 ${pct(a.globalPct)} 달성` : ""}</span>
      <p className="log-ach"><Icon a={a} /><span><b>{a.name}</b>{a.desc && <small>{a.desc}</small>}</span></p>
    </>
  );
}

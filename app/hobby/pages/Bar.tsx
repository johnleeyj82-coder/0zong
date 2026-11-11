"use client";
// 바 — 메뉴판. A bar menu of the cocktails I practised. Each card draws its own glass from the technique (build, float,
// shake, stir) and pours it when it comes into view; the recipe is set like a menu, with dotted leaders to the measures.
import { useMemo, useRef, useState } from "react";
import { animate, onScroll, stagger } from "animejs";
import { md } from "@/lib/time";
import type { Entry } from "@/lib/types";
import { useHobby } from "../Shell";
import { useAnime } from "../anime";

type Layer = { c: string; h: number };
/** What is in the glass, bottom first, as fractions of the glass height. */
const POUR: Record<string, { glass: "tall" | "shot" | "coupe" | "rocks"; layers: Layer[]; ice?: boolean; foam?: boolean; cherry?: boolean }> = {
  빌드: { glass: "tall", layers: [{ c: "#d8a24a", h: 0.28 }, { c: "#f0d9a0", h: 0.5 }], ice: true },
  플로트: { glass: "shot", layers: [{ c: "#2a1a12", h: 0.28 }, { c: "#e8d9b8", h: 0.26 }, { c: "#d9772a", h: 0.26 }] },
  셰이크: { glass: "coupe", layers: [{ c: "#e3b04a", h: 0.62 }], foam: true },
  스터: { glass: "rocks", layers: [{ c: "#9a3b1a", h: 0.55 }], cherry: true, ice: true },
};
const GLASS = {
  tall: "M34 8 H86 L82 150 Q60 156 38 150 Z", shot: "M40 60 H80 L74 150 Q60 154 46 150 Z",
  coupe: "M14 40 Q60 128 106 40 Z M57 100 H63 V146 H57 Z M36 146 H84 V152 H36 Z", rocks: "M26 70 H94 L88 150 Q60 156 32 150 Z",
};
// The part of each glass that holds liquid: [x, top y, width, bottom y].
const BOWL = { tall: [34, 8, 52, 152], shot: [40, 60, 40, 152], coupe: [14, 40, 92, 100], rocks: [26, 70, 68, 152] };

function Glass({ e }: { e: Entry }) {
  // A short drink built over ice (old fashioned, negroni) sits in a rocks glass, not a highball.
  const base = POUR[e.tag ?? ""] ?? POUR.빌드;
  const p = base.glass === "tall" && /올드|네그로니|록|러스티/.test(e.title) ? { ...base, glass: "rocks" as const, layers: [{ c: "#b5651d", h: 0.5 }] } : base;
  const [x, top, w, bottom] = BOWL[p.glass];
  const full = bottom - top;
  let y = bottom;
  const id = `g-${e.id}`;
  return (
    <svg className="bar-glass-svg" viewBox="0 0 120 160" aria-hidden>
      <defs><clipPath id={id}><path d={GLASS[p.glass].split(" M")[0]} /></clipPath></defs>
      <g clipPath={`url(#${id})`}>
        {p.layers.map((l, i) => { const h = l.h * full; y -= h; return <rect key={i} className="pour" x={x} y={y} width={w} height={h + 0.5} fill={l.c} style={{ transformOrigin: `60px ${bottom}px` }} />; })}
        {p.foam && <rect className="pour" x={x} y={y - 7} width={w} height={8} fill="#fbf3e2" style={{ transformOrigin: `60px ${bottom}px` }} />}
        {p.ice && [0, 1].map((i) => <rect key={i} className="ice" x={46 + i * 16} y={y + 8 + i * 14} width="17" height="17" rx="3" fill="rgba(235,245,255,0.38)" stroke="rgba(255,255,255,0.6)" transform={`rotate(${i ? -12 : 14} ${54 + i * 16} ${y + 16})`} />)}
        {p.glass === "tall" && [0, 1, 2, 3, 4].map((i) => <circle key={i} className="bubble" cx={44 + i * 8} cy={bottom - 8} r={1.6} fill="rgba(255,255,255,0.7)" />)}
        {p.cherry && <circle cx="74" cy={bottom - 12} r="6" fill="#8a0f1a" />}
      </g>
      <path d={GLASS[p.glass]} fill="none" stroke="rgba(255,240,220,0.6)" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

export default function BarPage() {
  const { entries, ready } = useHobby();
  const root = useRef<HTMLDivElement>(null);
  const techniques = useMemo(() => [...new Set(entries.map((e) => e.tag || "기타"))], [entries]);
  const [tech, setTech] = useState<string | null>(null);
  const shown = tech ? entries.filter((e) => (e.tag || "기타") === tech) : entries;

  useAnime(root, () => {
    animate(".bar-head > *", { opacity: [0, 1], y: [18, 0], duration: 800, delay: stagger(110), ease: "outExpo" });
    // Each drink pours when its card scrolls into view.
    root.current!.querySelectorAll<HTMLElement>(".drink").forEach((card) => {
      animate(card.querySelectorAll(".pour"), { scaleY: [0, 1], duration: 1100, delay: stagger(260), ease: "outQuad", autoplay: onScroll({ target: card, enter: "bottom-=80 top" }) });
      animate(card.querySelectorAll(".ice"), { y: [-90, 0], opacity: [0, 1], duration: 600, delay: stagger(120, { start: 900 }), ease: "outBounce", autoplay: onScroll({ target: card, enter: "bottom-=80 top" }) });
      animate(card.querySelectorAll(".bubble"), { y: [0, -110], opacity: [0.9, 0], duration: 1900, delay: stagger(260, { start: 1100 }), loop: true, ease: "linear" });
    });
  }, [ready, shown.length, tech]);

  return (
    <div ref={root} className="bar-page">
      <header className="bar-head">
        <small>0zong&apos;s</small>
        <h1>메뉴판</h1>
        <p>조주기능사 준비. 만들어 본 것만 메뉴에 올려요.</p>
        <div className="bar-filter" role="group" aria-label="기법으로 고르기">
          <button aria-pressed={!tech} onClick={() => setTech(null)}>전부 <i>{entries.length}</i></button>
          {techniques.map((t) => <button key={t} aria-pressed={tech === t} onClick={() => setTech(tech === t ? null : t)}>{t} <i>{entries.filter((e) => (e.tag || "기타") === t).length}</i></button>)}
        </div>
      </header>

      {ready && !entries.length && <p className="bar-empty">아직 메뉴가 없어요. 첫 실습을 기록하면 잔이 하나 올라와요.</p>}

      <div className="menu">
        {shown.map((e) => (
          <article key={e.id} className="drink">
            <Glass e={e} />
            <div>
              <h2>{e.title}<em>{e.tag}</em></h2>
              {e.notes[0] && (
                <ul className="recipe-lines">
                  {e.notes[0].split(/,\s*/).map((part) => {
                    const m = part.match(/^(.*?)\s+([\d/.]+\s*\S+)$/);
                    return <li key={part}><span>{m ? m[1] : part}</span>{m && <><i aria-hidden /><b>{m[2]}</b></>}</li>;
                  })}
                </ul>
              )}
              {e.notes[1] && <p className="bar-memo">{e.notes[1]}</p>}
              <footer>{md(e.at)} 실습{e.example && " · 예시"}</footer>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

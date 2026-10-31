"use client";
// 바: a backlit bar at night. A stream pours into a glass and the drink builds in layers, an ice cube drops in with a
// clink, the surface keeps moving. Click the glass to stir it. The recipe is written like a bar menu beside it.
import { useEffect, useState } from "react";
import type { SceneProps } from "../Stage";
import { recordsLabel } from "../Stage";
import { clink, pour } from "../sfx";

const RECIPE: [string, string][] = [["버번", "45 ml"], ["스위트 베르무트", "22 ml"], ["앙고스투라 비터스", "2 dash"], ["체리", "1"]];

export default function WhiskyScene({ room, reduce, openRecords }: SceneProps) {
  const [stir, setStir] = useState(0);
  useEffect(() => {
    if (reduce) return;
    pour(1.6);
    const t = setTimeout(clink, 2100);
    return () => clearTimeout(t);
  }, [reduce]);

  return (
    <div className="bar-root" data-reduce={reduce || undefined}>
      <div className="bokeh" aria-hidden>{Array.from({ length: 14 }, (_, i) => <i key={i} style={{ ["--i" as string]: i }} />)}</div>
      <button className="glass-wrap" onClick={() => { setStir((s) => s + 1); clink(); }} aria-label="잔 젓기">
        <span className="stream" aria-hidden />
        <svg className="bar-glass" viewBox="0 0 220 240" aria-hidden data-stir={stir ? (stir % 2 ? "a" : "b") : undefined}>
          <defs>
            <clipPath id="bar-glass"><path d="M30 40 L190 40 L176 220 Q110 232 44 220 Z" /></clipPath>
            <linearGradient id="bar-amber" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#e9a14a" /><stop offset="1" stopColor="#8a3b12" /></linearGradient>
          </defs>
          <g clipPath="url(#bar-glass)">
            <rect className="liq l1" x="0" y="150" width="220" height="90" fill="#6a1f12" />
            <rect className="liq l2" x="0" y="110" width="220" height="60" fill="url(#bar-amber)" />
            <path className="wave" d="M-220 112 q27 -8 55 0 t55 0 t55 0 t55 0 t55 0 t55 0 t55 0 t55 0 V240 H-220 Z" fill="#c9762a" opacity="0.55" />
            <rect className="ice" x="92" y="60" width="44" height="44" rx="8" fill="rgba(230,240,255,0.35)" stroke="rgba(255,255,255,0.6)" />
            <circle className="cherry" cx="140" cy="205" r="9" fill="#8a0f1a" />
          </g>
          <path d="M30 40 L190 40 L176 220 Q110 232 44 220 Z" fill="none" stroke="rgba(255,240,220,0.55)" strokeWidth="2.5" />
          <path d="M40 52 L52 210" stroke="rgba(255,255,255,0.25)" strokeWidth="5" strokeLinecap="round" />
        </svg>
      </button>
      <div className="bar-menu">
        <h1 className="bar-title">{room.label}</h1>
        <p className="bar-desc">{room.desc}</p>
        <dl className="bar-recipe" aria-label="예시 레시피: 맨해튼">
          <dt className="bar-recipe-name">맨해튼 <small>예시</small></dt>
          {RECIPE.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
          <dt className="bar-method">스터 · 쿠페 글라스</dt>
        </dl>
        <p className="bar-update">{room.update}</p>
        <button className="bar-cta" onClick={openRecords}>{recordsLabel("whisky")}</button>
      </div>
    </div>
  );
}

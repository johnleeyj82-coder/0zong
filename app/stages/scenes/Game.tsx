"use client";
// 게임: the left monitor becomes an old CRT. It powers on from a single bright line, shows a title screen with a
// blinking PRESS START, then an RPG menu you drive with ↑↓ and Enter. The description talks in a dialog box.
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { SceneProps } from "../Stage";
import { recordsLabel } from "../Stage";
import { DEMO, pageHref } from "@/lib/client";
import { blip } from "../sfx";

export default function GameScene({ room, reduce, openRecords, close }: SceneProps) {
  const [started, setStarted] = useState(false);
  const [cursor, setCursor] = useState(0);
  const [typed, setTyped] = useState(reduce ? room.desc.length : 0);
  const router = useRouter();
  const screen = useRef<HTMLDivElement>(null);

  const items = [
    { label: "이어하기", run: openRecords },
    { label: "세이브 파일 열기", run: () => (DEMO ? location.assign(pageHref("game")) : router.push(pageHref("game"))) },
    { label: "방으로 나가기", run: close },
  ];

  useEffect(() => { if (!reduce) { const t = setTimeout(() => blip(220, 0.25, "sawtooth"), 100); return () => clearTimeout(t); } }, [reduce]);

  // The dialog box types itself once the menu is up.
  useEffect(() => {
    if (!started || typed >= room.desc.length) return;
    const t = setTimeout(() => { setTyped((n) => n + 1); if (typed % 3 === 0) blip(1200, 0.02); }, 32);
    return () => clearTimeout(t);
  }, [started, typed, room.desc.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!started && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); start(); return; }
      if (!started) return;
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        setCursor((c) => (c + (e.key === "ArrowDown" ? 1 : items.length - 1)) % items.length);
        blip(660, 0.04);
      }
      if (e.key === "Enter") { e.preventDefault(); blip(990, 0.08); items[cursor].run(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const start = () => { setStarted(true); blip(523, 0.08); setTimeout(() => blip(784, 0.12), 90); screen.current?.focus(); };

  return (
    <div className="crt-root">
      <div ref={screen} className="crt" data-reduce={reduce || undefined} tabIndex={-1}>
        <div className="crt-inner">
          {!started ? (
            <button className="crt-title-screen" onClick={start}>
              <span className="crt-logo">0ZONG<br />QUEST</span>
              <span className="crt-sub">{room.label} · {room.title}</span>
              <span className="crt-press">PRESS START</span>
            </button>
          ) : (
            <div className="crt-game">
              <ul className="crt-menu" role="menu" aria-label="게임 메뉴">
                {items.map((it, i) => (
                  <li key={it.label} role="none">
                    <button role="menuitem" data-on={cursor === i || undefined} onMouseEnter={() => setCursor(i)}
                      onClick={() => { blip(990, 0.08); it.run(); }}>{it.label === "이어하기" ? `${it.label} (${recordsLabel("game")})` : it.label}</button>
                  </li>
                ))}
              </ul>
              <div className="crt-dialog">
                <p>{room.desc.slice(0, typed)}<span className="crt-caret" aria-hidden>{typed >= room.desc.length ? "▼" : "_"}</span></p>
                <small>{room.update}</small>
              </div>
            </div>
          )}
        </div>
        <div className="crt-scan" aria-hidden />
      </div>
      <p className="crt-help" aria-hidden>{started ? "↑ ↓ 고르기 · Enter 결정" : "Enter 또는 클릭"}</p>
    </div>
  );
}

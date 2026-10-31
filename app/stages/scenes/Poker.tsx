"use client";
// 포커: green felt under one hanging lamp. Five cards are dealt from the deck one by one and turn over into a royal
// flush; each lands with a soft snap. Click a card to peek at its back, click the chips to bet (and hear them).
import { useEffect, useState } from "react";
import type { SceneProps } from "../Stage";
import { recordsLabel } from "../Stage";
import { clack, thud } from "../sfx";

const HAND = [["A", "♠"], ["K", "♠"], ["Q", "♠"], ["J", "♠"], ["10", "♠"]] as const;

export default function PokerScene({ room, reduce, openRecords }: SceneProps) {
  const [dealt, setDealt] = useState(reduce ? 5 : 0);
  const [down, setDown] = useState<Set<number>>(new Set());
  const [pot, setPot] = useState(0);

  useEffect(() => {
    if (reduce) return;
    const t = HAND.map((_, i) => setTimeout(() => { setDealt(i + 1); clack(0.8); }, 400 + i * 260));
    const done = setTimeout(thud, 400 + 5 * 260 + 500);
    return () => { t.forEach(clearTimeout); clearTimeout(done); };
  }, [reduce]);

  const bet = () => { setPot((p) => p + 100); clack(1.2); setTimeout(() => clack(1.4), 60); };

  return (
    <div className="poker-root">
      <div className="felt">
        <div className="deck" aria-hidden><i /><i /><i /></div>
        <div className="board" aria-label="로열 플러시">
          {HAND.map(([r, s], i) => (
            <button key={i} className="pcard" data-in={i < dealt || undefined} data-down={down.has(i) || undefined}
              style={{ ["--i" as string]: i }} aria-label={`${s === "♠" ? "스페이드" : s} ${r}`}
              onClick={() => { setDown((d) => { const n = new Set(d); if (n.has(i)) n.delete(i); else n.add(i); return n; }); clack(0.9); }}>
              <span className="pcard-face"><b>{r}</b><em>{s}</em><b className="flip">{r}</b></span>
              <span className="pcard-back" />
            </button>
          ))}
        </div>
        <div className="poker-copy">
          <h1 className="poker-title">{room.label}</h1>
          <p className="poker-desc">{room.desc}</p>
        </div>
        <div className="chips">
          <button className="chip-stack" onClick={bet} aria-label="칩 100 걸기">
            {Array.from({ length: 6 }, (_, i) => <i key={i} style={{ ["--i" as string]: i }} />)}
          </button>
          <p className="pot">POT <b>{pot.toLocaleString("ko-KR")}</b><small>{room.update}</small></p>
        </div>
        <button className="dealer" onClick={openRecords}><span>D</span>{recordsLabel("poker")} 앉기</button>
      </div>
    </div>
  );
}

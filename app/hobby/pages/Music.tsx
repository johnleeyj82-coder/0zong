"use client";
// 음악 — 음반 상자. The tracks I uploaded stand in a crate as sleeves, each with a cover made from its own title. Flip
// through them, pull one out and it plays: the record slides out of the sleeve and the level meter starts to move.
import { useMemo, useRef } from "react";
import { animate, stagger, utils } from "animejs";
import { clock } from "@/lib/music";
import { usePlayer } from "../../components/music/PlayerContext";
import { Mixer, Seek, Transport } from "../../components/music/Controls";
import MusicRoom from "../../components/music/MusicRoom";
import { useAnime } from "../anime";

const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
/** A sleeve design from the title alone: two hues and one of four simple layouts. */
function cover(title: string) {
  const h = hash(title), a = h % 360, b = (a + 40 + (h >> 4) % 140) % 360, kind = (h >> 9) % 4;
  const c1 = `hsl(${a} 55% 42%)`, c2 = `hsl(${b} 60% 62%)`, ink = `hsl(${a} 40% 12%)`;
  const art = [
    `radial-gradient(circle at 50% 62%, ${c2} 0 28%, transparent 28.5%), ${c1}`,
    `linear-gradient(${(h >> 3) % 180}deg, ${c1} 0 50%, ${c2} 50%)`,
    `repeating-linear-gradient(${45 + (h % 90)}deg, ${c1} 0 14px, ${c2} 14px 28px)`,
    `conic-gradient(from ${(h % 360)}deg at 30% 70%, ${c1}, ${c2}, ${ink}, ${c1})`,
  ][kind];
  return { art, ink, c2 };
}

export default function MusicPage() {
  const p = usePlayer();
  const root = useRef<HTMLDivElement>(null);
  const sleeves = useMemo(() => p.tracks.map((t) => ({ t, ...cover(t.title) })), [p.tracks]);
  const now = p.current ? cover(p.current.title) : null;

  useAnime(root, () => {
    animate(".sleeve", { y: [80, 0], opacity: [0, 1], rotate: [() => utils.random(-8, 8), 0], duration: 900, delay: stagger(70), ease: "outExpo" });
  }, [p.tracks.length]);

  // While something plays, the record sits half out of the sleeve and the meter dances.
  useAnime(root, () => {
    if (!p.playing) return;
    animate(".deck-disc", { x: ["0%", "38%"], duration: 700, ease: "outExpo" });
    animate(".meter i", { scaleY: () => [0.15, utils.random(0.35, 1)], duration: () => utils.random(240, 520), alternate: true, loop: true, ease: "inOutSine", delay: stagger(40) });
  }, [p.playing, p.current?.id]);

  return (
    <div ref={root} className="mu-page">
      <header className="mu-head">
        <h1>음반 상자</h1>
        <p>직접 올린 곡을 꺼내 듣는 곳이에요. 다른 방으로 가도 음악은 따라와요.</p>
      </header>

      <section className="deck" aria-label="지금 걸린 판">
        <div className="deck-sleeve" style={{ background: now?.art ?? "#2a211a" }}>
          <div className="deck-disc" data-spin={p.playing || undefined}><i style={{ background: now?.c2 ?? "#e9b872" }} /></div>
          <span>{p.current?.title ?? "0zong"}</span>
        </div>
        <div className="deck-info">
          <small>{p.playing ? "NOW PLAYING" : p.current ? "PAUSED" : "SIDE A"}</small>
          <h2>{p.current?.title ?? "판을 하나 골라 보세요"}</h2>
          {p.current?.artist && <p>{p.current.artist}</p>}
          <div className="meter" aria-hidden>{Array.from({ length: 28 }, (_, i) => <i key={i} />)}</div>
          {p.current && <Seek id="mu-seek" />}
          <div className="deck-transport"><Transport size={20} /></div>
        </div>
      </section>

      <section aria-label="음반 상자">
        {!p.tracks.length && <p className="mu-empty">아직 올린 곡이 없어요. 방 주인이 곡을 올리면 상자에 음반이 꽂혀요.</p>}
        <ol className="crate">
          {sleeves.map(({ t, art, ink }, i) => (
            <li key={t.id}>
              <button className="sleeve" aria-pressed={p.current?.id === t.id} onClick={() => p.play(t.id)} style={{ background: art, color: ink }}>
                <span className="sleeve-no">{String(i + 1).padStart(2, "0")}</span>
                <b>{t.title}</b>
                <small>{t.artist || "0zong"} · {clock(t.duration)}</small>
              </button>
            </li>
          ))}
        </ol>
      </section>

      <section className="mu-counter" aria-label="소리 조절과 곡 관리">
        <h2>카운터</h2>
        <Mixer prefix="mu" />
        <div className="drawer-body"><MusicRoom /></div>
      </section>
    </div>
  );
}

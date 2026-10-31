"use client";
// 음악: the room goes dark and a record the size of the screen turns. It spins only while the site's player is playing;
// the tonearm drops on entry. Drag the record to scratch it, press the label to play or pause.
import { useEffect, useRef } from "react";
import type { SceneProps } from "../Stage";
import { recordsLabel } from "../Stage";
import { usePlayer } from "../../components/music/PlayerContext";
import { clack, thud } from "../sfx";

const hue = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 17);

export default function MusicScene({ room, reduce, openRecords }: SceneProps) {
  const { current, playing, toggle, tracks } = usePlayer();
  const disc = useRef<HTMLDivElement>(null);
  const spin = useRef({ angle: 0, vel: 0, drag: false, last: 0 });

  // One rAF loop owns the rotation: steady 33⅓ rpm while playing, inertia after a scratch, friction otherwise.
  useEffect(() => {
    let raf = 0, prev = performance.now();
    const rpm = 200; // degrees per second, a little faster than real 33⅓ so it reads on screen
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - prev) / 1000); prev = now;
      const s = spin.current;
      if (!s.drag) {
        const target = playing && !reduce ? rpm : 0;
        s.vel += (target - s.vel) * Math.min(1, dt * 2.5);
        s.angle += s.vel * dt;
      }
      if (disc.current) disc.current.style.transform = `rotate(${s.angle}deg)`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [playing, reduce]);

  useEffect(() => {
    const el = disc.current!;
    const center = () => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };
    const ang = (e: PointerEvent) => { const c = center(); return (Math.atan2(e.clientY - c.y, e.clientX - c.x) * 180) / Math.PI; };
    let tick = 0;
    const down = (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest(".vinyl-label")) return;
      el.setPointerCapture(e.pointerId);
      spin.current.drag = true; spin.current.last = ang(e);
    };
    const move = (e: PointerEvent) => {
      const s = spin.current;
      if (!s.drag) return;
      let d = ang(e) - s.last;
      if (d > 180) d -= 360; if (d < -180) d += 360;
      s.angle += d; s.vel = d * 60; s.last = ang(e);
      tick += Math.abs(d);
      if (tick > 18) { clack(0.4 + Math.random() * 0.4); tick = 0; }
    };
    const up = () => { spin.current.drag = false; };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    return () => { el.removeEventListener("pointerdown", down); el.removeEventListener("pointermove", move); el.removeEventListener("pointerup", up); };
  }, []);

  useEffect(() => { if (!reduce) { const t = setTimeout(thud, 700); return () => clearTimeout(t); } }, [reduce]);

  const h = hue(current?.title ?? room.title);
  return (
    <div className="music-root" data-playing={playing || undefined} style={{ ["--lh" as string]: `${h}` }}>
      <div className="music-copy">
        <h1 className="music-title">{room.label}</h1>
        <p className="music-desc">{room.desc}</p>
        <p className="music-now">
          {current ? <>지금 걸린 판 <b>{current.title}</b>{current.artist && <span> {current.artist}</span>}</> : tracks.length ? "판을 골라 바늘을 올려 보세요." : "아직 올린 곡이 없어요."}
        </p>
        <button className="music-cta" onClick={openRecords}>{recordsLabel("music")}</button>
      </div>
      <div className="vinyl-wrap" data-reduce={reduce || undefined}>
        <div ref={disc} className="vinyl" aria-label="레코드판. 끌어서 긁을 수 있어요.">
          <button className="vinyl-label" onClick={toggle} aria-label={playing ? "일시정지" : "재생"}>
            <span>{current?.title ?? "0zong"}</span>
            <small>{playing ? "33⅓ RPM" : "SIDE A"}</small>
          </button>
        </div>
        <div className="tonearm" aria-hidden><i /></div>
      </div>
    </div>
  );
}

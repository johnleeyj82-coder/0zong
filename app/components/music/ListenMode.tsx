"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Maximize2, Minimize2, X } from "lucide-react";
import { DEMO } from "@/lib/client";
import { usePlayer } from "./PlayerContext";
import { Mixer, Seek, TimerMenu, Transport } from "./Controls";

// The wide shot of the room. Window and lamps are given as fractions of the 1280×720 frame.
const SCENE = `${DEMO ? "" : "/"}room/main.jpg`;
const FW = 1280, FH = 720;
const WINDOW = { x: 0.448, y: 0.09, w: 0.207, h: 0.368 };
const LAMPS = [{ x: 0.628, y: 0.4, r: 0.11 }, { x: 0.99, y: 0.53, r: 0.12 }, { x: 0.11, y: 0.46, r: 0.07 }];
const IDLE_MS = 3000;

type Drop = { x: number; y: number; len: number; v: number };

/** Full-screen "listening" scene: rain in the window, breathing lamps, a slow drift, controls that fade when idle. */
export default function ListenMode() {
  const { listen, setListen } = usePlayer();
  return <AnimatePresence>{listen && <Scene key="listen" onClose={() => setListen(false)} />}</AnimatePresence>;
}

function Scene({ onClose }: { onClose: () => void }) {
  const p = usePlayer();
  const sceneRef = useRef(p.scene);
  sceneRef.current = p.scene;
  const wrap = useRef<HTMLDivElement>(null);
  const img = useRef<HTMLDivElement>(null);
  const glow = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [idle, setIdle] = useState(false);
  // Kept in a ref: the setup below must run once per opening, not on every position update (that would reset the idle
  // timer and drop out of full screen).
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const [full, setFull] = useState(false);

  // One rAF loop drives all motion from an accumulated scene time, so changing the speed never jumps.
  useEffect(() => {
    const c = canvas.current!, ctx = c.getContext("2d")!;
    let raf = 0, last = performance.now(), t = 0;
    let geo = { s: 1, dx: 0, dy: 0 }, drops: Drop[] = [];
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2), w = window.innerWidth, h = window.innerHeight;
      c.width = w * dpr; c.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const s = Math.max(w / FW, h / FH) * 1.08; // drift headroom
      geo = { s, dx: (w - FW * s) / 2, dy: (h - FH * s) / 2 };
      for (const el of [img.current, glow.current]) {
        if (el) Object.assign(el.style, { left: `${geo.dx}px`, top: `${geo.dy}px`, width: `${FW * s}px`, height: `${FH * s}px` });
      }
      const ww = WINDOW.w * FW * s, wh = WINDOW.h * FH * s;
      drops = Array.from({ length: Math.round(Math.min(220, ww * wh / 900)) }, () => ({
        x: Math.random() * ww, y: Math.random() * wh, len: 6 + Math.random() * 14 * s, v: 380 + Math.random() * 420,
      }));
    };
    const frame = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000) * sceneRef.current;
      last = now; t += dt;
      // drift: a slow figure-eight of scale and position
      const z = 1 + 0.015 * Math.sin(t / 23), ox = 10 * Math.sin(t / 31), oy = 6 * Math.sin(t / 19);
      const transform = `translate(${ox}px, ${oy}px) scale(${z})`;
      if (img.current) img.current.style.transform = transform;
      if (glow.current) { glow.current.style.transform = transform; glow.current.style.opacity = String(0.55 + 0.25 * Math.sin(t / 2.2) + 0.08 * Math.sin(t * 1.7)); }
      // rain, clipped to the window
      const { s, dx, dy } = geo;
      const wx = dx + WINDOW.x * FW * s, wy = dy + WINDOW.y * FH * s, ww = WINDOW.w * FW * s, wh = WINDOW.h * FH * s;
      ctx.clearRect(0, 0, c.width, c.height);
      ctx.save();
      ctx.translate(ox + window.innerWidth / 2, oy + window.innerHeight / 2); ctx.scale(z, z); ctx.translate(-window.innerWidth / 2, -window.innerHeight / 2);
      ctx.beginPath(); ctx.rect(wx, wy, ww, wh); ctx.clip();
      ctx.strokeStyle = "rgba(196, 210, 235, 0.32)"; ctx.lineWidth = 1;
      ctx.beginPath();
      for (const d of drops) {
        d.y += d.v * dt; d.x += d.v * dt * 0.06;
        if (d.y > wh + d.len) { d.y = -d.len; d.x = Math.random() * ww; }
        if (d.x > ww) d.x -= ww;
        ctx.moveTo(wx + d.x, wy + d.y); ctx.lineTo(wx + d.x - d.len * 0.06, wy + d.y - d.len);
      }
      ctx.stroke();
      ctx.restore();
      raf = requestAnimationFrame(frame);
    };
    resize();
    window.addEventListener("resize", resize);
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);

  // Controls and cursor fade after IDLE_MS without input; any input brings them back.
  useEffect(() => {
    let timer = setTimeout(() => setIdle(true), IDLE_MS);
    const wake = () => { setIdle(false); clearTimeout(timer); timer = setTimeout(() => setIdle(true), IDLE_MS); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !document.fullscreenElement) closeRef.current(); else wake(); };
    const onFs = () => setFull(!!document.fullscreenElement);
    window.addEventListener("pointermove", wake); window.addEventListener("pointerdown", wake); window.addEventListener("keydown", onKey);
    document.addEventListener("fullscreenchange", onFs);
    document.body.style.overflow = "hidden";
    return () => {
      clearTimeout(timer);
      window.removeEventListener("pointermove", wake); window.removeEventListener("pointerdown", wake); window.removeEventListener("keydown", onKey);
      document.removeEventListener("fullscreenchange", onFs);
      document.body.style.overflow = "";
      if (document.fullscreenElement) void document.exitFullscreen();
    };
  }, []);

  const toggleFull = () => (document.fullscreenElement ? document.exitFullscreen() : wrap.current?.requestFullscreen())?.catch(() => {});
  const { current } = p;

  return (
    <motion.div ref={wrap} className="listen" data-idle={idle ? "" : undefined} role="dialog" aria-modal="true" aria-label="듣기 모드"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}>
      <div ref={img} className="listen-img" style={{ backgroundImage: `url(${SCENE})` }} aria-hidden />
      <div ref={glow} className="listen-glow" aria-hidden
        style={{ background: LAMPS.map((l) => `radial-gradient(circle at ${l.x * 100}% ${l.y * 100}%, rgba(255, 190, 110, 0.38), transparent ${l.r * 100}%)`).join(",") }} />
      <canvas ref={canvas} className="listen-rain" aria-hidden />
      <div className="listen-shade" aria-hidden />

      <div className="listen-top">
        <button className="icon-btn" onClick={toggleFull} aria-label={full ? "전체 화면 끄기" : "전체 화면"}>{full ? <Minimize2 size={17} /> : <Maximize2 size={17} />}</button>
        <button className="icon-btn" onClick={onClose} aria-label="듣기 모드 닫기"><X size={19} /></button>
      </div>

      <section className="listen-panel" aria-label="재생 조절">
        <div className="listen-now">
          <div>
            <b>{current?.title ?? "빗소리만 틀어둔 방"}</b>
            <span>{current ? [current.artist, current.credit].filter(Boolean).join(", ") : p.tracks.length ? "곡을 골라 재생해요" : "아직 올린 곡이 없어요. 환경음을 켜고 쉬어가도 돼요."}</span>
          </div>
          <Transport size={20} />
        </div>
        <Seek id="listen-seek" />
        <Mixer prefix="listen" />
        <TimerMenu />
      </section>
    </motion.div>
  );
}

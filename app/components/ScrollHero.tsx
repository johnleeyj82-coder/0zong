"use client";
import { useEffect, useRef, useState } from "react";
import { motion, useMotionValueEvent, useTransform, type MotionValue } from "framer-motion";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { FRAME_COUNT, MARKS, type Room } from "../data";
import { scrollToId, useHero } from "./HeroContext";
import { useRoom } from "./RoomContext";

const FRAME_W = 1280;
const FRAME_H = 720;
const BG = "#15100c";
const EASE = [0.16, 1, 0.3, 1] as const;
const frameSrc = (i: number) => `frames/frame_${String(i + 1).padStart(4, "0")}.jpg`;

type Geom = { scale: number; dx: number; dy: number };

export default function ScrollHero() {
  const { progress, heroRef } = useHero();
  const { phase, rooms, name, mode } = useRoom();
  const TOUR = rooms.filter((r) => r.mark !== undefined);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [geom, setGeom] = useState<Geom>({ scale: 1, dx: 0, dy: 0 });
  const [bar, setBar] = useState(40);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = heroRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let cw = 0, ch = 0;
    let wanted = 0;      // the frame the scroll position asks for right now
    let current = -1;    // the frame last painted from a loaded image (never advanced on a fallback paint)
    let raf = 0;
    const images: HTMLImageElement[] = [];

    /** Paints frame i cover-fit. Returns true only if a loaded image was drawn; false if only the fallback was painted. */
    const draw = (i: number): boolean => {
      const img = images[i];
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, cw, ch);
      if (!img || !img.complete || img.naturalWidth === 0) return false;
      const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
      const w = img.naturalWidth * scale, h = img.naturalHeight * scale;
      ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
      return true;
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cw = canvas.clientWidth; ch = canvas.clientHeight;
      canvas.width = Math.round(cw * dpr); canvas.height = Math.round(ch * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingQuality = "high";
      const scale = Math.max(cw / FRAME_W, ch / FRAME_H);
      setGeom({ scale, dx: (cw - FRAME_W * scale) / 2, dy: (ch - FRAME_H * scale) / 2 });
      setBar(Math.min(ch * 0.06, 44));
      const target = current >= 0 ? current : wanted;
      if (draw(target)) current = target;
    };

    for (let i = 0; i < FRAME_COUNT; i++) {
      const img = new Image();
      img.decoding = "async";
      img.onload = () => {
        if (i === wanted && draw(i)) current = i;
      };
      img.src = frameSrc(i);
      images.push(img);
    }

    const tick = () => {
      const top = container.getBoundingClientRect().top;
      const range = container.offsetHeight - window.innerHeight;
      const p = Math.max(0, Math.min(1, -top / range));
      progress.set(p);
      const target = Math.round(p * (FRAME_COUNT - 1));
      wanted = target;
      if (target !== current && draw(target)) current = target;
      raf = requestAnimationFrame(tick);
    };

    resize();
    window.addEventListener("resize", resize);
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      images.forEach((img) => { img.onload = null; });
    };
  }, [heroRef, progress]);

  /* beat 1: identity block leaves on first scroll */
  const idOpacity = useTransform(progress, [0, 0.05], [1, 0]);
  const idY = useTransform(progress, [0, 0.05], [0, -40]);
  const idEvents = useTransform(idOpacity, (v) => (v > 0.5 ? "auto" : "none"));
  /* letterbox bars come in during the tour and leave for the hub shot */
  const barH = useTransform(progress, [0, 0.06, 0.95, 0.985], [0, bar, bar, 0]);
  /* closing beat holds through the end */
  const closeBackdrop = useTransform(progress, [0.95, 0.985], [0, 1]);
  const closeOpacity = useTransform(progress, [0.962, 0.99], [0, 1]);
  const closeY = useTransform(progress, [0.962, 0.99], [36, 0]);
  const closeEvents = useTransform(closeOpacity, (v) => (v > 0.6 ? "auto" : "none"));

  return (
    <div ref={heroRef} className="hero" style={{ height: "1400vh" }}>
      <div className="hero-sticky" data-phase={phase}>
        <canvas ref={canvasRef} className="hero-canvas" aria-label="밤의 방을 카메라가 천천히 훑는 장면" role="img" />
        <div className="vignette" />
        <div className="grain" />
        {/* the overlay never waits on image loading: each beat's visibility comes only from scroll progress */}
        <div className="hero-overlay">
          <motion.div className="letterbox" style={{ top: 0, height: barH }} />
          <motion.div className="letterbox" style={{ bottom: 0, height: barH }} />

          {TOUR.map((room, i) => (
            <Beat key={room.key} room={room} n={i + 1} total={TOUR.length} progress={progress} geom={geom} />
          ))}

          {phase === "done" && (
          <motion.div className="identity" style={{ opacity: idOpacity, y: idY, pointerEvents: idEvents }}>
            <motion.span className="label" initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.05, ease: EASE }}>
              {mode === "named" && name ? `Welcome · ${name}님` : "Room 0 · 비 오는 밤"}
            </motion.span>
            <motion.h1 className="display" initial={{ opacity: 0, y: 56 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.3, delay: 0.2, ease: EASE }}>
              0zong의 방
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 36 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.1, delay: 0.4, ease: EASE }}>
              게임, 보안 공부, 포커, 소설, 영화, 음악, 그림까지. 좋아하는 것들을 전부 이 방 하나에 모아뒀어요.
              스크롤하면 하나씩 보여드릴게요.
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.55, ease: EASE }}>
              <button className="btn" onClick={() => window.scrollBy({ top: window.innerHeight * 1.2, behavior: "smooth" })}>
                방 둘러보기 <ArrowDown size={16} aria-hidden />
              </button>
            </motion.div>
          </motion.div>
          )}

          <motion.div className="closing-backdrop" style={{ opacity: closeBackdrop }} />
          <motion.div className="closing" style={{ opacity: closeOpacity, y: closeY, pointerEvents: closeEvents }}>
            <span className="label">The whole room · 전체 보기</span>
            <h2 className="display">이 방이 곧 나예요.</h2>
            <motion.button className="btn" whileHover={{ scale: 1.04, backgroundColor: "#f3cc8e" }} whileTap={{ scale: 0.98 }}
              onClick={() => scrollToId("rooms")}>
              기록 전부 보기
            </motion.button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

/** One object in the tour: a glowing frame around it in the footage, plus its caption card. */
function Beat({ room, n, total, progress, geom }: {
  room: Room; n: number; total: number; progress: MotionValue<number>; geom: Geom;
}) {
  const m = MARKS[room.mark!];
  const opacity = useTransform(progress, [m - 0.04, m - 0.018, m + 0.024, m + 0.044], [0, 1, 1, 0]);
  const x = useTransform(progress, [m - 0.04, m - 0.018, m + 0.024, m + 0.044], [40, 0, 0, -16]);
  const frameOpacity = useTransform(progress, [m - 0.02, m - 0.008, m + 0.016, m + 0.03], [0, 1, 1, 0]);
  const events = useTransform(opacity, (v) => (v > 0.6 ? "auto" : "none"));
  const { track, openDrawer } = useRoom();
  const seen = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // A room counts as "viewed" once its caption has been fully visible for 1.2s (once per visit).
  useMotionValueEvent(opacity, "change", (v) => {
    if (seen.current) return;
    if (v > 0.9 && !timer.current) timer.current = setTimeout(() => { seen.current = true; track("view", room.key); }, 1200);
    if (v <= 0.9 && timer.current) { clearTimeout(timer.current); timer.current = null; }
  });
  const Icon = room.icon;
  const [rx, ry, rw, rh] = room.rect!;
  const s = geom.scale;
  return (
    <>
      <motion.div className="focus-frame" aria-hidden
        style={{ opacity: frameOpacity, left: geom.dx + rx * FRAME_W * s, top: geom.dy + ry * FRAME_H * s, width: rw * FRAME_W * s, height: rh * FRAME_H * s }}>
        <i /><i /><i /><i />
      </motion.div>
      <div className="caption-pos">
        <motion.section className="caption" style={{ opacity, x, pointerEvents: events }} aria-label={room.title}>
          <div className="caption-head">
            <span className="icon-disc"><Icon size={20} aria-hidden /></span>
            <div>
              <div className="count">{String(n).padStart(2, "0")} / {String(total).padStart(2, "0")}</div>
              <h2>{room.title}</h2>
            </div>
          </div>
          <p>{room.desc}</p>
          <div className="update">{room.update}</div>
          <button className="caption-open" onClick={() => openDrawer(room.key)}>열어보기 <ArrowUpRight size={15} aria-hidden /></button>
        </motion.section>
      </div>
    </>
  );
}

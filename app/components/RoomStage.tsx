"use client";
import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { ROOMS, spaceLabel } from "../data";
import { DEMO } from "@/lib/client";
import { HOUSE } from "../scene/spaces";
import { useRoom } from "./RoomContext";
import { useScene } from "./SceneContext";
import { SpeechBubble } from "./Bubble";

// three.js is only loaded here, in the browser, on "/".
const House = dynamic(() => import("../scene/House"), { ssr: false, loading: () => <p className="stage-loading">방을 불러오는 중이에요…</p> });

/** The whole screen: the 3D house (or a still photo when 3D is off), the dark blink between rooms, and the hover label. */
export default function RoomStage() {
  const { phase } = useRoom();
  const { quality, dark, space } = useScene();
  return (
    <div className="stage" data-phase={phase}>
      {quality === "off" ? (
        <div className="stage-still">
          <img src={`${DEMO ? "" : "/"}room/main.jpg`} alt="밤의 방: 포커 테이블, 듀얼 모니터 책상, 비 오는 창" />
          <p className="stage-note">3D를 끈 화면이에요. {spaceLabel(space)}의 물건은 아래 독에서 열 수 있어요.</p>
        </div>
      ) : quality ? (
        <>
          <House quality={quality} />
          <SpeechBubble />
        </>
      ) : null}
      <div className="vignette" />
      <div className="stage-dark" data-on={dark || undefined} aria-hidden />
      <HoverLabel />
      <ObjectList />
    </div>
  );
}

/** Follows the pointer with the name of whatever is lit up under it. Written to the DOM directly, not through state. */
function HoverLabel() {
  const { hover } = useScene();
  const el = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const move = (e: PointerEvent) => { if (el.current) el.current.style.transform = `translate(${e.clientX + 14}px, ${e.clientY + 14}px)`; };
    window.addEventListener("pointermove", move);
    return () => window.removeEventListener("pointermove", move);
  }, []);
  return <div ref={el} className="hover-label" data-on={hover ? "" : undefined} aria-hidden>{hover?.label}</div>;
}

/**
 * Keyboard and screen-reader access to the 3D objects: a list of buttons that stays hidden until it gets focus.
 * Focusing a button lights its object up, the same as hovering it.
 */
function ObjectList() {
  const { space, select, go, setHover } = useScene();
  const s = HOUSE[space];
  const items = [
    ...s.things.filter((t) => t.hobby || t.action).map((t) => ({
      id: t.key,
      label: t.label ?? ROOMS.find((r) => r.key === t.hobby)!.label,
      run: () => select(t.hobby ?? "bed"),
    })),
    ...s.doors.map((d) => ({ id: d.id, label: d.label, run: () => go(d.to) })),
  ];
  return (
    <nav className="object-list" aria-label={`${spaceLabel(space)}의 물건과 문`}>
      {items.map((i) => (
        <button key={i.id} onClick={i.run} onFocus={() => setHover({ id: i.id, label: i.label })} onBlur={() => setHover(null)}>{i.label}</button>
      ))}
    </nav>
  );
}

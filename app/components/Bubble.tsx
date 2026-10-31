"use client";
// What the speech bubble over the desk says, in order: the PC helper's category (shared live, or the owner's own),
// then the Steam game being played, then an everyday line for the time of day.
import { CATEGORIES, DOING } from "@/lib/activity";
import type { TimeOfDay } from "@/lib/env";
import { isOwnerActivity } from "@/lib/client";
import { useActivity } from "./ActivityContext";
import { useScene } from "./SceneContext";
import { useRoom } from "./RoomContext";

const USUAL: Record<TimeOfDay, string> = {
  dawn: "아직 자고 있을지도 몰라요.",
  morning: "커피 내리는 시간이에요.",
  day: "오늘 할 일 하는 중이에요.",
  sunset: "슬슬 불 켤 시간이에요.",
  night: "늦게까지 불이 켜져 있어요.",
};

/** The DOM element the canvas moves to the bubble's 3D point (set by SpeechBubble, read in House). */
export const bubbleAnchor: { el: HTMLDivElement | null } = { el: null };

export type BubbleLine = { text: string; meta?: string; live: boolean };

export function useBubbleLine(): BubbleLine {
  const { activity, nowPlaying } = useActivity();
  const { time } = useScene();
  if (isOwnerActivity(activity) && activity.now) {
    return { text: `지금 ${DOING[activity.now.category]}이에요`, meta: `${activity.now.app} · 나에게만 보여요`, live: true };
  }
  if (activity?.live) {
    const min = Math.max(1, Math.round((Date.now() - activity.live.at) / 60_000));
    return { text: `${DOING[activity.live.category]}이었어요`, meta: `${min}분 전 · ${CATEGORIES[activity.live.category]}${activity.example ? " · 예시" : ""}`, live: true };
  }
  if (nowPlaying) return { text: `지금 『${nowPlaying.name}』 하는 중이에요`, meta: "Steam", live: true };
  return { text: USUAL[time], live: false };
}

/** The bubble, positioned by the canvas (hidden until a room with a bubble point is drawn). Click → 오늘의 방. */
export function SpeechBubble() {
  const line = useBubbleLine();
  const { setPanel } = useRoom();
  return (
    <div className="bubble-pos" ref={(el) => { bubbleAnchor.el = el; }} style={{ visibility: "hidden" }}>
      <button className="bubble" data-live={line.live || undefined} onClick={() => setPanel("today")} aria-label={`${line.text}. 오늘의 방 열기`}>
        {line.live && <i className="bubble-dot" aria-hidden />}
        <span className="bubble-text">{line.text}</span>
        {line.meta && <small>{line.meta}</small>}
      </button>
    </div>
  );
}

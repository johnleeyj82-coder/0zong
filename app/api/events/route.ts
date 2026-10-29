import { NextResponse } from "next/server";
import { addEvents } from "@/lib/store";
import { isId, ROOM_KEYS, SPACE_IDS } from "@/lib/validate";
import type { EventType, TrackEvent } from "@/lib/types";

const TYPES: EventType[] = ["enter", "view", "dock", "open", "guestbook", "score", "move"];

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  if (!isId(body.visitorId) || !Array.isArray(body.events)) return NextResponse.json({ ok: false }, { status: 400 });
  const events: TrackEvent[] = body.events.slice(0, 100).flatMap((e: Record<string, unknown>) => {
    if (!TYPES.includes(e.type as EventType)) return [];
    const keys = e.type === "move" ? SPACE_IDS : ROOM_KEYS;
    const room = typeof e.room === "string" && keys.includes(e.room) ? e.room : undefined;
    const at = typeof e.at === "number" ? Math.min(e.at, Date.now()) : Date.now();
    const value = typeof e.value === "number" && Number.isFinite(e.value) ? e.value : undefined;
    return [{ type: e.type as EventType, room, at, value }];
  });
  const ok = await addEvents(body.visitorId, events);
  return NextResponse.json({ ok });
}

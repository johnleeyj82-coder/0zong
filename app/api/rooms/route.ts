import { NextResponse } from "next/server";
import { getRoomOverrides, setRoomOverride } from "@/lib/store";
import { isOwner } from "@/lib/auth";
import { clean, ROOM_KEYS } from "@/lib/validate";

export async function GET() {
  return NextResponse.json({ rooms: await getRoomOverrides() });
}

/** Owner only: edit a room's title, description, or latest-update line. */
export async function PUT(req: Request) {
  if (!(await isOwner())) return NextResponse.json({ error: "권한이 없어요." }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  if (!ROOM_KEYS.includes(body.key)) return NextResponse.json({ error: "없는 방이에요." }, { status: 400 });
  const o = await setRoomOverride(body.key, {
    ...(body.title !== undefined && { title: clean(body.title, 30) }),
    ...(body.desc !== undefined && { desc: clean(body.desc, 200) }),
    ...(body.update !== undefined && { update: clean(body.update, 60) }),
  });
  return NextResponse.json({ room: o });
}

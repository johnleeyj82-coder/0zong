import { NextResponse } from "next/server";
import { isOwner } from "@/lib/auth";
import { setGameSettings } from "@/lib/store";
import { refreshPresence } from "../steam-sync";

/** Owner only: turn "now playing" on or off. Off also forgets the last status. */
export async function PUT(req: Request) {
  if (!(await isOwner())) return NextResponse.json({ error: "권한이 없어요." }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  if (typeof b.showPresence !== "boolean") return NextResponse.json({ error: "설정 값을 확인하지 못했어요." }, { status: 400 });
  const settings = await setGameSettings({ showPresence: b.showPresence });
  if (settings.showPresence) await refreshPresence();
  return NextResponse.json({ settings });
}

import { NextResponse } from "next/server";
import { isOwner } from "@/lib/auth";
import { syncSteam } from "../steam-sync";

/** Owner only: refresh from Steam now. */
export async function POST() {
  if (!(await isOwner())) return NextResponse.json({ error: "권한이 없어요." }, { status: 403 });
  const r = await syncSteam();
  return r.ok ? NextResponse.json({ count: r.count }) : NextResponse.json({ error: r.error }, { status: 502 });
}

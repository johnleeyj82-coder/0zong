import { NextResponse } from "next/server";
import { isOwner } from "@/lib/auth";
import { setPublicLive } from "@/lib/store";

/** Owner only: share the live category with visitors (a few minutes late), or stop. */
export async function PUT(req: Request) {
  if (!(await isOwner())) return NextResponse.json({ error: "권한이 없어요." }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  if (typeof body.publicLive !== "boolean") return NextResponse.json({ error: "publicLive가 필요해요." }, { status: 400 });
  return NextResponse.json({ publicLive: await setPublicLive(body.publicLive) });
}

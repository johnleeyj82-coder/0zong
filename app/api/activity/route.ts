import { NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "node:crypto";
import { isOwner } from "@/lib/auth";
import { getActivity, recordPing } from "@/lib/store";
import { ownerView, publicView } from "@/lib/activity-view";
import { isCategory } from "@/lib/activity";
import { clean } from "@/lib/validate";

/** Visitors get categories (and the delayed live category if the owner shares it); the owner gets everything. */
export async function GET() {
  const a = await getActivity();
  return NextResponse.json((await isOwner()) ? { ...ownerView(a), owner: true } : publicView(a));
}

/** The Windows helper: `Authorization: Bearer <token>`, body `{ category, app }`. */
export async function POST(req: Request) {
  const token = /^Bearer (\S{20,200})$/.exec(req.headers.get("authorization") ?? "")?.[1];
  const a = await getActivity();
  if (!token || !a.tokenHash) return NextResponse.json({ error: "도우미 토큰이 없어요." }, { status: 401 });
  const got = createHash("sha256").update(token).digest();
  const want = Buffer.from(a.tokenHash, "hex");
  if (want.length !== got.length || !timingSafeEqual(got, want)) return NextResponse.json({ error: "도우미 토큰이 맞지 않아요." }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  if (!isCategory(body.category)) return NextResponse.json({ error: "없는 분류예요." }, { status: 400 });
  await recordPing(body.category, clean(body.app, 40) || "?");
  return NextResponse.json({ ok: true });
}

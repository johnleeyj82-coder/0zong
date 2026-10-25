import { NextResponse } from "next/server";
import { upsertVisitor } from "@/lib/store";
import { isOwnerName } from "@/lib/auth";
import { clean, isId } from "@/lib/validate";

/** Registers a visitor who chose to leave a name or go anonymous. Visitors who skip never call this. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const id = body.visitorId;
  const mode = body.mode === "anonymous" ? "anonymous" : "named";
  let name = clean(body.name, 20);
  if (!isId(id)) return NextResponse.json({ error: "방문자 정보를 확인하지 못했어요. 새로고침 후 다시 시도해주세요." }, { status: 400 });
  if (mode === "named" && !name) return NextResponse.json({ error: "이름을 입력해주세요." }, { status: 400 });
  if (mode === "named" && isOwnerName(name)) return NextResponse.json({ needsPassword: true });
  if (mode === "anonymous") name = `익명 ${id.replace(/[^0-9]/g, "").slice(-4).padStart(4, "0")}`;
  const v = await upsertVisitor(id, name, mode);
  return NextResponse.json({ name: v.name, mode: v.mode });
}

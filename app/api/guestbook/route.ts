import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { addMessage, listMessages, setMessageHidden } from "@/lib/store";
import { isOwner, isOwnerName } from "@/lib/auth";
import { clean, isId } from "@/lib/validate";

export async function GET() {
  const owner = await isOwner();
  const messages = await listMessages(owner);
  return NextResponse.json({ messages });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const text = clean(body.text, 300);
  const name = clean(body.name, 20) || "익명";
  if (!isId(body.visitorId)) return NextResponse.json({ error: "방문자 정보를 확인하지 못했어요." }, { status: 400 });
  if (!text) return NextResponse.json({ error: "남길 말을 적어주세요." }, { status: 400 });
  if (isOwnerName(name) && !(await isOwner())) return NextResponse.json({ error: "그 이름은 방 주인만 쓸 수 있어요." }, { status: 403 });
  const m = await addMessage({ id: randomUUID(), visitorId: body.visitorId, name, text, at: Date.now() });
  return NextResponse.json({ message: m });
}

/** Owner only: hide or show a message. */
export async function PATCH(req: Request) {
  if (!(await isOwner())) return NextResponse.json({ error: "권한이 없어요." }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const ok = await setMessageHidden(String(body.id), !!body.hidden);
  return NextResponse.json({ ok });
}

import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { isOwner } from "@/lib/auth";
import { getGames, removeSlot, saveSlot } from "@/lib/store";
import { removeImage } from "@/lib/files";
import { parseSlotFields } from "@/lib/validate";

const forbidden = () => NextResponse.json({ error: "권한이 없어요." }, { status: 403 });

/** Owner only: pin a Steam game ({ appid, ... }) or add one by hand ({ title, manualMinutes, ... }). */
export async function POST(req: Request) {
  if (!(await isOwner())) return forbidden();
  const b = await req.json().catch(() => ({}));
  const appid = Number(b.appid);
  const { steam, slots } = await getGames();
  if (b.appid !== undefined) {
    const g = steam?.games.find((x) => x.appid === appid);
    if (!g) return NextResponse.json({ error: "가진 게임 목록에서 찾지 못했어요. Steam에서 다시 가져와 주세요." }, { status: 400 });
    if (slots.some((s) => s.appid === appid)) return NextResponse.json({ error: "이미 슬롯에 걸린 게임이에요." }, { status: 409 });
    b.title ||= g.name;
  }
  const p = parseSlotFields(b);
  if (!p.ok) return NextResponse.json({ error: p.error }, { status: 400 });
  const { manualMinutes, ...fields } = p.fields;
  const slot = await saveSlot({
    id: randomUUID(), addedAt: Date.now(), ...fields,
    ...(b.appid !== undefined ? { kind: "steam" as const, appid } : { kind: "manual" as const, ...(manualMinutes !== undefined && { manualMinutes }) }),
  });
  return NextResponse.json({ slot });
}

/** Owner only: edit status, progress, last spot (and play time for hand-added games). */
export async function PUT(req: Request) {
  if (!(await isOwner())) return forbidden();
  const b = await req.json().catch(() => ({}));
  const cur = (await getGames()).slots.find((s) => s.id === b.id);
  if (!cur) return NextResponse.json({ error: "그 슬롯을 찾지 못했어요." }, { status: 404 });
  const p = parseSlotFields(b);
  if (!p.ok) return NextResponse.json({ error: p.error }, { status: 400 });
  const { manualMinutes, progress, ...fields } = p.fields;
  const slot = await saveSlot({
    id: cur.id, kind: cur.kind, addedAt: cur.addedAt, ...(cur.appid !== undefined && { appid: cur.appid }), ...fields,
    ...(progress !== undefined && { progress }),
    ...(cur.kind === "manual" && manualMinutes !== undefined && { manualMinutes }),
  });
  return NextResponse.json({ slot });
}

/** Owner only: take a slot down, with its notes and their screenshots. */
export async function DELETE(req: Request) {
  if (!(await isOwner())) return forbidden();
  const r = await removeSlot(new URL(req.url).searchParams.get("id") ?? "");
  if (!r.removed) return NextResponse.json({ error: "그 슬롯을 찾지 못했어요." }, { status: 404 });
  await Promise.all(r.orphans.map((s) => removeImage(s.id, s.ext)));
  return NextResponse.json({ ok: true });
}

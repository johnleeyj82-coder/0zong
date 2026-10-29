import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { isOwner } from "@/lib/auth";
import { getGames, removeNote, saveNote } from "@/lib/store";
import { removeImage } from "@/lib/files";
import { parseNote } from "@/lib/validate";

const forbidden = () => NextResponse.json({ error: "권한이 없어요." }, { status: 403 });

/** Checks the slot and screenshots a note points to exist. */
async function check(note: { slotId: string; shots: string[] }) {
  const g = await getGames();
  if (!g.slots.some((s) => s.id === note.slotId)) return "그 게임 슬롯을 찾지 못했어요.";
  if (note.shots.some((id) => !g.shots.some((s) => s.id === id))) return "올린 스크린샷을 찾지 못했어요. 다시 올려주세요.";
  return null;
}

export async function POST(req: Request) {
  if (!(await isOwner())) return forbidden();
  const p = parseNote(await req.json().catch(() => ({})));
  if (!p.ok) return NextResponse.json({ error: p.error }, { status: 400 });
  const bad = await check(p.note);
  if (bad) return NextResponse.json({ error: bad }, { status: 400 });
  const r = await saveNote({ id: randomUUID(), ...p.note });
  return NextResponse.json({ note: r.note });
}

export async function PUT(req: Request) {
  if (!(await isOwner())) return forbidden();
  const b = await req.json().catch(() => ({}));
  if (!(await getGames()).notes.some((n) => n.id === b.id)) return NextResponse.json({ error: "그 메모를 찾지 못했어요." }, { status: 404 });
  const p = parseNote(b);
  if (!p.ok) return NextResponse.json({ error: p.error }, { status: 400 });
  const bad = await check(p.note);
  if (bad) return NextResponse.json({ error: bad }, { status: 400 });
  const r = await saveNote({ id: b.id, ...p.note });
  await Promise.all(r.orphans.map((s) => removeImage(s.id, s.ext)));
  return NextResponse.json({ note: r.note });
}

export async function DELETE(req: Request) {
  if (!(await isOwner())) return forbidden();
  const r = await removeNote(new URL(req.url).searchParams.get("id") ?? "");
  if (!r.removed) return NextResponse.json({ error: "그 메모를 찾지 못했어요." }, { status: 404 });
  await Promise.all(r.orphans.map((s) => removeImage(s.id, s.ext)));
  return NextResponse.json({ ok: true });
}

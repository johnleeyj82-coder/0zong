import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { clearExamples, deleteEntry, listEntries, putEntry } from "@/lib/store";
import { isOwner } from "@/lib/auth";
import { cleanEntry, ROOM_KEYS } from "@/lib/validate";

export async function GET() {
  return NextResponse.json({ entries: await listEntries() });
}

const forbidden = () => NextResponse.json({ error: "권한이 없어요." }, { status: 403 });

/** Owner only: add a record (no id) or replace one (with id). Editing an example turns it into a real record. */
export async function POST(req: Request) {
  if (!(await isOwner())) return forbidden();
  const body = await req.json().catch(() => ({}));
  const r = cleanEntry(body);
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 });
  const id = typeof body.id === "string" && /^[a-zA-Z0-9-]{4,64}$/.test(body.id) ? body.id : randomUUID();
  const entry = await putEntry({ id, ...r.v });
  return NextResponse.json({ entry });
}

/** Owner only: `{ id }` deletes one record; `{ examples: true, room? }` removes the examples. */
export async function DELETE(req: Request) {
  if (!(await isOwner())) return forbidden();
  const body = await req.json().catch(() => ({}));
  if (body.examples) {
    if (body.room !== undefined && !ROOM_KEYS.includes(body.room)) return NextResponse.json({ error: "없는 방이에요." }, { status: 400 });
    return NextResponse.json({ removed: await clearExamples(body.room) });
  }
  return NextResponse.json({ ok: await deleteEntry(String(body.id)) });
}

import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { addTrack, listTracks, removeTrack, reorderTracks, updateTrack } from "@/lib/store";
import { removeAudio, saveAudio, sniffAudio } from "@/lib/files";
import { isOwner } from "@/lib/auth";
import { clean } from "@/lib/validate";
import { MAX_TRACK_BYTES } from "@/lib/music";

const forbidden = () => NextResponse.json({ error: "권한이 없어요." }, { status: 403 });
const tooBig = () => NextResponse.json({ error: "한 곡은 30MB까지 올릴 수 있어요." }, { status: 413 });

export async function GET() {
  return NextResponse.json({ tracks: await listTracks() });
}

/** Owner only: upload one track (multipart: file, title, artist, credit, duration). */
export async function POST(req: Request) {
  if (!(await isOwner())) return forbidden();
  if (Number(req.headers.get("content-length") || 0) > MAX_TRACK_BYTES + 64 * 1024) return tooBig();
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!form || !(file instanceof File)) return NextResponse.json({ error: "올릴 파일을 골라주세요." }, { status: 400 });
  if (file.size > MAX_TRACK_BYTES) return tooBig();
  const data = new Uint8Array(await file.arrayBuffer());
  const kind = sniffAudio(data);
  if (!kind) return NextResponse.json({ error: "mp3, m4a, ogg, wav 음원 파일만 올릴 수 있어요." }, { status: 415 });
  const title = clean(form.get("title"), 80) || clean(file.name.replace(/\.[^.]+$/, ""), 80) || "제목 없음";
  const duration = Math.min(36000, Math.max(0, Number(form.get("duration")) || 0));
  const id = randomUUID();
  await saveAudio(id, kind.ext, data);
  const t = await addTrack({
    id, title, artist: clean(form.get("artist"), 60), credit: clean(form.get("credit"), 160),
    duration: Math.round(duration * 10) / 10, mime: kind.mime, ext: kind.ext, size: data.length, addedAt: Date.now(),
  });
  return NextResponse.json({ track: t });
}

/** Owner only: edit title, artist, credit. */
export async function PUT(req: Request) {
  if (!(await isOwner())) return forbidden();
  const b = await req.json().catch(() => ({}));
  const title = clean(b.title, 80);
  if (!title) return NextResponse.json({ error: "제목을 적어주세요." }, { status: 400 });
  const t = await updateTrack(String(b.id), { title, artist: clean(b.artist, 60), credit: clean(b.credit, 160) });
  return t ? NextResponse.json({ track: t }) : NextResponse.json({ error: "그 곡을 찾지 못했어요." }, { status: 404 });
}

/** Owner only: new play order. */
export async function PATCH(req: Request) {
  if (!(await isOwner())) return forbidden();
  const b = await req.json().catch(() => ({}));
  if (!Array.isArray(b.order) || !b.order.every((x: unknown) => typeof x === "string")) {
    return NextResponse.json({ error: "순서를 확인하지 못했어요." }, { status: 400 });
  }
  return NextResponse.json({ tracks: await reorderTracks(b.order.slice(0, 1000)) });
}

/** Owner only: delete the record and its file. */
export async function DELETE(req: Request) {
  if (!(await isOwner())) return forbidden();
  const t = await removeTrack(new URL(req.url).searchParams.get("id") ?? "");
  if (!t) return NextResponse.json({ error: "그 곡을 찾지 못했어요." }, { status: 404 });
  await removeAudio(t.id, t.ext);
  return NextResponse.json({ ok: true });
}

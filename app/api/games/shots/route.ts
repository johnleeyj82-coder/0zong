import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { isOwner } from "@/lib/auth";
import { addShot } from "@/lib/store";
import { saveImage, sniffImage } from "@/lib/files";
import { MAX_SHOT_BYTES } from "@/lib/games";

const tooBig = () => NextResponse.json({ error: "스크린샷은 한 장에 5MB까지 올릴 수 있어요." }, { status: 413 });

/** Owner only: one screenshot (multipart "file"). Returns its id to put in a note. */
export async function POST(req: Request) {
  if (!(await isOwner())) return NextResponse.json({ error: "권한이 없어요." }, { status: 403 });
  if (Number(req.headers.get("content-length") || 0) > MAX_SHOT_BYTES + 64 * 1024) return tooBig();
  const file = (await req.formData().catch(() => null))?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "올릴 이미지를 골라주세요." }, { status: 400 });
  if (file.size > MAX_SHOT_BYTES) return tooBig();
  const data = new Uint8Array(await file.arrayBuffer());
  const kind = sniffImage(data);
  if (!kind) return NextResponse.json({ error: "jpg, png, webp 이미지만 올릴 수 있어요." }, { status: 415 });
  const id = randomUUID();
  await saveImage(id, kind.ext, data);
  return NextResponse.json({ shot: await addShot({ id, ext: kind.ext, mime: kind.mime, size: data.length }) });
}

import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { listMovies, removeMovie, saveMovie, updateMovie } from "@/lib/store";
import { isOwner } from "@/lib/auth";
import { parseMovie } from "@/lib/validate";

const forbidden = () => NextResponse.json({ error: "권한이 없어요." }, { status: 403 });

export async function GET() {
  return NextResponse.json({ movies: await listMovies() });
}

/** Owner only: add a movie. The server picks the id. */
export async function POST(req: Request) {
  if (!(await isOwner())) return forbidden();
  const p = parseMovie(await req.json().catch(() => ({})));
  if (!p.ok) return NextResponse.json({ error: p.error }, { status: 400 });
  const { id: _ignored, ...movie } = p.movie;
  return NextResponse.json({ movie: await saveMovie({ ...movie, id: randomUUID() }) });
}

/** Owner only: replace an existing movie. */
export async function PUT(req: Request) {
  if (!(await isOwner())) return forbidden();
  const p = parseMovie(await req.json().catch(() => ({})));
  if (!p.ok) return NextResponse.json({ error: p.error }, { status: 400 });
  if (!p.movie.id) return NextResponse.json({ error: "고칠 영화를 찾지 못했어요." }, { status: 400 });
  const m = await updateMovie({ ...p.movie, id: p.movie.id });
  if (!m) return NextResponse.json({ error: "고칠 영화를 찾지 못했어요." }, { status: 404 });
  return NextResponse.json({ movie: m });
}

/** Owner only: delete by ?id=. */
export async function DELETE(req: Request) {
  if (!(await isOwner())) return forbidden();
  const id = new URL(req.url).searchParams.get("id") ?? "";
  const ok = await removeMovie(id);
  return ok ? NextResponse.json({ ok }) : NextResponse.json({ error: "지울 영화를 찾지 못했어요." }, { status: 404 });
}

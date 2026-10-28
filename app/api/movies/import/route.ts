import { NextResponse } from "next/server";
import { importMovies } from "@/lib/store";
import { isOwner } from "@/lib/auth";
import { parseMovie } from "@/lib/validate";
import type { Movie } from "@/lib/movies";

const MAX = 500;

/** Owner only: bulk add movies already converted by fromCinema(). Invalid entries are skipped and counted, ids are kept. */
export async function POST(req: Request) {
  if (!(await isOwner())) return NextResponse.json({ error: "권한이 없어요." }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  if (!Array.isArray(body.movies) || !body.movies.length) return NextResponse.json({ error: "가져올 영화가 없어요." }, { status: 400 });
  if (body.movies.length > MAX) return NextResponse.json({ error: `한 번에 ${MAX}편까지 가져올 수 있어요.` }, { status: 400 });
  const ok: Movie[] = [];
  let skipped = 0;
  for (const raw of body.movies) {
    const p = parseMovie(raw && typeof raw === "object" ? raw : {});
    if (p.ok && p.movie.id) ok.push({ ...p.movie, id: p.movie.id }); else skipped++;
  }
  const r = ok.length ? await importMovies(ok) : { added: 0, updated: 0 };
  return NextResponse.json({ ...r, skipped });
}

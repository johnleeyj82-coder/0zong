import { NextResponse } from "next/server";
import { isOwner } from "@/lib/auth";
import { searchTmdb, tmdbMovie, TmdbError } from "@/lib/tmdb";
import { clean } from "@/lib/validate";

/** Owner only, so nobody else spends the TMDB key. ?q= searches, ?id= fetches one film's details. */
export async function GET(req: Request) {
  if (!(await isOwner())) return NextResponse.json({ error: "권한이 없어요." }, { status: 403 });
  const params = new URL(req.url).searchParams;
  const q = clean(params.get("q"), 80);
  const id = Number(params.get("id"));
  try {
    if (Number.isInteger(id) && id > 0) return NextResponse.json({ movie: await tmdbMovie(id) });
    if (q) return NextResponse.json({ results: await searchTmdb(q) });
    return NextResponse.json({ error: "검색어를 적어주세요." }, { status: 400 });
  } catch (e) {
    if (e instanceof TmdbError) return NextResponse.json({ error: e.message }, { status: e.status });
    throw e;
  }
}

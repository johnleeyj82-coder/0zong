import { NextResponse } from "next/server";
import { isOwner } from "@/lib/auth";
import { getGames } from "@/lib/store";
import { clean } from "@/lib/validate";

/** Owner only: owned Steam games to pin, recently played first, then by play time. ?q= filters by name. */
export async function GET(req: Request) {
  if (!(await isOwner())) return NextResponse.json({ error: "권한이 없어요." }, { status: 403 });
  const q = clean(new URL(req.url).searchParams.get("q"), 60).toLowerCase();
  const { steam, slots } = await getGames();
  const pinned = new Set(slots.map((s) => s.appid));
  const games = (steam?.games ?? [])
    .filter((g) => !q || g.name.toLowerCase().includes(q))
    .sort((a, b) => b.recentMinutes - a.recentMinutes || b.lastPlayed - a.lastPlayed || b.minutes - a.minutes)
    .slice(0, 40)
    .map((g) => ({ ...g, pinned: pinned.has(g.appid) }));
  return NextResponse.json({ games, syncedAt: steam?.syncedAt ?? null, error: steam?.error });
}

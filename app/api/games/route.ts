import { NextResponse } from "next/server";
import { getGames } from "@/lib/store";
import { buildView, EXAMPLE_NOTES, EXAMPLE_SLOTS, STEAM_STALE_MS, type GamesPayload } from "@/lib/games";
import { steamEnabled } from "@/lib/steam";
import { syncSteam } from "./steam-sync";

/** Public view: pinned slots with Steam numbers merged in, and the play notes. Never the full Steam library. */
export async function GET() {
  const g = await getGames();
  // A stale snapshot refreshes in the background; this response uses what is stored.
  if (steamEnabled() && (!g.steam || Date.now() - g.steam.syncedAt > STEAM_STALE_MS)) void syncSteam().catch(() => {});
  const empty = !g.slots.length;
  const body: GamesPayload = {
    slots: buildView(empty ? EXAMPLE_SLOTS : g.slots, empty ? EXAMPLE_NOTES : g.notes, g.steam),
    notes: (empty ? EXAMPLE_NOTES : g.notes).slice().sort((a, b) => b.date.localeCompare(a.date)),
    syncedAt: g.steam?.syncedAt ?? null,
    ...(g.steam?.error && { steamError: g.steam.error }),
  };
  return NextResponse.json(body);
}

import { NextResponse } from "next/server";
import { getGames } from "@/lib/store";
import { buildView, EXAMPLE_NOTES, EXAMPLE_SLOTS, PRESENCE_MAX_AGE_MS, PRESENCE_REFRESH_MS, STEAM_STALE_MS, type GamesPayload } from "@/lib/games";
import { steamEnabled } from "@/lib/steam";
import { refreshPresence, syncSteam } from "./steam-sync";

/** Public view: pinned slots with Steam numbers merged in, and the play notes. Never the full Steam library. */
export async function GET() {
  const g = await getGames();
  // Stale data refreshes in the background; this response uses what is stored.
  if (steamEnabled() && (!g.steam || Date.now() - g.steam.syncedAt > STEAM_STALE_MS)) void syncSteam().catch(() => {});
  const show = g.settings.showPresence && steamEnabled();
  if (show && (!g.presence || Date.now() - g.presence.at > PRESENCE_REFRESH_MS)) void refreshPresence();
  const fresh = show && g.presence?.name && Date.now() - g.presence.at < PRESENCE_MAX_AGE_MS;
  const empty = !g.slots.length;
  const body: GamesPayload = {
    slots: buildView(empty ? EXAMPLE_SLOTS : g.slots, empty ? EXAMPLE_NOTES : g.notes, g.steam, g.details),
    notes: (empty ? EXAMPLE_NOTES : g.notes).slice().sort((a, b) => b.date.localeCompare(a.date)),
    syncedAt: g.steam?.syncedAt ?? null,
    showPresence: g.settings.showPresence,
    ...(g.steam?.error && { steamError: g.steam.error }),
    ...(fresh && { nowPlaying: { name: g.presence!.name!, ...(g.presence!.appid && { appid: g.presence!.appid }) } }),
  };
  return NextResponse.json(body);
}

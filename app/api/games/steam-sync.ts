import { ownedGames, SteamError } from "@/lib/steam";
import { getGames, setSteamSnapshot } from "@/lib/store";

let running: Promise<{ ok: boolean; error?: string; count: number }> | null = null;

/** One Steam refresh at a time. A failure keeps the last good game list and records the error for the owner. */
export function syncSteam() {
  running ??= (async () => {
    try {
      const games = await ownedGames();
      await setSteamSnapshot({ syncedAt: Date.now(), games });
      return { ok: true, count: games.length };
    } catch (e) {
      const error = e instanceof SteamError ? e.message : "Steam에서 가져오지 못했어요.";
      const prev = (await getGames()).steam;
      await setSteamSnapshot({ syncedAt: Date.now(), games: prev?.games ?? [], error });
      return { ok: false, error, count: prev?.games.length ?? 0 };
    } finally {
      running = null;
    }
  })();
  return running;
}

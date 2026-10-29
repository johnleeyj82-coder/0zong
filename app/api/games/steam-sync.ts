import { gameDetails, ownedGames, presence, SteamError } from "@/lib/steam";
import { getGames, setGameDetails, setPresence, setSteamSnapshot } from "@/lib/store";

let running: Promise<{ ok: boolean; error?: string; count: number }> | null = null;

/**
 * One Steam refresh at a time: the owned list, then details for each pinned Steam game, one game after another.
 * A failure keeps the last good game list and records the error for the owner.
 */
export function syncSteam() {
  running ??= (async () => {
    try {
      const games = await ownedGames();
      await setSteamSnapshot({ syncedAt: Date.now(), games });
      for (const s of (await getGames()).slots) if (s.appid !== undefined) await syncDetails(s.appid);
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

/** Achievements, stats and store facts for one game (e.g. right after it is pinned). */
export async function syncDetails(appid: number) {
  await setGameDetails(appid, await gameDetails(appid));
}

let checking: Promise<void> | null = null;
/** Refreshes "now playing" (single flight). Only called when the owner turned it on. */
export function refreshPresence() {
  checking ??= presence().then(setPresence).then(() => {}, () => {}).finally(() => { checking = null; });
  return checking;
}

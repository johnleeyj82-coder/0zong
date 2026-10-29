// Server-only Steam Web API client. The key and the SteamID never leave the server; visitors only ever see the
// snapshot saved in the store. STEAM_API_BASE exists so tests can point at a local stand-in.
import "server-only";
import type { SteamGame } from "./games";

export class SteamError extends Error {}

const key = () => (process.env.STEAM_API_KEY || "").trim();
const id = () => (process.env.STEAM_ID || "").trim();
export const steamEnabled = () => !!key() && /^\d{17}$/.test(id());

type Raw = { appid: number; name?: string; playtime_forever?: number; playtime_2weeks?: number; rtime_last_played?: number };

/** Every owned game with play time. Throws SteamError with a Korean message the owner can act on. */
export async function ownedGames(): Promise<SteamGame[]> {
  if (!steamEnabled()) throw new SteamError("Steam이 연결돼 있지 않아요. .env.local에 STEAM_API_KEY와 17자리 STEAM_ID를 넣어주세요.");
  const url = new URL(`${process.env.STEAM_API_BASE || "https://api.steampowered.com"}/IPlayerService/GetOwnedGames/v1/`);
  for (const [k, v] of Object.entries({ key: key(), steamid: id(), include_appinfo: "1", include_played_free_games: "1", format: "json" })) {
    url.searchParams.set(k, v);
  }
  let r: Response;
  try {
    r = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(10_000) });
  } catch {
    throw new SteamError("Steam에 연결하지 못했어요. 잠시 후 다시 시도해주세요.");
  }
  if (r.status === 401 || r.status === 403) throw new SteamError("Steam 키가 맞지 않아요. .env.local의 STEAM_API_KEY를 확인해주세요.");
  if (!r.ok) throw new SteamError("Steam에 연결하지 못했어요. 잠시 후 다시 시도해주세요.");
  const data = (await r.json().catch(() => ({}))) as { response?: { games?: Raw[] } };
  const games = data.response?.games;
  if (!games) throw new SteamError("Steam 프로필의 '게임 세부 정보'가 비공개라 시간을 가져올 수 없어요. 공개로 바꿔주세요.");
  return games.map((g) => ({
    appid: g.appid, name: g.name || `App ${g.appid}`,
    minutes: g.playtime_forever ?? 0, recentMinutes: g.playtime_2weeks ?? 0, lastPlayed: (g.rtime_last_played ?? 0) * 1000,
  }));
}

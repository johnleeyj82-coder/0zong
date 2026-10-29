// Server-only Steam Web API client. The key and the SteamID never leave the server; visitors only ever see the
// snapshot saved in the store. STEAM_API_BASE / STEAM_STORE_BASE exist so tests can point at a local stand-in.
import "server-only";
import type { Achievement, GameDetails, GameStat, Presence, SteamGame, StoreInfo } from "./games";

export class SteamError extends Error {}

const key = () => (process.env.STEAM_API_KEY || "").trim();
const id = () => (process.env.STEAM_ID || "").trim();
const API = () => process.env.STEAM_API_BASE || "https://api.steampowered.com";
const STORE = () => process.env.STEAM_STORE_BASE || "https://store.steampowered.com";
export const steamEnabled = () => !!key() && /^\d{17}$/.test(id());

/** GET with the key and SteamID filled in. Returns null on any failure: callers decide what an absence means. */
async function get<T>(base: string, path: string, params: Record<string, string>, withKey = true): Promise<{ status: number; data: T | null }> {
  const url = new URL(base + path);
  for (const [k, v] of Object.entries({ ...(withKey && { key: key(), steamid: id() }), ...params, format: "json" })) url.searchParams.set(k, v);
  try {
    const r = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(10_000) });
    return { status: r.status, data: r.ok ? ((await r.json().catch(() => null)) as T | null) : null };
  } catch {
    return { status: 0, data: null };
  }
}

type RawOwned = {
  appid: number; name?: string; playtime_forever?: number; playtime_2weeks?: number; rtime_last_played?: number;
  playtime_windows_forever?: number; playtime_mac_forever?: number; playtime_linux_forever?: number; playtime_deck_forever?: number;
};

/** Every owned game with play time. Throws SteamError with a Korean message the owner can act on. */
export async function ownedGames(): Promise<SteamGame[]> {
  if (!steamEnabled()) throw new SteamError("Steam이 연결돼 있지 않아요. .env.local에 STEAM_API_KEY와 17자리 STEAM_ID를 넣어주세요.");
  const { status, data } = await get<{ response?: { games?: RawOwned[] } }>(API(), "/IPlayerService/GetOwnedGames/v1/",
    { include_appinfo: "1", include_played_free_games: "1" });
  if (status === 401 || status === 403) throw new SteamError("Steam 키가 맞지 않아요. .env.local의 STEAM_API_KEY를 확인해주세요.");
  if (!data) throw new SteamError("Steam에 연결하지 못했어요. 잠시 후 다시 시도해주세요.");
  const games = data.response?.games;
  if (!games) throw new SteamError("Steam 프로필의 '게임 세부 정보'가 비공개라 시간을 가져올 수 없어요. 공개로 바꿔주세요.");
  return games.map((g) => {
    const platforms = Object.fromEntries(
      ([["windows", g.playtime_windows_forever], ["mac", g.playtime_mac_forever], ["linux", g.playtime_linux_forever], ["deck", g.playtime_deck_forever]] as const)
        .filter(([, v]) => typeof v === "number" && v > 0),
    );
    return {
      appid: g.appid, name: g.name || `App ${g.appid}`,
      minutes: g.playtime_forever ?? 0, recentMinutes: g.playtime_2weeks ?? 0, lastPlayed: (g.rtime_last_played ?? 0) * 1000,
      ...(Object.keys(platforms).length && { platforms }),
    };
  });
}

/** Only Steam's own image hosts pass; anything else becomes "" (the UI then shows no icon). */
export function steamImage(u: unknown): string {
  if (typeof u !== "string") return "";
  try {
    const url = new URL(u);
    const ok = url.protocol === "https:" && (url.hostname.endsWith(".steamstatic.com") || url.hostname === "steamcdn-a.akamaihd.net");
    return ok ? url.toString() : "";
  } catch { return ""; }
}

const text = (s: unknown, max: number) =>
  typeof s === "string"
    ? s.replace(/<[^>]*>/g, "").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&")
      .replace(/\s+/g, " ").trim().slice(0, max)
    : "";

type SchemaAch = { name: string; displayName?: string; description?: string; icon?: string; icongray?: string; hidden?: number };
type SchemaStat = { name: string; displayName?: string };

/** Achievements (with names, icons and world rarity), named stats, and store facts for one game. Missing pieces stay missing. */
export async function gameDetails(appid: number): Promise<GameDetails> {
  const app = String(appid);
  const [player, schema, global, stats, store] = await Promise.all([
    get<{ playerstats?: { success?: boolean; achievements?: { apiname: string; achieved: number; unlocktime: number }[] } }>(
      API(), "/ISteamUserStats/GetPlayerAchievements/v1/", { appid: app, l: "koreana" }),
    get<{ game?: { availableGameStats?: { achievements?: SchemaAch[]; stats?: SchemaStat[] } } }>(
      API(), "/ISteamUserStats/GetSchemaForGame/v2/", { appid: app, l: "koreana" }),
    get<{ achievementpercentages?: { achievements?: { name: string; percent: number | string }[] } }>(
      API(), "/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v2/", { gameid: app }, false),
    get<{ playerstats?: { stats?: { name: string; value: number }[] } }>(
      API(), "/ISteamUserStats/GetUserStatsForGame/v2/", { appid: app }),
    get<Record<string, { success?: boolean; data?: { short_description?: string; genres?: { description: string }[]; release_date?: { date?: string }; developers?: string[] } }>>(
      STORE(), "/api/appdetails", { appids: app, l: "korean", cc: "kr" }, false),
  ]);

  const out: GameDetails = { syncedAt: Date.now() };
  const avail = schema.data?.game?.availableGameStats;
  const mine = player.data?.playerstats?.achievements;
  if (avail?.achievements?.length) {
    const got = new Map((mine ?? []).map((a) => [a.apiname, a]));
    const pct = new Map((global.data?.achievementpercentages?.achievements ?? []).map((a) => [a.name, Number(a.percent)]));
    out.achievements = avail.achievements.slice(0, 1000).map((s): Achievement => {
      const p = got.get(s.name), achieved = p?.achieved === 1, hidden = s.hidden === 1;
      const g = pct.get(s.name);
      return {
        id: s.name.slice(0, 120), achieved, unlockedAt: achieved ? (p!.unlocktime || 0) * 1000 : 0, hidden,
        name: hidden && !achieved ? "숨겨진 업적" : text(s.displayName, 120) || s.name,
        desc: hidden && !achieved ? "달성하면 보여요." : text(s.description, 240),
        icon: steamImage(s.icon), iconGray: steamImage(s.icongray),
        ...(Number.isFinite(g) && { globalPct: Math.round(g! * 10) / 10 }),
      };
    });
  }
  const names = new Map((avail?.stats ?? []).filter((s) => s.displayName).map((s) => [s.name, text(s.displayName, 60)]));
  const st = (stats.data?.playerstats?.stats ?? []).filter((s) => names.has(s.name) && Number.isFinite(s.value))
    .slice(0, 8).map((s): GameStat => ({ id: s.name.slice(0, 120), name: names.get(s.name)!, value: s.value }));
  if (st.length) out.stats = st;
  const sd = store.data?.[app];
  if (sd?.success && sd.data) {
    out.store = {
      description: text(sd.data.short_description, 400),
      genres: (sd.data.genres ?? []).map((g) => text(g.description, 20)).filter(Boolean).slice(0, 5),
      released: text(sd.data.release_date?.date, 30),
      developers: (sd.data.developers ?? []).map((d) => text(d, 60)).filter(Boolean).slice(0, 3),
    } satisfies StoreInfo;
  }
  return out;
}

/** What the owner is playing right now (game name only), or nothing. */
export async function presence(): Promise<Presence> {
  const { data } = await get<{ response?: { players?: { gameid?: string; gameextrainfo?: string }[] } }>(
    API(), "/ISteamUser/GetPlayerSummaries/v2/", { key: key(), steamids: id() }, false);
  const p = data?.response?.players?.[0];
  const appid = Number(p?.gameid);
  return { at: Date.now(), ...(p?.gameextrainfo && { name: text(p.gameextrainfo, 80), ...(Number.isInteger(appid) && { appid }) }) };
}

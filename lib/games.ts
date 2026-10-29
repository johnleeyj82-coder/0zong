// Game room records, shared by the server (store, API) and the browser (/game, drawer).
// Steam supplies play time; the owner adds the story: status, progress, where they left off, and dated play notes.

export const STATUSES = { playing: "플레이 중", cleared: "클리어", paused: "쉬는 중", dropped: "접음" } as const;
export type Status = keyof typeof STATUSES;

export type Slot = {
  id: string;
  kind: "steam" | "manual";
  appid?: number;
  title: string;
  status: Status;
  /** 0–100, optional: not every game has a meaningful percentage. */
  progress?: number;
  /** One line such as "엔딩 전" or "2막". */
  progressLabel: string;
  /** Where the owner last saved, e.g. "말레니아 앞 축복". */
  lastSpot: string;
  /** Play time for games outside Steam (minutes). */
  manualMinutes?: number;
  addedAt: number;
  example?: boolean;
};

export type Note = {
  id: string;
  slotId: string;
  /** YYYY-MM-DD */
  date: string;
  /** Hours played that day, optional. */
  hours?: number;
  text: string;
  /** Screenshot ids (served by /api/games/shot/[id]). */
  shots: string[];
  example?: boolean;
};

export type Shot = { id: string; ext: string; mime: string; size: number };

export const PLATFORMS = { windows: "Windows", mac: "Mac", linux: "Linux", deck: "Steam Deck" } as const;
export type Platform = keyof typeof PLATFORMS;

/** One owned game as Steam reports it. Minutes; lastPlayed is ms since epoch (0 = never). */
export type SteamGame = {
  appid: number; name: string; minutes: number; recentMinutes: number; lastPlayed: number;
  /** Minutes per platform (only the ones Steam reports). */
  platforms?: Partial<Record<Platform, number>>;
};
export type SteamSnapshot = { syncedAt: number; games: SteamGame[]; error?: string };

export type Achievement = {
  id: string; name: string; desc: string; icon: string; iconGray: string; hidden: boolean;
  achieved: boolean; /** ms, 0 when locked */ unlockedAt: number; /** share of all players, 0–100 */ globalPct?: number;
};
export type GameStat = { id: string; name: string; value: number };
export type StoreInfo = { description: string; genres: string[]; released: string; developers: string[] };
/** Everything fetched per pinned Steam game. A section is missing when Steam had nothing (or refused) for it. */
export type GameDetails = { syncedAt: number; achievements?: Achievement[]; stats?: GameStat[]; store?: StoreInfo };
export type Presence = { at: number; appid?: number; name?: string };
export type GameSettings = { showPresence: boolean };

/** What visitors see for a slot: the slot plus the numbers merged from Steam or the notes. */
export type GameView = Slot & {
  minutes: number; recentMinutes: number; lastPlayed: number;
  platforms?: Partial<Record<Platform, number>>;
  details?: Omit<GameDetails, "syncedAt">;
  /** Achievement count, when the game has achievements. */
  ach?: { done: number; total: number };
};
export type GamesPayload = {
  slots: GameView[]; notes: Note[]; syncedAt: number | null; steamError?: string;
  /** Only when the owner turned it on and the information is fresh. */
  nowPlaying?: { appid?: number; name: string };
  showPresence?: boolean;
};

export const MAX_SHOT_BYTES = 5 * 1024 * 1024;
export const MAX_SHOTS_PER_NOTE = 4;
export const STEAM_STALE_MS = 6 * 3600_000;
export const PRESENCE_REFRESH_MS = 2 * 60_000;
export const PRESENCE_MAX_AGE_MS = 10 * 60_000;

/** The progress the save screen shows: the owner's number first, otherwise the achievement share. */
export const shownProgress = (v: GameView) =>
  v.progress ?? (v.ach && v.ach.total ? Math.round((v.ach.done / v.ach.total) * 100) : undefined);

/** Play time as a save file shows it: hours:minutes, e.g. 142:20. */
export const playtime = (min: number) => `${Math.floor(min / 60)}:${String(Math.round(min % 60)).padStart(2, "0")}`;

export const steamCover = (appid: number, kind: "portrait" | "header" = "portrait") =>
  `https://cdn.cloudflare.steamstatic.com/steam/apps/${appid}/${kind === "portrait" ? "library_600x900.jpg" : "header.jpg"}`;

/** Merges Steam numbers into the slots and orders them by the most recently played. */
export function buildView(slots: Slot[], notes: Note[], steam?: SteamSnapshot | null, details?: Record<string, GameDetails>): GameView[] {
  const byApp = new Map((steam?.games ?? []).map((g) => [g.appid, g]));
  const lastNote = new Map<string, number>();
  for (const n of notes) lastNote.set(n.slotId, Math.max(lastNote.get(n.slotId) ?? 0, Date.parse(n.date) || 0));
  return slots
    .map((s) => {
      const g = s.appid !== undefined ? byApp.get(s.appid) : undefined;
      const det = s.appid !== undefined ? details?.[s.appid] : undefined;
      const achs = det?.achievements;
      const lastAch = Math.max(0, ...(achs ?? []).map((a) => a.unlockedAt));
      return {
        ...s,
        minutes: g?.minutes ?? s.manualMinutes ?? 0,
        recentMinutes: g?.recentMinutes ?? 0,
        lastPlayed: Math.max(g?.lastPlayed ?? 0, lastNote.get(s.id) ?? 0, lastAch),
        ...(g?.platforms && { platforms: g.platforms }),
        ...(det && { details: { achievements: det.achievements, stats: det.stats, store: det.store } }),
        ...(achs?.length && { ach: { done: achs.filter((a) => a.achieved).length, total: achs.length } }),
      };
    })
    .sort((a, b) => b.lastPlayed - a.lastPlayed || b.addedAt - a.addedAt);
}

/* ---------- examples (shown, labeled 예시, until the owner pins a first slot) ---------- */
const d = (iso: string) => Date.parse(`${iso}T21:00:00`);
export const EXAMPLE_SLOTS: Slot[] = [
  { id: "ex-elden", kind: "steam", appid: 1245620, title: "엘든 링", status: "playing", progress: 80, progressLabel: "엔딩 전",
    lastSpot: "말레니아 앞 축복", manualMinutes: 142 * 60 + 20, addedAt: d("2026-08-01"), example: true },
  { id: "ex-hollow", kind: "steam", appid: 367520, title: "할로우 나이트", status: "cleared", progress: 100, progressLabel: "112%",
    lastSpot: "눈물의 도시", manualMinutes: 61 * 60 + 5, addedAt: d("2026-07-01"), example: true },
  { id: "ex-bg3", kind: "steam", appid: 1086940, title: "발더스 게이트 3", status: "paused", progress: 45, progressLabel: "2막",
    lastSpot: "그림자 저주 땅 입구", manualMinutes: 48 * 60 + 40, addedAt: d("2026-06-01"), example: true },
];
export const EXAMPLE_NOTES: Note[] = [
  { id: "ex-n1", slotId: "ex-elden", date: "2026-10-25", hours: 3, text: "말레니아 클리어. 2페이즈 패턴은 왼쪽으로 크게 구르기.", shots: [], example: true },
  { id: "ex-n2", slotId: "ex-hollow", date: "2026-10-23", hours: 1.5, text: "눈물의 도시 비 내리는 구간. 스크린샷을 남겨두고 싶은 곳.", shots: [], example: true },
  { id: "ex-n3", slotId: "ex-elden", date: "2026-10-20", hours: 2, text: "공략 메모: 호수 남쪽 계단 아래에 숨은 상인이 있어요.", shots: [], example: true },
];

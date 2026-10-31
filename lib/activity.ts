// What the owner is doing on their PC, as the Windows helper reports it (tools/0zong-helper.ps1).
// Only a category ever reaches visitors; the app name is for the owner. Window titles and documents are never read.

export const CATEGORIES = { code: "코딩", game: "게임", design: "디자인", study: "공부", video: "영상", rest: "쉬는 중" } as const;
export type Category = keyof typeof CATEGORIES;
export const CATEGORY_KEYS = Object.keys(CATEGORIES) as Category[];
export const isCategory = (v: unknown): v is Category => typeof v === "string" && v in CATEGORIES;

/** "지금 코딩하는 중이에요" style lines for the speech bubble. */
export const DOING: Record<Category, string> = {
  code: "코딩하는 중", game: "게임하는 중", design: "그림 그리는 중", study: "공부하는 중", video: "영상 보는 중", rest: "쉬는 중",
};

/** Validated categorical order on the dark surface (dataviz palette, slots 1–6). Fixed per category, never by rank. */
export const CATEGORY_COLOR: Record<Category, string> = {
  code: "#3987e5", game: "#d95926", design: "#199e70", study: "#c98500", video: "#d55181", rest: "#008300",
};

/** A ping older than this means the helper stopped (PC off, asleep, or the owner left). */
export const LIVE_MS = 2 * 60_000;
/** Visitors see what was happening this long ago, never the exact present. */
export const PUBLIC_DELAY_MS = 3 * 60_000;
/** A single ping never counts for more than this (the helper sends every 30s). */
export const MAX_CREDIT_MS = 60_000;
export const KEEP_DAYS = 60;

export type Minutes = Partial<Record<Category, number>>;
export type DayMinutes = { date: string; minutes: Minutes };

export type ActivityPublic = {
  /** Last 7 Seoul dates, oldest first, today last. */
  days: DayMinutes[];
  /** Only when the owner turned live sharing on and the helper was active a few minutes ago. */
  live?: { category: Category; at: number };
  example?: boolean;
};

export type ActivityOwner = ActivityPublic & {
  connected: boolean;
  tokenCreatedAt: number | null;
  lastSeen: number | null;
  publicLive: boolean;
  /** The exact present, with the app name. */
  now?: { category: Category; app: string; at: number };
  /** Today's minutes per app. */
  apps: { app: string; category: Category; minutes: number }[];
};

export const totalMinutes = (m: Minutes) => CATEGORY_KEYS.reduce((s, k) => s + (m[k] ?? 0), 0);

/** 125 → "2시간 5분", 40 → "40분". */
export function hm(min: number) {
  const m = Math.round(min);
  if (m < 60) return `${m}분`;
  return m % 60 ? `${Math.floor(m / 60)}시간 ${m % 60}분` : `${m / 60}시간`;
}

/** Shown in the static preview and labeled 예시: there is no helper there. */
export function exampleActivity(dates: string[]): ActivityPublic {
  const rows: Minutes[] = [
    { code: 140, game: 60, study: 45, rest: 30 }, { code: 95, study: 80, video: 40 }, { game: 180, rest: 50 },
    { code: 210, design: 35, study: 30 }, { study: 120, code: 60, video: 30 }, { design: 90, game: 75, rest: 40 },
    { code: 75, study: 40, game: 20 },
  ];
  return { days: dates.map((date, i) => ({ date, minutes: rows[i % rows.length] })), live: { category: "code", at: Date.now() - PUBLIC_DELAY_MS }, example: true };
}

/** The last 7 Seoul dates, oldest first. */
export const lastWeek = (now: number, toDate: (ms: number) => string) =>
  Array.from({ length: 7 }, (_, i) => toDate(now - (6 - i) * 86_400_000));

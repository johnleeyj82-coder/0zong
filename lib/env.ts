// Seoul time and weather for the 3D room, shared by /api/env and the browser.
// Weather comes from Open-Meteo (no key). The owner can pin a weather for everyone; the bed changes the time for one viewer only.

export const WEATHERS = { clear: "맑음", cloudy: "흐림", rain: "비", storm: "폭우", snow: "눈" } as const;
export type Weather = keyof typeof WEATHERS;
export type EnvOverride = "auto" | Weather;
export const isOverride = (v: unknown): v is EnvOverride => v === "auto" || (typeof v === "string" && v in WEATHERS);

export const TIMES = { dawn: "새벽", morning: "아침", day: "낮", sunset: "노을", night: "밤" } as const;
export type TimeOfDay = keyof typeof TIMES;
/** "밤으로", "노을로": the particle depends on the last syllable. */
export const timeWithRo = (t: TimeOfDay) => `${TIMES[t]}${t === "sunset" ? "로" : "으로"}`;
export const isTime = (v: unknown): v is TimeOfDay => typeof v === "string" && v in TIMES;

export type EnvPayload = {
  weather: Weather;
  /** °C, null when the forecast could not be fetched. */
  temp: number | null;
  /** ms since epoch, for today in Seoul. */
  sunrise: number;
  sunset: number;
  source: "live" | "owner" | "fallback";
  override: EnvOverride;
};

export const SEOUL = { lat: 37.5665, lon: 126.978 };
export const ENV_CACHE_MS = 30 * 60_000;

export const openMeteoUrl = (base = "https://api.open-meteo.com") =>
  `${base}/v1/forecast?latitude=${SEOUL.lat}&longitude=${SEOUL.lon}&current=weather_code,temperature_2m` +
  `&daily=sunrise,sunset&timezone=Asia%2FSeoul&forecast_days=1`;

/** WMO weather codes as Open-Meteo reports them. */
export function weatherFromCode(c: number): Weather {
  if (c >= 95) return "storm";
  if ((c >= 71 && c <= 77) || c === 85 || c === 86) return "snow";
  if ((c >= 51 && c <= 67) || (c >= 80 && c <= 82)) return "rain";
  if (c >= 2) return "cloudy";
  return "clear";
}

// Open-Meteo gives local times without an offset ("2026-10-29T06:52"); Seoul has no daylight saving.
const seoulIso = (s: unknown) => (typeof s === "string" ? Date.parse(`${s}:00+09:00`) : NaN);

export type Live = { weather: Weather; temp: number | null; sunrise: number; sunset: number };

export function parseOpenMeteo(j: unknown): Live | null {
  const o = j as { current?: { weather_code?: unknown; temperature_2m?: unknown }; daily?: { sunrise?: unknown[]; sunset?: unknown[] } };
  const code = o?.current?.weather_code;
  if (typeof code !== "number") return null;
  const temp = typeof o.current?.temperature_2m === "number" ? Math.round(o.current.temperature_2m) : null;
  const sunrise = seoulIso(o.daily?.sunrise?.[0]);
  const sunset = seoulIso(o.daily?.sunset?.[0]);
  const sun = Number.isFinite(sunrise) && Number.isFinite(sunset) ? { sunrise, sunset } : fallbackSun(Date.now());
  return { weather: weatherFromCode(code), temp, ...sun };
}

/** "2026-10-29" in Seoul. */
export const seoulDate = (now: number) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(now);

/** A typical sunrise and sunset, used when the forecast is unavailable. */
export const fallbackSun = (now: number) => {
  const d = seoulDate(now);
  return { sunrise: Date.parse(`${d}T06:40:00+09:00`), sunset: Date.parse(`${d}T18:00:00+09:00`) };
};

/** Minutes since midnight in Seoul. */
const seoulMinutes = (ms: number) => Math.floor(((ms + 9 * 3600_000) % 86_400_000) / 60_000);

export function timeOfDay(now: number, sunrise: number, sunset: number): TimeOfDay {
  const m = seoulMinutes(now), r = seoulMinutes(sunrise), s = seoulMinutes(sunset);
  if (m >= r - 60 && m < r + 30) return "dawn";
  if (m >= r + 30 && m < r + 180) return "morning";
  if (m >= r + 180 && m < s - 60) return "day";
  if (m >= s - 60 && m < s + 30) return "sunset";
  return "night";
}

/** "21:40" in Seoul. */
export const seoulClock = (now: number) =>
  new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(now);

/** Puts the owner's pinned weather over the live (or fallback) reading. */
export function compose(live: Live | null, override: EnvOverride, now = Date.now()): EnvPayload {
  const base = live ?? { weather: "clear" as Weather, temp: null, ...fallbackSun(now) };
  if (override !== "auto") return { ...base, weather: override, source: "owner", override };
  return { ...base, source: live ? "live" : "fallback", override };
}

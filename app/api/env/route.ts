import { NextResponse } from "next/server";
import { isOwner } from "@/lib/auth";
import { getEnvOverride, setEnvOverride } from "@/lib/store";
import { compose, ENV_CACHE_MS, isOverride, openMeteoUrl, parseOpenMeteo, type Live } from "@/lib/env";

// One forecast per 30 minutes for the whole site, whoever asks. A failed fetch is retried after 5 minutes.
let cache: { at: number; ttl: number; live: Live | null } | null = null;

async function live(): Promise<Live | null> {
  if (cache && Date.now() - cache.at < cache.ttl) return cache.live;
  let got: Live | null = null;
  try {
    const r = await fetch(openMeteoUrl(process.env.OPEN_METEO_BASE), { signal: AbortSignal.timeout(4000), cache: "no-store" });
    if (r.ok) got = parseOpenMeteo(await r.json());
  } catch { /* offline or slow: fall back below */ }
  cache = { at: Date.now(), ttl: got ? ENV_CACHE_MS : 5 * 60_000, live: got ?? cache?.live ?? null };
  return cache.live;
}

export async function GET() {
  // The weather must not take the room down with it: an unreadable store just means no pinned weather.
  const override = await getEnvOverride().catch(() => "auto" as const);
  return NextResponse.json(compose(await live(), override));
}

/** Owner only: pin a weather for everyone ("auto" follows Seoul again). */
export async function PUT(req: Request) {
  if (!(await isOwner())) return NextResponse.json({ error: "권한이 없어요." }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  if (!isOverride(body.override)) return NextResponse.json({ error: "없는 날씨예요." }, { status: 400 });
  return NextResponse.json(compose(await live(), await setEnvOverride(body.override)));
}

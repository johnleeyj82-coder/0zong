// Turns the stored activity record into what a visitor or the owner may see.
import "server-only";
import { seoulDate } from "./env";
import { LIVE_MS, PUBLIC_DELAY_MS, lastWeek, type ActivityOwner, type ActivityPublic, type Category } from "./activity";
import type { ActivityRecord } from "./types";

export function publicView(a: ActivityRecord, now = Date.now()): ActivityPublic {
  const days = lastWeek(now, seoulDate).map((date) => ({ date, minutes: a.days[date] ?? {} }));
  let live: ActivityPublic["live"];
  if (a.publicLive && a.tokenHash) {
    // What was happening PUBLIC_DELAY_MS ago, if the helper was active then.
    const then = now - PUBLIC_DELAY_MS;
    const hit = [...(a.recent ?? [])].reverse().find((r) => r.at <= then && then - r.at < LIVE_MS);
    if (hit) live = { category: hit.category, at: hit.at };
  }
  return { days, ...(live && { live }) };
}

export function ownerView(a: ActivityRecord, now = Date.now()): ActivityOwner {
  const fresh = a.status && now - a.status.at < LIVE_MS ? a.status : undefined;
  const apps = Object.entries(a.apps[seoulDate(now)] ?? {})
    .map(([app, r]) => ({ app, category: r.category as Category, minutes: r.minutes }))
    .sort((x, y) => y.minutes - x.minutes);
  return {
    ...publicView(a, now),
    connected: !!a.tokenHash,
    tokenCreatedAt: a.tokenCreatedAt ?? null,
    lastSeen: a.status?.at ?? null,
    publicLive: !!a.publicLive,
    ...(fresh && { now: fresh }),
    apps,
  };
}

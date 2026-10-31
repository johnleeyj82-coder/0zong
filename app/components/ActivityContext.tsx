"use client";
// PC activity from the Windows helper and Steam's "now playing", polled for the speech bubble and 오늘의 방.
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { getActivity, getGames, type ActivityPayload } from "@/lib/client";
import type { GamesPayload } from "@/lib/games";
import { useRoom } from "./RoomContext";

type Ctx = {
  activity: ActivityPayload | null;
  nowPlaying: GamesPayload["nowPlaying"] | null;
  reload: () => Promise<void>;
};
const C = createContext<Ctx | null>(null);

export function ActivityProvider({ children }: { children: React.ReactNode }) {
  const { owner } = useRoom();
  const [activity, setActivity] = useState<ActivityPayload | null>(null);
  const [nowPlaying, setNowPlaying] = useState<Ctx["nowPlaying"]>(null);

  const reload = useCallback(async () => {
    const [a, g] = await Promise.all([getActivity(), getGames()]);
    setActivity(a);
    setNowPlaying(g.ok ? g.data.nowPlaying ?? null : null);
  }, []);

  useEffect(() => {
    void reload();
    // The owner sees the present (every 30s); visitors see a delayed category, so once a minute is enough.
    const t = setInterval(() => { if (document.visibilityState === "visible") void reload(); }, owner ? 30_000 : 60_000);
    return () => clearInterval(t);
  }, [reload, owner]);

  return <C.Provider value={{ activity, nowPlaying, reload }}>{children}</C.Provider>;
}

export function useActivity() {
  const v = useContext(C);
  if (!v) throw new Error("useActivity must be used inside ActivityProvider");
  return v;
}

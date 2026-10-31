import type { Movie } from "./movies";
import type { Track } from "./music";
import type { EnvOverride } from "./env";
import type { Category, Minutes } from "./activity";
import type { GameDetails, GameSettings, Note, Presence, Shot, Slot, SteamSnapshot } from "./games";

export type VisitMode = "named" | "anonymous";
/** `move` is going through a door to another room of the house; its `room` is the space id (main, cinema, bedroom). */
export type EventType = "enter" | "view" | "dock" | "open" | "guestbook" | "score" | "move";

export type TrackEvent = { type: EventType; room?: string; at: number; value?: number };

export type Visitor = {
  id: string;
  name: string;
  mode: VisitMode;
  firstAt: number;
  lastAt: number;
  events: TrackEvent[];
};

export type Message = { id: string; visitorId: string; name: string; text: string; at: number; hidden?: boolean };

export type RoomOverride = { title?: string; desc?: string; update?: string };

export type DB = {
  visitors: Record<string, Visitor>;
  messages: Message[];
  rooms: Record<string, RoomOverride>;
  /** The owner's movie records. Missing in older files; empty or missing means the example records are shown. */
  movies?: Movie[];
  /** Music room tracks, in play order. */
  tracks?: Track[];
  /** Game room: pinned slots, play notes, screenshot records, and the last Steam snapshot. */
  games?: {
    slots: Slot[]; notes: Note[]; shots: Shot[]; steam?: SteamSnapshot;
    /** Per pinned Steam game, keyed by appid. */
    details?: Record<string, GameDetails>;
    presence?: Presence;
    settings?: GameSettings;
  };
  /** The Windows helper: its token (hash only), what it last reported, and minutes per day. */
  activity?: ActivityRecord;
  /** Site-wide settings the owner sets. */
  settings?: { envOverride?: EnvOverride };
};

export type Dashboard = { visitors: Visitor[]; interest: Record<string, number>; messages: Message[] };

export type ActivityRecord = {
  /** sha256 of the helper token; the token itself is shown once and never stored. */
  tokenHash?: string;
  tokenCreatedAt?: number;
  publicLive?: boolean;
  status?: { category: Category; app: string; at: number };
  /** The last few minutes of pings, so visitors can be shown the past instead of the present. */
  recent?: { category: Category; at: number }[];
  /** Seoul date → minutes per category. */
  days: Record<string, Minutes>;
  /** Seoul date → app name → minutes (owner only). */
  apps: Record<string, Record<string, { category: Category; minutes: number }>>;
};

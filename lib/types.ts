import type { Movie } from "./movies";

export type VisitMode = "named" | "anonymous";
export type EventType = "enter" | "view" | "dock" | "open" | "guestbook" | "score";

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
};

export type Dashboard = { visitors: Visitor[]; interest: Record<string, number>; messages: Message[] };

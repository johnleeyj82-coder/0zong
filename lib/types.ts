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

/**
 * One record in a room: a play session, a solved problem, a movie, a practice note…
 * What each field means depends on the room (see app/rooms/schema.ts).
 */
export type Entry = {
  id: string;
  room: string;
  /** When it happened (ms). */
  at: number;
  title: string;
  tag?: string;
  value?: number;
  /** Free-text notes; labels come from the room's schema. */
  notes: string[];
  /** Seeded example, shown as "예시" until the owner removes it. */
  example?: boolean;
};

export type DB = {
  visitors: Record<string, Visitor>;
  messages: Message[];
  rooms: Record<string, RoomOverride>;
  /** Absent until the owner first edits a record; until then the examples are served. */
  entries?: Entry[];
};

export type Dashboard = { visitors: Visitor[]; interest: Record<string, number>; messages: Message[] };

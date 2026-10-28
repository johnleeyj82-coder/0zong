// Server-only JSON store. Good for local use and a single small server.
// On serverless hosts (Vercel etc.) the filesystem is not persistent: swap these functions for a real database
// (Supabase/Postgres) — the API routes only call the functions exported here.
import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { DB, Message, RoomOverride, TrackEvent, Visitor, VisitMode } from "./types";
import type { Movie } from "./movies";
import { EXAMPLE_MOVIES } from "./movies.example";

const FILE = process.env.ROOM_DB_FILE || path.join(process.cwd(), "data", "db.json");
const MAX_EVENTS_PER_VISITOR = 2000;
let queue: Promise<unknown> = Promise.resolve();

async function read(): Promise<DB> {
  let raw: string;
  try {
    raw = await fs.readFile(FILE, "utf8");
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return { visitors: {}, messages: [], rooms: {} };
    throw e;
  }
  // A corrupt file throws here instead of reading as empty, so the next write can't wipe the records.
  return JSON.parse(raw) as DB;
}
async function write(db: DB) {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  const tmp = FILE + ".tmp";
  await fs.writeFile(tmp, JSON.stringify(db));
  await fs.rename(tmp, FILE);
}
/** Serialises read-modify-write so concurrent requests don't overwrite each other. */
function mutate<T>(fn: (db: DB) => T | Promise<T>): Promise<T> {
  const run = queue.then(async () => {
    const db = await read();
    const out = await fn(db);
    await write(db);
    return out;
  });
  queue = run.catch(() => undefined);
  return run;
}

export function upsertVisitor(id: string, name: string, mode: VisitMode): Promise<Visitor> {
  return mutate((db) => {
    const now = Date.now();
    const v = db.visitors[id] ?? { id, name, mode, firstAt: now, lastAt: now, events: [] };
    v.name = name; v.mode = mode; v.lastAt = now;
    db.visitors[id] = v;
    return v;
  });
}

export function addEvents(id: string, events: TrackEvent[]): Promise<boolean> {
  return mutate((db) => {
    const v = db.visitors[id];
    if (!v) return false;
    v.events.push(...events);
    if (v.events.length > MAX_EVENTS_PER_VISITOR) v.events = v.events.slice(-MAX_EVENTS_PER_VISITOR);
    v.lastAt = Date.now();
    return true;
  });
}

export async function listMessages(includeHidden = false): Promise<Message[]> {
  const db = await read();
  return db.messages.filter((m) => includeHidden || !m.hidden).sort((a, b) => b.at - a.at);
}

export function addMessage(m: Message): Promise<Message> {
  return mutate((db) => { db.messages.push(m); return m; });
}

export function setMessageHidden(id: string, hidden: boolean): Promise<boolean> {
  return mutate((db) => {
    const m = db.messages.find((x) => x.id === id);
    if (!m) return false;
    m.hidden = hidden;
    return true;
  });
}

export async function getRoomOverrides(): Promise<Record<string, RoomOverride>> {
  return (await read()).rooms;
}

export function setRoomOverride(key: string, o: RoomOverride): Promise<RoomOverride> {
  return mutate((db) => { db.rooms[key] = { ...db.rooms[key], ...o }; return db.rooms[key]; });
}

/** The owner's movie records, or the labeled example records until there are any. */
export async function listMovies(): Promise<Movie[]> {
  const movies = (await read()).movies;
  return movies?.length ? movies : EXAMPLE_MOVIES;
}

/** Creates or replaces a movie by id. The first real record hides the examples. */
export function saveMovie(m: Movie): Promise<Movie> {
  return mutate((db) => {
    const list = db.movies ?? [];
    const i = list.findIndex((x) => x.id === m.id);
    if (i >= 0) list[i] = m; else list.push(m);
    db.movies = list;
    return m;
  });
}

/** Replaces an existing movie; null if there is no movie with that id. */
export function updateMovie(m: Movie): Promise<Movie | null> {
  return mutate((db) => {
    const i = (db.movies ?? []).findIndex((x) => x.id === m.id);
    if (i < 0) return null;
    db.movies![i] = m;
    return m;
  });
}

export function removeMovie(id: string): Promise<boolean> {
  return mutate((db) => {
    const before = db.movies?.length ?? 0;
    db.movies = (db.movies ?? []).filter((x) => x.id !== id);
    return db.movies.length < before;
  });
}

/** Adds or overwrites by id, so importing the same export twice does not duplicate anything. */
export function importMovies(list: Movie[]): Promise<{ added: number; updated: number }> {
  return mutate((db) => {
    const movies = db.movies ?? [];
    let added = 0, updated = 0;
    for (const m of list) {
      const i = movies.findIndex((x) => x.id === m.id);
      if (i >= 0) { movies[i] = m; updated++; } else { movies.push(m); added++; }
    }
    db.movies = movies;
    return { added, updated };
  });
}

export async function getDashboard() {
  const db = await read();
  const interest: Record<string, number> = {};
  const visitors = Object.values(db.visitors)
    .sort((a, b) => b.lastAt - a.lastAt)
    .map((v) => {
      for (const e of v.events) if (e.room && (e.type === "view" || e.type === "open" || e.type === "dock" || e.type === "score")) {
        interest[e.room] = (interest[e.room] ?? 0) + (e.type === "open" ? 2 : 1);
      }
      return v;
    });
  return { visitors, interest, messages: db.messages.sort((a, b) => b.at - a.at) };
}

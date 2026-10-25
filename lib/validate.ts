export const clean = (s: unknown, max: number) =>
  typeof s === "string" ? s.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, max) : "";
export const isId = (s: unknown): s is string => typeof s === "string" && /^[a-zA-Z0-9-]{8,64}$/.test(s);
export const ROOM_KEYS = ["music", "video", "book", "game", "hack", "poker", "art", "whisky", "chess", "movie", "tetris"];

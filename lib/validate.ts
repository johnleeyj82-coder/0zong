export const clean = (s: unknown, max: number) =>
  typeof s === "string" ? s.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, max) : "";
export const isId = (s: unknown): s is string => typeof s === "string" && /^[a-zA-Z0-9-]{8,64}$/.test(s);
export const ROOM_KEYS = ["music", "video", "book", "game", "hack", "poker", "art", "whisky", "chess", "movie", "tetris"];

/** Validates an entry from the owner. Returns the cleaned fields or an error message (Korean, shown to the owner). */
export function cleanEntry(b: Record<string, unknown>):
  { ok: true; v: { room: string; at: number; title: string; tag?: string; value?: number; notes: string[] } } | { ok: false; error: string } {
  if (!ROOM_KEYS.includes(b.room as string)) return { ok: false, error: "없는 방이에요." };
  const title = clean(b.title, 40);
  if (!title) return { ok: false, error: "이름을 적어주세요." };
  const at = Number(b.at);
  if (!Number.isFinite(at) || at < Date.UTC(2000, 0, 1) || at > Date.now() + 2 * 86400_000) return { ok: false, error: "날짜를 확인해주세요." };
  let value: number | undefined;
  if (b.value !== undefined && b.value !== null && b.value !== "") {
    value = Number(b.value);
    if (!Number.isFinite(value) || Math.abs(value) > 1e6) return { ok: false, error: "숫자를 확인해주세요." };
    value = Math.round(value * 10) / 10;
  }
  const tag = clean(b.tag, 24) || undefined;
  const notes = (Array.isArray(b.notes) ? b.notes : []).slice(0, 3).map((n) => clean(n, 400));
  while (notes.length && !notes[notes.length - 1]) notes.pop();
  return { ok: true, v: { room: b.room as string, at, title, tag, value, notes } };
}

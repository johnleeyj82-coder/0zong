// Server-only audio file storage. The one place that touches the music folder: swap these functions for object storage
// (Supabase Storage, Vercel Blob) before deploying to a serverless host, the same way lib/store.ts gets swapped.
import "server-only";
import { createReadStream, promises as fs } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";

const DIR = process.env.ROOM_MUSIC_DIR
  || (process.env.ROOM_DB_FILE ? path.join(path.dirname(process.env.ROOM_DB_FILE), "music") : path.join(process.cwd(), "data", "music"));

/** Recognises the audio formats browsers play everywhere from the file's first bytes; the name and the browser's MIME are ignored. */
export function sniffAudio(b: Uint8Array): { ext: string; mime: string } | null {
  const ascii = (from: number, to: number) => String.fromCharCode(...b.subarray(from, to));
  if (b.length < 12) return null;
  if (ascii(0, 3) === "ID3" || (b[0] === 0xff && (b[1] & 0xe0) === 0xe0 && (b[1] & 0x06) !== 0)) return { ext: "mp3", mime: "audio/mpeg" };
  if (ascii(4, 8) === "ftyp") return { ext: "m4a", mime: "audio/mp4" };
  if (ascii(0, 4) === "OggS") return { ext: "ogg", mime: "audio/ogg" };
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WAVE") return { ext: "wav", mime: "audio/wav" };
  return null;
}

/** jpg, png, webp by their first bytes. */
export function sniffImage(b: Uint8Array): { ext: string; mime: string } | null {
  if (b.length < 12) return null;
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { ext: "jpg", mime: "image/jpeg" };
  if (b[0] === 0x89 && String.fromCharCode(...b.subarray(1, 4)) === "PNG") return { ext: "png", mime: "image/png" };
  if (String.fromCharCode(...b.subarray(0, 4)) === "RIFF" && String.fromCharCode(...b.subarray(8, 12)) === "WEBP") return { ext: "webp", mime: "image/webp" };
  return null;
}

const file = (id: string, ext: string) => path.join(DIR, `${id}.${ext}`);
const SHOTS = path.join(path.dirname(DIR), "shots");
const shotFile = (id: string, ext: string) => path.join(SHOTS, `${id}.${ext}`);

export async function saveImage(id: string, ext: string, data: Uint8Array) {
  await fs.mkdir(SHOTS, { recursive: true });
  await fs.writeFile(shotFile(id, ext), data);
}

export async function removeImage(id: string, ext: string) {
  await fs.rm(shotFile(id, ext), { force: true });
}

export async function readImage(id: string, ext: string) {
  return fs.readFile(shotFile(id, ext)).catch(() => null);
}

export async function saveAudio(id: string, ext: string, data: Uint8Array) {
  await fs.mkdir(DIR, { recursive: true });
  await fs.writeFile(file(id, ext), data);
}

export async function removeAudio(id: string, ext: string) {
  await fs.rm(file(id, ext), { force: true });
}

/** Opens a stored file, whole or a byte range. Null when the file is missing. */
export async function openAudio(id: string, ext: string, range?: { start: number; end: number }) {
  const p = file(id, ext);
  const stat = await fs.stat(p).catch(() => null);
  if (!stat) return null;
  const stream = createReadStream(p, range);
  return { size: stat.size, body: Readable.toWeb(stream) as ReadableStream<Uint8Array> };
}

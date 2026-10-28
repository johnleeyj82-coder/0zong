import { listTracks } from "@/lib/store";
import { openAudio } from "@/lib/files";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** Streams a stored track. Supports Range so the player can seek; ids never change content, so it caches for a year. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = UUID.test(id) ? (await listTracks()).find((x) => x.id === id) : undefined;
  if (!t) return new Response("Not found", { status: 404 });
  const headers: Record<string, string> = {
    "Content-Type": t.mime, "Accept-Ranges": "bytes", "Cache-Control": "public, max-age=31536000, immutable",
    "X-Content-Type-Options": "nosniff",
  };
  const m = /^bytes=(\d*)-(\d*)$/.exec(req.headers.get("range") ?? "");
  if (m && (m[1] || m[2])) {
    const size = t.size;
    let start = m[1] ? Number(m[1]) : Math.max(0, size - Number(m[2]));
    let end = m[1] && m[2] ? Number(m[2]) : size - 1;
    end = Math.min(end, size - 1);
    if (start > end || start >= size) return new Response(null, { status: 416, headers: { ...headers, "Content-Range": `bytes */${size}` } });
    const f = await openAudio(t.id, t.ext, { start, end });
    if (!f) return new Response("Not found", { status: 404 });
    return new Response(f.body, { status: 206, headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${f.size}`, "Content-Length": String(end - start + 1) } });
  }
  const f = await openAudio(t.id, t.ext);
  if (!f) return new Response("Not found", { status: 404 });
  return new Response(f.body, { status: 200, headers: { ...headers, "Content-Length": String(f.size) } });
}

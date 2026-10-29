import { getGames } from "@/lib/store";
import { readImage } from "@/lib/files";

/** Serves a screenshot. Ids never change content, so it caches for a year. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = (await getGames()).shots.find((x) => x.id === id);
  const data = s && (await readImage(s.id, s.ext));
  if (!s || !data) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(data), {
    headers: { "Content-Type": s.mime, "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" },
  });
}

import { NextResponse } from "next/server";
import { clearOwnerCookie, isOwner, isOwnerName, setOwnerCookie, verifyPassword } from "@/lib/auth";
import { clean } from "@/lib/validate";

const attempts = new Map<string, { n: number; until: number }>();

export async function GET() {
  return NextResponse.json({ owner: await isOwner() });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const name = clean(body.name, 20);
  const password = typeof body.password === "string" ? body.password.slice(0, 200) : "";
  const key = "owner";
  const a = attempts.get(key) ?? { n: 0, until: 0 };
  if (a.until > Date.now()) return NextResponse.json({ error: "잠시 후 다시 시도해주세요." }, { status: 429 });
  if (!isOwnerName(name) || !verifyPassword(password)) {
    a.n += 1;
    if (a.n >= 5) { a.until = Date.now() + 5 * 60_000; a.n = 0; }
    attempts.set(key, a);
    return NextResponse.json({ error: "비밀번호가 맞지 않아요." }, { status: 401 });
  }
  attempts.delete(key);
  await setOwnerCookie();
  return NextResponse.json({ owner: true });
}

export async function DELETE() {
  await clearOwnerCookie();
  return NextResponse.json({ owner: false });
}

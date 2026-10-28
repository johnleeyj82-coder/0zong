import { NextResponse } from "next/server";
import { clearOwnerCookie, isOwner, isOwnerName, setOwnerCookie, verifyPassword } from "@/lib/auth";
import { clean } from "@/lib/validate";

// No lockout: a shared lockout would let anyone keep the owner out. A failed attempt just answers slowly instead.
const FAIL_DELAY_MS = 1500;

export async function GET() {
  return NextResponse.json({ owner: await isOwner() });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const name = clean(body.name, 20);
  const password = typeof body.password === "string" ? body.password.slice(0, 200) : "";
  if (!isOwnerName(name) || !verifyPassword(password)) {
    await new Promise((r) => setTimeout(r, FAIL_DELAY_MS));
    return NextResponse.json({ error: "비밀번호가 맞지 않아요." }, { status: 401 });
  }
  await setOwnerCookie();
  return NextResponse.json({ owner: true });
}

export async function DELETE() {
  await clearOwnerCookie();
  return NextResponse.json({ owner: false });
}

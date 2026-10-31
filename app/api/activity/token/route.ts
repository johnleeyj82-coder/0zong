import { NextResponse } from "next/server";
import { createHash, randomBytes } from "node:crypto";
import { isOwner } from "@/lib/auth";
import { setHelperToken } from "@/lib/store";

/** Owner only: makes a new helper token (the old one stops working). The token is returned once and stored only as a hash. */
export async function POST() {
  if (!(await isOwner())) return NextResponse.json({ error: "권한이 없어요." }, { status: 403 });
  const token = randomBytes(32).toString("base64url");
  await setHelperToken(createHash("sha256").update(token).digest("hex"));
  return NextResponse.json({ token });
}

/** Owner only: disconnects the helper. Recorded minutes stay. */
export async function DELETE() {
  if (!(await isOwner())) return NextResponse.json({ error: "권한이 없어요." }, { status: 403 });
  await setHelperToken(null);
  return NextResponse.json({ ok: true });
}

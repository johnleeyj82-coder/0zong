import { NextResponse } from "next/server";
import { getDashboard } from "@/lib/store";
import { isOwner } from "@/lib/auth";

export async function GET() {
  if (!(await isOwner())) return NextResponse.json({ error: "권한이 없어요." }, { status: 403 });
  return NextResponse.json(await getDashboard());
}

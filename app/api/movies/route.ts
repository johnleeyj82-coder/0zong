import { NextResponse } from "next/server";
import { listMovies } from "@/lib/store";

export async function GET() {
  return NextResponse.json({ movies: await listMovies() });
}

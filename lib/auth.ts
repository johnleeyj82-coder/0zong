import "server-only";
import { createHmac, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE = "room_owner";
const MAX_AGE = 60 * 60 * 24 * 14; // 14 days

const ownerName = () => (process.env.OWNER_NAME || "").trim().toLowerCase();
const secret = () => process.env.SESSION_SECRET || "";

export function isOwnerName(name: string) {
  return !!ownerName() && name.trim().toLowerCase() === ownerName();
}

/** OWNER_PASSWORD_HASH format: scrypt:<salt hex>:<hash hex> (no "$", which .env files would expand)  (create it with `npm run hash-password`). */
export function verifyPassword(password: string) {
  const stored = process.env.OWNER_PASSWORD_HASH || "";
  const [algo, salt, hash] = stored.split(":");
  if (algo !== "scrypt" || !salt || !hash) return false;
  const expected = Buffer.from(hash, "hex");
  const actual = scryptSync(password, Buffer.from(salt, "hex"), expected.length);
  return timingSafeEqual(actual, expected);
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

export async function setOwnerCookie() {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE;
  const payload = `owner.${exp}`;
  (await cookies()).set(COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: MAX_AGE,
  });
}

export async function clearOwnerCookie() {
  (await cookies()).delete(COOKIE);
}

export async function isOwner(): Promise<boolean> {
  if (!secret()) return false;
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return false;
  const i = raw.lastIndexOf(".");
  const payload = raw.slice(0, i), sig = raw.slice(i + 1);
  const exp = Number(payload.split(".")[1]);
  if (!exp || exp < Date.now() / 1000) return false;
  const good = Buffer.from(sign(payload)), got = Buffer.from(sig);
  return good.length === got.length && timingSafeEqual(good, got);
}

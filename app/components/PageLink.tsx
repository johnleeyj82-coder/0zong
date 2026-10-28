"use client";
import Link from "next/link";
import { DEMO, pageHref } from "@/lib/client";

/**
 * Link between the site's pages. On the real site it is a client-side Next link, so the music player keeps playing;
 * the static preview uses plain relative links (it can live under any folder).
 */
export function PageLink({ to, className, children }: { to: "home" | "movie"; className?: string; children: React.ReactNode }) {
  if (DEMO) return <a href={pageHref(to)} className={className}>{children}</a>;
  return <Link href={pageHref(to)} className={className}>{children}</Link>;
}

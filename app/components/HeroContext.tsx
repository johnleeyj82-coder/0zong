"use client";
import { createContext, useContext, useRef, type RefObject } from "react";
import { useMotionValue, type MotionValue } from "framer-motion";

type HeroCtx = { progress: MotionValue<number>; heroRef: RefObject<HTMLDivElement | null> };
const Ctx = createContext<HeroCtx | null>(null);

export function HeroProvider({ children }: { children: React.ReactNode }) {
  const progress = useMotionValue(0);
  const heroRef = useRef<HTMLDivElement | null>(null);
  return <Ctx.Provider value={{ progress, heroRef }}>{children}</Ctx.Provider>;
}

export function useHero() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useHero must be used inside HeroProvider");
  return v;
}

/** Scrolls the window so the hero's scroll progress lands on `p` (0–1). */
export function scrollToProgress(hero: HTMLDivElement | null, p: number) {
  if (!hero) return;
  const top = hero.getBoundingClientRect().top + window.scrollY;
  const range = hero.offsetHeight - window.innerHeight;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.scrollTo({ top: top + p * range, behavior: reduce ? "auto" : "smooth" });
}

export function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
}

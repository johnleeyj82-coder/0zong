"use client";
// anime.js inside React: run a choreography once the page's records are in, scoped to the page's root, and undo it on
// unmount. With "reduce motion" on, nothing runs and everything stays in its finished place (so no element may be
// hidden by CSS waiting for an animation to reveal it).
import { useLayoutEffect, type DependencyList, type RefObject } from "react";
import { createScope } from "animejs";

export function useAnime(root: RefObject<HTMLElement | null>, run: () => void, deps: DependencyList) {
  useLayoutEffect(() => {
    if (!root.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const scope = createScope({ root }).add(run);
    return () => scope.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/** A small repeatable random for decorative variation (tilts, offsets) that must not change between renders. */
export const jitter = (i: number, salt = 1) => (Math.abs(Math.sin((i + 1) * 12.9898 * salt) * 43758.5453) % 1) - 0.5;

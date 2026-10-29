"use client";
import { useState } from "react";
import { steamCover, type Slot } from "@/lib/games";

/** Steam's portrait art, then its header art, then a lettered cover. Hand-added games go straight to the lettered one. */
export function Cover({ slot, className = "cover" }: { slot: Pick<Slot, "appid" | "title">; className?: string }) {
  const [step, setStep] = useState(0);
  if (slot.appid !== undefined && step < 2) {
    return <img className={className} src={steamCover(slot.appid, step === 0 ? "portrait" : "header")} alt="" loading="lazy"
      decoding="async" onError={() => setStep((s) => s + 1)} data-kind={step === 0 ? "portrait" : "header"} />;
  }
  return <span className={`${className} poster-ph`} aria-hidden><b>{slot.title}</b></span>;
}

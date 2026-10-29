// How the house looks for a time of day and a weather: sky, sun, ambient light, how bright the lamps are, and how many
// city windows are lit. The scene eases toward these numbers, so a change (the bed, a new forecast) is a slow fade.
import type { TimeOfDay, Weather } from "@/lib/env";

export type Look = {
  skyTop: string; skyLow: string;
  sun: string; sunI: number;
  ambient: number; hemiSky: string; hemiGround: string;
  /** 0–1: lamps are on at night, barely in daylight. */
  lamps: number;
  /** 0–1: lit windows in the city outside. */
  city: number;
};

const BY_TIME: Record<TimeOfDay, Look> = {
  dawn:    { skyTop: "#33406a", skyLow: "#d9937a", sun: "#ffb48c", sunI: 0.9, ambient: 0.25, hemiSky: "#8090c0", hemiGround: "#3a2a20", lamps: 0.55, city: 0.45 },
  morning: { skyTop: "#7fa9d8", skyLow: "#efdcbc", sun: "#fff0d6", sunI: 2.4, ambient: 0.7, hemiSky: "#b8d0f0", hemiGround: "#5a4630", lamps: 0.12, city: 0.04 },
  day:     { skyTop: "#6aa3e6", skyLow: "#cfe2f4", sun: "#ffffff", sunI: 2.8, ambient: 0.85, hemiSky: "#c8dcf5", hemiGround: "#5e4a34", lamps: 0.08, city: 0 },
  sunset:  { skyTop: "#463a6a", skyLow: "#f08848", sun: "#ff9152", sunI: 1.4, ambient: 0.3, hemiSky: "#9a7aa8", hemiGround: "#3e2a1e", lamps: 0.7, city: 0.4 },
  night:   { skyTop: "#070b1e", skyLow: "#1b2350", sun: "#8494d8", sunI: 0.25, ambient: 0.07, hemiSky: "#2a3466", hemiGround: "#1a120c", lamps: 1, city: 1 },
};

// Clouds, rain and snow dim the sun and grey the sky; storms also darken the room.
const GREY: Record<Weather, { sun: number; sky: number; ambient: number; tint: string }> = {
  clear: { sun: 1, sky: 0, ambient: 1, tint: "#000000" },
  cloudy: { sun: 0.45, sky: 0.45, ambient: 0.9, tint: "#7d8592" },
  rain: { sun: 0.3, sky: 0.6, ambient: 0.8, tint: "#5b6472" },
  storm: { sun: 0.18, sky: 0.75, ambient: 0.65, tint: "#2f3542" },
  snow: { sun: 0.5, sky: 0.55, ambient: 1.05, tint: "#c3c9d2" },
};

const hex = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
const mix = (a: string, b: string, t: number) =>
  `#${hex(a).map((v, i) => Math.round(v + (hex(b)[i] - v) * t).toString(16).padStart(2, "0")).join("")}`;

export function lookFor(time: TimeOfDay, weather: Weather): Look {
  const l = BY_TIME[time], g = GREY[weather];
  // At night a grey tint would light the sky up: keep it dark and only mute it.
  const t = time === "night" ? g.sky * 0.25 : g.sky;
  return {
    ...l,
    skyTop: mix(l.skyTop, g.tint, t), skyLow: mix(l.skyLow, g.tint, t),
    sunI: l.sunI * g.sun, ambient: l.ambient * g.ambient,
    lamps: Math.min(1, l.lamps + (weather === "clear" ? 0 : 0.2)),
  };
}

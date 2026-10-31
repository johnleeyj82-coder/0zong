// Building blocks for the house: every room is plain data (shell, things, doors, lamps, camera) so a Tripo model can
// later replace a placeholder in the same spot without touching the scene code. Units are metres, y is up, the floor
// is y = 0, the open side of the diorama faces +z (the camera).
import type { RoomKey, SpaceId } from "../data";

export type Vec3 = [number, number, number];

type PartBase = { at: Vec3; color: string; rot?: Vec3; /** self-lit colour (screens, bulbs) */ glow?: string; glowI?: number; opacity?: number };
export type Part =
  | (PartBase & { kind: "box"; size: Vec3 })
  | (PartBase & { kind: "cyl"; r: number; h: number; r2?: number; seg?: number })
  | (PartBase & { kind: "ball"; r: number });

export type View = { pos: Vec3; target: Vec3 };

export type Thing = {
  key: string;
  /** Clicking opens this hobby's caption. */
  hobby?: RoomKey;
  /** The bed: choose the room's time. */
  action?: "time";
  /** Hover label for things that are not a hobby. */
  label?: string;
  at: Vec3;
  rotY?: number;
  /** Replaces the placeholder parts once a GLB exists (phase 3). */
  model?: string;
  scale?: number;
  parts: Part[];
  /** Reserved for a later "camera flies to the object" option. Unused for now. */
  focus?: View;
};

export type Door = { id: string; to: SpaceId; /** centre of the door on the floor */ at: Vec3; rotY: number; label: string };
export type Lamp = { at: Vec3; power: number; color?: string; distance?: number };

export type Space = {
  id: SpaceId;
  /** width (x), depth (z), height (y) */
  size: [number, number, number];
  wall: string;
  floor: string;
  /** A window in the back wall: centre x, sill height, width, height. */
  window?: { x: number; y: number; w: number; h: number };
  things: Thing[];
  doors: Door[];
  lamps: Lamp[];
  view: View;
  /** Where the speech bubble floats (the owner's seat). */
  bubble?: Vec3;
  /** Where the camera starts when you arrive through the door from that room. */
  from?: Partial<Record<SpaceId, View>>;
};

/** A box standing on `y` (its bottom), centred on x/z. */
export const box = (w: number, h: number, d: number, x: number, y: number, z: number, color: string, o: Partial<PartBase> = {}): Part =>
  ({ kind: "box", size: [w, h, d], at: [x, y + h / 2, z], color, ...o });

/** A cylinder standing on `y`. `r2` makes it a cone-ish shade (top radius r2, bottom r). */
export const cyl = (r: number, h: number, x: number, y: number, z: number, color: string, o: Partial<PartBase> & { r2?: number } = {}): Part =>
  ({ kind: "cyl", r, h, at: [x, y + h / 2, z], color, ...o });

export const ball = (r: number, x: number, y: number, z: number, color: string, o: Partial<PartBase> = {}): Part =>
  ({ kind: "ball", r, at: [x, y, z], color, ...o });

/* ---------- shared furniture ---------- */
export const C = {
  wood: "#6b4a32", woodDark: "#3f2b1e", woodLight: "#8a6444", black: "#18161a", metal: "#5d5a58",
  cream: "#e8dcc6", felt: "#2f5c47", leather: "#2a2622", green: "#3c4a33", plant: "#3f6b3a", rug: "#6e2a2a",
  bulb: "#ffd59a", screenNight: "#24324d", paper: "#f1ebe0",
};

/** A lamp head that glows (pairs with a Lamp light at the same spot). */
export const bulb = (x: number, y: number, z: number, r = 0.07) => ball(r, x, y, z, C.bulb, { glow: C.bulb, glowI: 2.2 });

export const plant = (x: number, z: number, h = 0.9): Part[] => [
  cyl(0.16, 0.3, x, 0, z, "#8b6f55", { r2: 0.2 }),
  ball(h * 0.35, x, 0.3 + h * 0.35, z, C.plant),
  ball(h * 0.25, x + 0.12, 0.3 + h * 0.6, z - 0.05, "#4b7a42"),
];

/** A framed poster flat on a wall: `rotY` turns it to face into the room. */
export const poster = (w: number, h: number, x: number, y: number, z: number, color: string, rotY = 0): Part[] => [
  { kind: "box", size: [w + 0.06, h + 0.06, 0.03], at: [x, y, z], color: C.black, rot: [0, rotY, 0] },
  { kind: "box", size: [w, h, 0.035], at: [x, y, z], color, rot: [0, rotY, 0], glow: color, glowI: 0.08 },
];

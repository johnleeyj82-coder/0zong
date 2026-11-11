// Building blocks for the house: every room is plain data (shell, things, doors, lamps, camera) so a Tripo model can
// later replace a placeholder in the same spot without touching the scene code. Units are metres, y is up, the floor
// is y = 0, the open side of the diorama faces +z (the camera).
import type { RoomKey, SpaceId } from "../data";

export type Vec3 = [number, number, number];

/** Procedural surface patterns (drawn on a canvas once, see textures.ts). The part's colour tints them. */
export type Tex = "planks" | "grain" | "plaster" | "fabric" | "felt" | "rug";

type PartBase = {
  at: Vec3; color: string; rot?: Vec3;
  /** Stretch after shaping (a ball becomes an ellipsoid). */
  scale?: Vec3;
  /** self-lit colour (screens, bulbs) */
  glow?: string; glowI?: number; opacity?: number;
  /** 0 mirror – 1 chalk (default 0.75), and 0–1 metal. */
  rough?: number; metal?: number;
  tex?: Tex;
};
export type Part =
  | (PartBase & { kind: "box"; size: Vec3 })
  /** A box with rounded edges: cushions, mattresses, anything soft or moulded. */
  | (PartBase & { kind: "rbox"; size: Vec3; radius?: number })
  | (PartBase & { kind: "cyl"; r: number; h: number; r2?: number; seg?: number })
  | (PartBase & { kind: "ball"; r: number })
  /** A profile [radius, height] spun around the y axis: lamp shades, bottles, chess pieces, pots. */
  | (PartBase & { kind: "lathe"; pts: [number, number][]; seg?: number });

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
export const cyl = (r: number, h: number, x: number, y: number, z: number, color: string, o: Partial<PartBase> & { r2?: number; seg?: number } = {}): Part =>
  ({ kind: "cyl", r, h, at: [x, y + h / 2, z], color, ...o });

export const ball = (r: number, x: number, y: number, z: number, color: string, o: Partial<PartBase> = {}): Part =>
  ({ kind: "ball", r, at: [x, y, z], color, ...o });

/** A rounded box standing on `y`. */
export const rbox = (w: number, h: number, d: number, x: number, y: number, z: number, color: string, o: Partial<PartBase> & { radius?: number } = {}): Part =>
  ({ kind: "rbox", size: [w, h, d], at: [x, y + h / 2, z], color, ...o });

/** A spun profile whose y = 0 sits on `y`. */
export const lathe = (pts: [number, number][], x: number, y: number, z: number, color: string, o: Partial<PartBase> & { seg?: number } = {}): Part =>
  ({ kind: "lathe", pts, at: [x, y, z], color, ...o });

/** An ellipsoid centred on x/y/z. */
export const ell = (rx: number, ry: number, rz: number, x: number, y: number, z: number, color: string, o: Partial<PartBase> = {}): Part =>
  ({ kind: "ball", r: 1, scale: [rx, ry, rz], at: [x, y, z], color, ...o });

/** A horizontal rod centred on x/y/z, along the x or z axis. */
export const rod = (len: number, r: number, x: number, y: number, z: number, axis: "x" | "z", color: string, o: Partial<PartBase> = {}): Part =>
  ({ kind: "cyl", r, h: len, at: [x, y, z], rot: axis === "x" ? [0, 0, Math.PI / 2] : [Math.PI / 2, 0, 0], color, seg: 12, ...o });

/** Moves a list of parts (for placing a small prop on top of furniture). */
export const move = (parts: Part[], dx: number, dy: number, dz: number): Part[] =>
  parts.map((p) => ({ ...p, at: [p.at[0] + dx, p.at[1] + dy, p.at[2] + dz] as Vec3 }));

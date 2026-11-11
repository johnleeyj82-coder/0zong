// Furniture modelled from primitives: rounded boxes for anything soft or moulded, spun profiles for anything turned
// (bottles, lamp shades, chess pieces, pots), plus plain boxes and rods. Every builder returns parts in its own local
// frame: y = 0 is the floor (or the surface it stands on), the front faces +z. Sizes are metres and match the phase-3
// size table, so a GLB can replace any of these later without moving anything.
import { ball, box, cyl, ell, lathe, move, rbox, rod, type Part } from "./kit";

const H = Math.PI / 2;

export const M = {
  walnut: "#6a4630", walnutDark: "#3f2a1d", oak: "#b08a5e", black: "#17161a", steel: "#7a7774", brass: "#c9a24a",
  cream: "#ece2cf", paper: "#f3ede2", bulb: "#ffd59a", olive: "#56653f", oliveDark: "#3f4b2d", mustard: "#c9953a",
  brick: "#a44a38", navy: "#2a3d5c", leaf: "#3f7a45", leafDark: "#2d5a35", terracotta: "#b0694a", felt: "#2f6b4c",
  linen: "#e6ddcc", slate: "#5d6c7d", amber: "#c9762a",
};

/** A tiny repeatable random, so shelves of books look the same on every load. */
function seeded(seed: number) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

/* ---------- lights ---------- */
export const glowBulb = (x: number, y: number, z: number, r = 0.035): Part => ball(r, x, y, z, M.bulb, { glow: M.bulb, glowI: 3 });

/** A floor lamp with a drum shade (1.75 m). */
export const floorLamp = (shade = M.cream): Part[] => [
  lathe([[0, 0], [0.16, 0], [0.16, 0.015], [0.03, 0.04], [0.012, 0.06]], 0, 0, 0, M.black, { metal: 0.6, rough: 0.4 }),
  cyl(0.012, 1.42, 0, 0.05, 0, M.black, { metal: 0.6, rough: 0.4 }),
  lathe([[0.2, 0], [0.15, 0.26]], 0, 1.45, 0, shade, { glow: M.bulb, glowI: 0.75, opacity: 0.94, rough: 1 }),
  glowBulb(0, 1.55, 0, 0.04),
];

/** A small table lamp (0.36 m). */
export const tableLamp = (base = M.terracotta): Part[] => [
  lathe([[0, 0], [0.055, 0], [0.07, 0.05], [0.04, 0.12], [0.015, 0.17], [0.012, 0.2]], 0, 0, 0, base, { rough: 0.5 }),
  lathe([[0.13, 0], [0.085, 0.16]], 0, 0.2, 0, M.cream, { glow: M.bulb, glowI: 0.9, opacity: 0.94, rough: 1 }),
  glowBulb(0, 0.27, 0, 0.028),
];

/** A cone pendant on a cord, hanging from `top` down to `y`. */
export const pendant = (y: number, top: number, color = "#2f4a3a"): Part[] => [
  cyl(0.004, top - y - 0.14, 0, y + 0.14, 0, M.black),
  lathe([[0.3, 0], [0.26, 0.03], [0.07, 0.14], [0.03, 0.16]], 0, y, 0, color, { rough: 0.45, metal: 0.3 }),
  glowBulb(0, y + 0.04, 0, 0.045),
];

/** Warm bulbs on a sagging wire from a to b. */
export function stringLights(a: [number, number, number], b: [number, number, number], n = 16, sag = 0.14): Part[] {
  return Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1);
    return ball(0.02, a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t - Math.sin(t * Math.PI) * sag, a[2] + (b[2] - a[2]) * t,
      M.bulb, { glow: i % 3 ? M.bulb : "#ffbf7a", glowI: 3 });
  });
}

/* ---------- plants ---------- */
/** A potted plant: a turned pot and broad leaves fanned around the stem. `h` is the overall height. */
export function plant(h = 1, leaves = 11, seed = 3): Part[] {
  const r = seeded(seed), pot = h * 0.3;
  const out: Part[] = [
    lathe([[0, 0], [h * 0.11, 0], [h * 0.16, pot], [h * 0.145, pot], [h * 0.11, pot * 0.3]], 0, 0, 0, M.terracotta, { rough: 0.9 }),
    cyl(h * 0.14, 0.02, 0, pot - 0.04, 0, "#2a1c12"),
  ];
  for (let i = 0; i < leaves; i++) {
    const a = i * 2.4, lift = 0.25 + r() * 0.7, len = h * (0.16 + r() * 0.1), up = pot + h * (0.12 + (i / leaves) * 0.5);
    const R = len * (0.7 + 0.25 * (1 - lift));
    out.push(ell(len, 0.008, len * 0.5, Math.cos(a) * R, up + Math.sin(lift) * len * 0.6, Math.sin(a) * R, i % 3 ? M.leaf : M.leafDark, { rot: [0, -a, lift], rough: 0.6 }));
    out.push(cyl(0.006, up - pot + 0.02, Math.cos(a) * R * 0.25, pot - 0.02, Math.sin(a) * R * 0.25, M.leafDark, { rot: [Math.sin(a) * 0.25, 0, -Math.cos(a) * 0.25] }));
  }
  return out;
}

/* ---------- small things ---------- */
export const mug = (x: number, y: number, z: number, color = M.cream): Part[] => [
  lathe([[0, 0], [0.036, 0], [0.04, 0.09], [0.034, 0.09], [0.031, 0.012]], x, y, z, color, { rough: 0.35 }),
  cyl(0.031, 0.004, x, y + 0.075, z, "#3a2416", { rough: 0.2 }),
  lathe([[0.02, 0], [0.026, 0.006], [0.02, 0.012]], x + 0.048, y + 0.045, z, color, { rot: [H, 0, 0], rough: 0.35, seg: 12 }),
];

export function bookStack(x: number, y: number, z: number, n = 3, seed = 5): Part[] {
  const r = seeded(seed), colors = [M.brick, M.navy, M.mustard, M.oliveDark, M.linen];
  return Array.from({ length: n }, (_, i) =>
    rbox(0.23 - r() * 0.04, 0.035, 0.16 - r() * 0.02, x + (r() - 0.5) * 0.03, y + i * 0.035, z, colors[(i + seed) % 5], { rot: [0, (r() - 0.5) * 0.5, 0], radius: 0.006 }));
}

/** A framed picture on a wall (faces +z; turn it with the thing's rotY). */
export const picture = (w: number, h: number, x: number, y: number, art: string, frame = M.walnutDark): Part[] => [
  box(w + 0.05, h + 0.05, 0.025, x, y - (h + 0.05) / 2, 0, frame),
  box(w, h, 0.012, x, y - h / 2, 0.012, M.paper),
  box(w * 0.78, h * 0.78, 0.012, x, y - h * 0.39, 0.016, art, { glow: art, glowI: 0.12 }),
];

/* ---------- main room ---------- */
/** Walnut desk on black trestles with a drawer unit (2.3 × 0.72 × 0.75). */
export const desk = (): Part[] => [
  rbox(2.3, 0.045, 0.72, 0, 0.705, 0, M.walnut, { tex: "grain", radius: 0.012, rough: 0.55 }),
  ...[-1.02, 1.02].flatMap((x) => [box(0.05, 0.705, 0.05, x, 0, 0.3, M.black), box(0.05, 0.705, 0.05, x, 0, -0.3, M.black), box(0.05, 0.04, 0.6, x, 0, 0, M.black), box(0.05, 0.04, 0.6, x, 0.665, 0, M.black)]),
  box(2.0, 0.05, 0.02, 0, 0.45, -0.32, M.black),
  rbox(0.44, 0.58, 0.6, 0.7, 0.03, 0, "#2b2622", { radius: 0.015 }),
  ...[0.12, 0.31, 0.5].flatMap((y) => [box(0.4, 0.004, 0.01, 0.7, y, 0.302, "#0f0e0d"), rod(0.12, 0.006, 0.7, y - 0.07, 0.31, "x", M.steel, { metal: 0.8, rough: 0.3 })]),
];

/** A mesh office chair on a five-star base (1.1 m). Its seat faces +z. */
export function officeChair(): Part[] {
  const out: Part[] = [cyl(0.028, 0.34, 0, 0.09, 0, M.steel, { metal: 0.8, rough: 0.3 })];
  for (let i = 0; i < 5; i++) {
    const a = (i * Math.PI * 2) / 5;
    out.push(box(0.3, 0.028, 0.045, Math.cos(a) * 0.15, 0.06, Math.sin(a) * 0.15, M.black, { rot: [0, -a, 0] }), ball(0.028, Math.cos(a) * 0.29, 0.028, Math.sin(a) * 0.29, "#0d0d0f"));
  }
  out.push(
    rbox(0.5, 0.08, 0.48, 0, 0.43, 0.02, "#222226", { radius: 0.035, tex: "fabric" }),
    rbox(0.46, 0.58, 0.06, 0, 0.56, -0.25, "#1c1c20", { radius: 0.05, rot: [-0.14, 0, 0], tex: "fabric" }),
    rbox(0.3, 0.14, 0.05, 0, 1.12, -0.31, "#1c1c20", { radius: 0.04, rot: [-0.14, 0, 0] }),
    ...[-0.28, 0.28].flatMap((x) => [box(0.03, 0.22, 0.03, x, 0.45, -0.02, M.black), rbox(0.06, 0.03, 0.26, x, 0.66, 0.02, M.black, { radius: 0.012 })]),
  );
  return out;
}

/** A 27-inch monitor. `screen` picks what is on it: a game scene or a terminal. Stands on y = 0. */
export function monitor(screen: "game" | "term"): Part[] {
  const out: Part[] = [
    rbox(0.24, 0.014, 0.17, 0, 0, -0.02, M.black, { radius: 0.006, metal: 0.4, rough: 0.5 }),
    box(0.045, 0.22, 0.025, 0, 0.014, -0.05, M.black),
    rbox(0.63, 0.375, 0.028, 0, 0.19, 0, "#101013", { radius: 0.008 }),
  ];
  const y = 0.21, z = 0.016;
  if (screen === "game") {
    out.push(
      box(0.6, 0.335, 0.003, 0, y, z, "#213a66", { glow: "#3f66ad", glowI: 1.1 }),
      box(0.6, 0.1, 0.003, 0, y, z + 0.001, "#1f5a3c", { glow: "#2f8a58", glowI: 0.9 }),
      ell(0.035, 0.035, 0.002, 0.17, y + 0.25, z + 0.002, "#ffe08a", { glow: "#ffd76a", glowI: 2 }),
      box(0.035, 0.07, 0.003, -0.05, y + 0.1, z + 0.002, "#e9b872", { glow: "#e9b872", glowI: 1.4 }),
      box(0.16, 0.012, 0.003, -0.2, y + 0.3, z + 0.002, "#d9423a", { glow: "#ff5a4a", glowI: 1.6 }),
      box(0.1, 0.012, 0.003, -0.23, y + 0.28, z + 0.002, "#3aa0d9", { glow: "#4ab8ff", glowI: 1.6 }),
    );
  } else {
    const r = seeded(21);
    out.push(box(0.6, 0.335, 0.003, 0, y, z, "#07140d", { glow: "#0c2a18", glowI: 0.8 }));
    for (let i = 0; i < 11; i++) {
      const w = 0.08 + r() * 0.36;
      out.push(box(w, 0.011, 0.003, -0.28 + w / 2, y + 0.3 - i * 0.027, z + 0.001, "#39d67a", { glow: i === 3 ? "#e9b872" : "#3cff8c", glowI: 1.5 }));
    }
  }
  return out;
}

export const keyboard = (): Part[] => [
  rbox(0.36, 0.014, 0.125, 0, 0, 0, "#232327", { radius: 0.006 }),
  ...[0, 1, 2, 3].map((i) => box(0.33, 0.006, 0.02, 0, 0.014, -0.042 + i * 0.028, i === 3 ? "#3a3a40" : "#cfcabf")),
];
export const mouse = (): Part[] => [rbox(0.26, 0.004, 0.22, 0, 0, 0, "#2a2d36", { radius: 0.002 }), ell(0.03, 0.017, 0.05, 0.02, 0.02, 0, "#e8e4dc", { rough: 0.3 })];

/** Speakers that sit on a desk or cabinet (0.26 m). */
export const speaker = (h = 0.26): Part[] => [
  rbox(h * 0.62, h, h * 0.7, 0, 0, 0, "#1b1a1d", { radius: 0.012 }),
  cyl(h * 0.2, 0.012, 0, h * 0.36, h * 0.35, "#2e2e33", { rot: [H, 0, 0] }), ell(h * 0.1, h * 0.1, 0.012, 0, h * 0.36, h * 0.355, "#0c0c0e"),
  cyl(h * 0.09, 0.012, 0, h * 0.76, h * 0.35, "#2e2e33", { rot: [H, 0, 0] }),
];

/** A five-shelf bookcase full of books (1.5 × 0.34 × 2.0). */
export function bookshelf(): Part[] {
  const r = seeded(11), colors = [M.brick, M.mustard, M.navy, M.oliveDark, M.linen, "#6b3d5a", "#2b2622", "#b9a27a"];
  const out: Part[] = [
    box(0.04, 2.0, 0.34, -0.73, 0, 0, M.walnut, { tex: "grain" }), box(0.04, 2.0, 0.34, 0.73, 0, 0, M.walnut, { tex: "grain" }),
    box(1.46, 2.0, 0.012, 0, 0, -0.164, M.walnutDark),
    box(1.5, 0.04, 0.35, 0, 1.97, 0, M.walnut, { tex: "grain" }),
  ];
  const shelves = [0.06, 0.45, 0.84, 1.23, 1.6];
  shelves.forEach((y, row) => {
    out.push(box(1.42, 0.028, 0.32, 0, y - 0.028, 0, M.walnut, { tex: "grain" }));
    let x = -0.68;
    while (x < 0.6) {
      if (r() < 0.12) { // a gap with a lying stack or a keepsake
        if (r() < 0.5) out.push(...bookStack(x + 0.12, y, 0.02, 3, row * 7 + 2));
        else out.push(lathe([[0, 0], [0.04, 0], [0.055, 0.06], [0.03, 0.11], [0.035, 0.13]], x + 0.1, y, 0.03, row % 2 ? M.terracotta : M.navy, { rough: 0.4 }));
        x += 0.26;
        continue;
      }
      const w = 0.022 + r() * 0.03, h = 0.2 + r() * 0.12, lean = r() < 0.1 ? 0.18 : 0;
      out.push(box(w, h, 0.2 + r() * 0.05, x + w / 2, y, 0.03, colors[Math.floor(r() * colors.length)], { rot: [0, 0, -lean] }));
      x += w + 0.004 + lean * 0.3;
    }
  });
  out.push(...move(plant(0.34, 7, 9), 0.5, 2.01, 0), ...move(bookStack(-0.4, 0, 0, 2, 4), 0, 2.01, 0));
  return out;
}

/** An A-frame easel holding a canvas with a painting in progress (1.75 m). */
export const easel = (): Part[] => [
  box(0.04, 1.78, 0.04, -0.3, 0, 0.12, M.oak, { rot: [-0.13, 0, 0.11], tex: "grain" }),
  box(0.04, 1.78, 0.04, 0.3, 0, 0.12, M.oak, { rot: [-0.13, 0, -0.11], tex: "grain" }),
  box(0.04, 1.7, 0.04, 0, 0, -0.26, M.oak, { rot: [0.24, 0, 0], tex: "grain" }),
  box(0.72, 0.035, 0.09, 0, 0.72, 0.14, M.oak, { tex: "grain" }),
  box(0.05, 0.05, 0.05, 0, 1.62, 0.02, M.oak),
  box(0.66, 0.86, 0.03, 0, 0.76, 0.12, M.paper, { rot: [-0.11, 0, 0], rough: 0.95 }),
  // the painting: a night window in blocks of colour
  box(0.5, 0.36, 0.006, 0, 1.12, 0.128, M.navy, { rot: [-0.11, 0, 0] }),
  box(0.5, 0.2, 0.006, 0, 0.9, 0.161, M.brick, { rot: [-0.11, 0, 0] }),
  ell(0.06, 0.06, 0.004, 0.12, 1.36, 0.124, "#f2d88a", { rot: [-0.11, 0, 0], glow: "#f2d88a", glowI: 0.3 }),
  box(0.12, 0.22, 0.007, -0.12, 0.96, 0.155, M.mustard, { rot: [-0.11, 0, 0] }),
];

/** A rolling cart of paints and brushes. */
export const paintCart = (): Part[] => [
  ...[0.22, 0.52, 0.8].map((y) => rbox(0.44, 0.03, 0.32, 0, y, 0, "#8a8c8a", { radius: 0.01, metal: 0.5, rough: 0.45 })),
  ...[[-0.2, -0.14], [0.2, -0.14], [-0.2, 0.14], [0.2, 0.14]].flatMap(([x, z]) => [cyl(0.01, 0.8, x, 0.04, z, M.steel, { metal: 0.7, rough: 0.3 }), ball(0.025, x, 0.025, z, M.black)]),
  ...["#c2452f", "#2f6fb5", "#e8c24a", "#3c8a4a", "#f1ebe0", "#6b3d8a"].map((c, i) => cyl(0.022, 0.09, -0.16 + i * 0.064, 0.83, -0.06, c, { rough: 0.4 })),
  lathe([[0, 0], [0.045, 0], [0.05, 0.13], [0.044, 0.13]], 0.1, 0.83, 0.07, "#9a8a78"),
  ...[0, 1, 2, 3].map((i) => cyl(0.004, 0.24, 0.085 + i * 0.012, 0.86, 0.06 + (i % 2) * 0.02, M.oak, { rot: [0.12 * (i - 1.5), 0, 0.1 * (i - 1.5)] })),
  ell(0.11, 0.008, 0.08, -0.08, 0.84, 0.07, M.oak),
  ...["#c2452f", "#e8c24a", "#2f6fb5"].map((c, i) => ell(0.018, 0.006, 0.018, -0.13 + i * 0.045, 0.85, 0.06, c)),
];

/** Canvases leaning against a wall. */
export const leaningCanvases = (): Part[] => [
  box(0.6, 0.8, 0.03, 0, 0, 0, M.paper, { rot: [-0.16, 0, 0] }), box(0.46, 0.58, 0.03, 0.14, 0, 0.09, M.navy, { rot: [-0.19, 0, 0] }),
  box(0.36, 0.44, 0.03, -0.12, 0, 0.17, M.brick, { rot: [-0.22, 0, 0] }),
];

/** The display plinth for the mini games: a low cabinet with a glass case and a picture light (1.9 × 0.46 × 0.95). */
export const displayPlinth = (): Part[] => [
  rbox(1.9, 0.93, 0.46, 0, 0, 0, M.walnutDark, { radius: 0.012, tex: "grain" }),
  box(1.94, 0.025, 0.5, 0, 0.93, 0, M.walnut, { tex: "grain" }),
  ...[-0.48, 0.48].map((x) => box(0.86, 0.5, 0.012, x, 0.16, 0.232, "#32231a")),
  ...[-0.48, 0.48].map((x) => ball(0.016, x, 0.46, 0.245, M.brass, { metal: 0.8, rough: 0.3 })),
  box(0.03, 0.62, 0.03, 0, 0.955, -0.2, M.black), box(0.03, 0.03, 0.26, 0, 1.56, -0.08, M.black),
  rbox(0.5, 0.035, 0.07, 0, 1.53, 0.06, M.brass, { radius: 0.014, metal: 0.8, rough: 0.35 }),
  box(0.46, 0.006, 0.05, 0, 1.526, 0.06, M.bulb, { glow: M.bulb, glowI: 3 }),
];

const PAWN: [number, number][] = [[0, 0], [0.017, 0], [0.017, 0.006], [0.009, 0.012], [0.006, 0.03], [0.011, 0.034], [0.006, 0.038], [0.0105, 0.046], [0.0085, 0.056], [0, 0.06]];
const ROOK: [number, number][] = [[0, 0], [0.02, 0], [0.02, 0.007], [0.012, 0.014], [0.011, 0.05], [0.017, 0.054], [0.017, 0.07], [0.011, 0.07], [0.011, 0.062], [0, 0.062]];
const KING: [number, number][] = [[0, 0], [0.022, 0], [0.022, 0.008], [0.012, 0.016], [0.008, 0.06], [0.016, 0.066], [0.011, 0.072], [0.015, 0.09], [0.006, 0.094], [0, 0.094]];

/** A wooden chess set mid-game (board 0.44 m). Stands on y = 0. */
export function chessSet(): Part[] {
  const out: Part[] = [rbox(0.48, 0.03, 0.48, 0, 0, 0, M.walnutDark, { radius: 0.006 }), box(0.44, 0.006, 0.44, 0, 0.03, 0, "#e7d9bd")];
  for (let i = 0; i < 64; i++) if ((i + Math.floor(i / 8)) % 2) out.push(box(0.055, 0.007, 0.055, -0.1925 + (i % 8) * 0.055, 0.03, -0.1925 + Math.floor(i / 8) * 0.055, "#5a3f2a"));
  const sq = (f: number, r: number): [number, number] => [-0.1925 + f * 0.055, -0.1925 + r * 0.055];
  const light = "#efe6d2", dark = "#1d1612";
  const put = (pts: [number, number][], f: number, r: number, c: string) => { const [x, z] = sq(f, r); out.push(lathe(pts, x, 0.036, z, c, { rough: 0.35, seg: 14 })); };
  [[0, 1], [1, 1], [2, 2], [5, 1], [6, 1], [7, 1], [3, 3]].forEach(([f, r]) => put(PAWN, f, r, light));
  [[0, 6], [1, 6], [4, 4], [5, 6], [6, 6], [7, 5]].forEach(([f, r]) => put(PAWN, f, r, dark));
  put(ROOK, 0, 0, light); put(ROOK, 7, 0, light); put(KING, 4, 0, light); put(KING, 3, 2, light);
  put(ROOK, 0, 7, dark); put(ROOK, 5, 7, dark); put(KING, 4, 7, dark); put(KING, 2, 5, dark);
  return out;
}

/** A handheld game console on a little stand, drawn larger than life so it reads from across the room. */
export const handheld = (): Part[] => [
  rbox(0.16, 0.012, 0.1, 0, 0, 0, M.walnut, { radius: 0.004 }),
  rbox(0.19, 0.3, 0.045, 0, 0.012, 0, "#d2ccbd", { radius: 0.018, rot: [-0.3, 0, 0], rough: 0.5 }),
  box(0.145, 0.125, 0.004, 0, 0.165, 0.062, "#59663a", { rot: [-0.3, 0, 0] }),
  box(0.12, 0.1, 0.004, 0, 0.176, 0.066, "#9bbc0f", { rot: [-0.3, 0, 0], glow: "#b6d36a", glowI: 1.1 }),
  ...[[0, 0.004], [0.022, 0.004], [-0.022, 0.004], [0, 0.026], [0, -0.018]].map(([dx, dy]) => box(0.02, 0.02, 0.008, -0.045 + dx, 0.075 + dy, 0.03 - dy * 0.3, "#26262a", { rot: [-0.3, 0, 0] })),
  ball(0.013, 0.04, 0.09, 0.036, "#a8322e"), ball(0.013, 0.068, 0.103, 0.032, "#a8322e"),
];

export const beanbag = (color = "#7a543f"): Part[] => [
  ell(0.46, 0.3, 0.46, 0, 0.28, 0, color, { tex: "fabric", rough: 1 }),
  ell(0.34, 0.26, 0.3, -0.02, 0.5, -0.14, color, { tex: "fabric", rough: 1 }),
  ell(0.2, 0.06, 0.2, 0.03, 0.56, 0.1, "#6a4735", { rough: 1 }),
];

export const coatStand = (): Part[] => [
  lathe([[0, 0], [0.19, 0], [0.19, 0.02], [0.03, 0.05]], 0, 0, 0, M.walnutDark),
  cyl(0.018, 1.7, 0, 0.04, 0, M.walnutDark, { tex: "grain" }),
  ...[0, 1, 2, 3].map((i) => cyl(0.008, 0.16, Math.cos(i * H) * 0.06, 1.56, Math.sin(i * H) * 0.06, M.walnutDark, { rot: [Math.sin(i * H) * 0.8, 0, -Math.cos(i * H) * 0.8] })),
  rbox(0.34, 0.62, 0.14, 0.1, 0.98, 0.04, "#3b4a5a", { radius: 0.06, tex: "fabric" }),
  ell(0.13, 0.05, 0.1, -0.08, 1.7, 0, "#2a2622"),
];

/* ---------- cinema ---------- */
/** A three-seat sofa with loose cushions (2.3 × 0.95 × 0.85). Its seat faces +z. */
export const sofa = (color = M.olive): Part[] => [
  ...[[-1.0, -0.38], [1.0, -0.38], [-1.0, 0.38], [1.0, 0.38]].map(([x, z]) => cyl(0.025, 0.1, x, 0, z, M.walnut, { r2: 0.035 })),
  rbox(2.26, 0.24, 0.92, 0, 0.1, 0, color, { radius: 0.05, tex: "fabric", rough: 1 }),
  rbox(2.26, 0.62, 0.18, 0, 0.12, -0.38, color, { radius: 0.07, tex: "fabric", rough: 1 }),
  ...[-1.06, 1.06].map((x) => rbox(0.2, 0.52, 0.92, x, 0.12, 0, color, { radius: 0.08, tex: "fabric", rough: 1 })),
  ...[-0.63, 0, 0.63].map((x) => rbox(0.62, 0.15, 0.66, x, 0.32, 0.08, "#627247", { radius: 0.06, tex: "fabric", rough: 1 })),
  ...[-0.63, 0, 0.63].map((x) => rbox(0.6, 0.4, 0.18, x, 0.46, -0.24, "#5d6d43", { radius: 0.08, rot: [-0.18, 0, 0], tex: "fabric", rough: 1 })),
  rbox(0.38, 0.38, 0.13, -0.72, 0.5, 0.0, M.mustard, { radius: 0.06, rot: [-0.35, 0.35, 0.1], tex: "fabric" }),
  rbox(0.34, 0.34, 0.12, 0.76, 0.5, 0.02, M.brick, { radius: 0.06, rot: [-0.3, -0.3, -0.08], tex: "fabric" }),
  rbox(0.55, 0.03, 0.8, 0.5, 0.47, 0.12, "#d2c3a4", { radius: 0.012, rot: [0, 0.18, 0.03], tex: "fabric" }),
];

/** A roll-down projection screen, lit by the projector (3.2 × 1.9, bottom edge 0.7 m up). Faces +z. */
export const projectionScreen = (): Part[] => [
  rod(3.34, 0.05, 0, 2.56, 0.06, "x", "#1c1c1f", { rough: 0.4 }),
  ...[-1.62, 1.62].map((x) => box(0.05, 0.12, 0.1, x, 2.5, 0.03, "#1c1c1f")),
  box(3.2, 1.86, 0.008, 0, 0.7, 0.05, "#0e0e10"),
  box(3.06, 1.72, 0.008, 0, 0.77, 0.056, "#dfe4f0", { glow: "#c9d3ee", glowI: 0.6, rough: 1 }),
  rod(3.2, 0.018, 0, 0.69, 0.05, "x", "#1c1c1f"),
  cyl(0.003, 0.2, 0, 0.48, 0.05, "#cfcfcf"), ball(0.014, 0, 0.47, 0.05, "#cfcfcf"),
];

/** A projector on a low stand. Its lens faces −z (toward the screen). */
export const projectorOnStand = (): Part[] => [
  rbox(0.56, 0.035, 0.42, 0, 0.59, 0, M.walnut, { radius: 0.012, tex: "grain" }),
  ...[[-0.23, -0.16], [0.23, -0.16], [-0.23, 0.16], [0.23, 0.16]].map(([x, z]) => cyl(0.016, 0.6, x, 0, z, M.walnutDark, { r2: 0.024 })),
  box(0.5, 0.02, 0.36, 0, 0.26, 0, M.walnutDark), ...bookStack(0.05, 0.28, 0, 3, 8),
  rbox(0.36, 0.13, 0.3, 0, 0.625, 0, "#e3ded3", { radius: 0.03, rough: 0.4 }),
  cyl(0.055, 0.05, 0.08, 0.69, -0.16, "#1d1d20", { rot: [H, 0, 0] }),
  cyl(0.04, 0.012, 0.08, 0.69, -0.19, "#bcd0ff", { rot: [H, 0, 0], glow: "#dfe8ff", glowI: 3 }),
  ...[0, 1, 2, 3].map((i) => box(0.01, 0.05, 0.004, -0.13 + i * 0.022, 0.66, -0.151, "#9a968c")),
  ball(0.008, -0.14, 0.76, 0.1, "#39d67a", { glow: "#3cff8c", glowI: 2 }),
];

/** The record console: a mid-century cabinet of LPs with a turntable and two speakers on top (1.5 × 0.44 × 0.62). */
export function recordConsole(): Part[] {
  const out: Part[] = [
    ...[[-0.66, -0.16], [0.66, -0.16], [-0.66, 0.16], [0.66, 0.16]].map(([x, z]) => cyl(0.014, 0.16, x, 0, z, M.walnutDark, { r2: 0.026 })),
    rbox(1.5, 0.46, 0.44, 0, 0.16, 0, M.walnut, { radius: 0.014, tex: "grain", rough: 0.5 }),
    box(1.42, 0.38, 0.02, 0, 0.2, 0.2, "#231710"),
    box(0.02, 0.38, 0.4, 0, 0.2, 0.01, M.walnut),
  ];
  const colors = ["#161616", M.brick, M.mustard, M.navy, M.linen, "#3f6b4a"];
  for (let i = 0; i < 20; i++) out.push(box(0.012, 0.32, 0.31, -0.68 + i * 0.032, 0.2, 0.03, colors[(i * 5) % 6], { rot: [0, 0, i % 7 === 3 ? -0.08 : 0] }));
  out.push(...move(turntable(), 0.36, 0.62, 0), ...move(speaker(0.3), -0.5, 0.62, 0), ...move(tableLamp(M.navy), 0.02, 0.62, -0.08));
  return out;
}

/** A turntable with a record on the platter and a clear dust cover. Stands on y = 0. */
export const turntable = (): Part[] => [
  rbox(0.46, 0.07, 0.36, 0, 0, 0, "#2c1d14", { radius: 0.012, tex: "grain" }),
  cyl(0.155, 0.014, -0.04, 0.07, 0, "#8d8d8d", { metal: 0.8, rough: 0.3, seg: 40 }),
  cyl(0.15, 0.004, -0.04, 0.084, 0, "#0c0c0c", { rough: 0.25, seg: 40 }),
  cyl(0.05, 0.005, -0.04, 0.0845, 0, M.brick, { seg: 24 }), cyl(0.004, 0.012, -0.04, 0.085, 0, "#cfcfcf"),
  cyl(0.022, 0.03, 0.17, 0.07, -0.12, "#bdbdbd", { metal: 0.8, rough: 0.3 }),
  box(0.012, 0.01, 0.24, 0.13, 0.095, -0.01, "#cfcfcf", { rot: [0, 0.34, 0], metal: 0.8, rough: 0.3 }),
  box(0.026, 0.012, 0.04, 0.09, 0.09, 0.1, "#1d1d20", { rot: [0, 0.34, 0] }),
  cyl(0.012, 0.01, 0.18, 0.07, 0.13, "#1d1d20"), cyl(0.012, 0.01, 0.14, 0.07, 0.13, "#1d1d20"),
  rbox(0.46, 0.09, 0.36, 0, 0.072, 0, "#bfd3d8", { radius: 0.012, opacity: 0.16, rough: 0.05 }),
];

const BOTTLES: [number, number][][] = [
  [[0, 0], [0.04, 0], [0.04, 0.16], [0.034, 0.185], [0.014, 0.21], [0.014, 0.26], [0.018, 0.262], [0.018, 0.28], [0, 0.28]],
  [[0, 0], [0.05, 0], [0.052, 0.1], [0.04, 0.14], [0.015, 0.17], [0.015, 0.22], [0.019, 0.222], [0.019, 0.24], [0, 0.24]],
  [[0, 0], [0.032, 0], [0.034, 0.2], [0.026, 0.23], [0.013, 0.25], [0.013, 0.3], [0.017, 0.302], [0.017, 0.32], [0, 0.32]],
];
const GLASS: [number, number][] = [[0, 0], [0.034, 0], [0.04, 0.085], [0.036, 0.085], [0.031, 0.012]];

/** The whisky shelf: three backlit rows of bottles and a tray of glasses (1.15 × 0.36 × 1.85). */
export function whiskyShelf(): Part[] {
  const r = seeded(31);
  const out: Part[] = [
    box(0.04, 1.85, 0.36, -0.555, 0, 0, M.walnutDark, { tex: "grain" }), box(0.04, 1.85, 0.36, 0.555, 0, 0, M.walnutDark, { tex: "grain" }),
    box(1.11, 1.85, 0.012, 0, 0, -0.17, "#1c120c"), box(1.15, 0.04, 0.37, 0, 1.81, 0, M.walnutDark, { tex: "grain" }),
    rbox(1.11, 0.5, 0.35, 0, 0, 0, M.walnutDark, { radius: 0.01, tex: "grain" }),
    ...[-0.27, 0.27].map((x) => ball(0.014, x, 0.3, 0.185, M.brass, { metal: 0.8, rough: 0.3 })),
  ];
  const liquids = ["#b5651d", "#d8a24a", "#8a3b1a", "#c98b2a", "#e0b060"];
  [0.5, 0.93, 1.36].forEach((y, row) => {
    out.push(box(1.07, 0.025, 0.32, 0, y, 0.01, M.walnut, { tex: "grain" }), box(1.03, 0.008, 0.012, 0, y + 0.03, -0.15, M.bulb, { glow: "#ffb866", glowI: 2.6 }));
    for (let i = 0; i < 6; i++) {
      const shape = BOTTLES[(i + row) % 3], x = -0.44 + i * 0.176 + (r() - 0.5) * 0.03;
      out.push(lathe(shape, x, y + 0.025, 0.02 + (r() - 0.5) * 0.06, liquids[(i * 3 + row) % 5], { opacity: 0.88, rough: 0.12, glow: "#a8601e", glowI: 0.3, seg: 16 }));
      out.push(box(0.05, 0.06, 0.004, x, y + 0.085, 0.064, row === 1 && i % 2 ? "#1c1c1c" : M.paper));
    }
  });
  out.push(rbox(0.5, 0.012, 0.22, -0.22, 0.5, 0.04, "#8d8d8d", { radius: 0.005, metal: 0.8, rough: 0.3 }));
  for (let i = 0; i < 3; i++) out.push(lathe(GLASS, -0.38 + i * 0.13, 0.512, 0.05, "#dfe8ee", { opacity: 0.35, rough: 0.05, seg: 16 }));
  out.push(lathe([[0, 0], [0.035, 0], [0.045, 0.1], [0.02, 0.16], [0.02, 0.2]], 0.3, 0.5, 0.04, "#aeb4b8", { metal: 0.9, rough: 0.25 }));
  return out;
}

export const barStool = (): Part[] => [
  lathe([[0, 0], [0.17, 0], [0.17, 0.012], [0.02, 0.035]], 0, 0, 0, M.steel, { metal: 0.8, rough: 0.35 }),
  cyl(0.02, 0.68, 0, 0.03, 0, M.steel, { metal: 0.8, rough: 0.35 }),
  lathe([[0.15, 0], [0.155, 0.01]], 0, 0.28, 0, M.steel, { metal: 0.8, rough: 0.35 }),
  rbox(0.34, 0.07, 0.34, 0, 0.7, 0, "#3a2a20", { radius: 0.034, rough: 0.6 }),
];

/** A round poker table with a padded rail, chips, cards and a drink (⌀1.64 × 0.76). */
export function pokerTable(): Part[] {
  const out: Part[] = [
    lathe([[0, 0], [0.36, 0], [0.36, 0.03], [0.1, 0.07], [0.07, 0.6], [0.2, 0.7]], 0, 0, 0, M.walnutDark, { tex: "grain" }),
    cyl(0.8, 0.045, 0, 0.7, 0, M.walnut, { seg: 48, tex: "grain" }),
    lathe([[0.82, 0], [0.84, 0.03], [0.82, 0.06], [0.72, 0.062], [0.7, 0.035]], 0, 0.72, 0, "#2a1c14", { seg: 48, rough: 0.55 }),
    cyl(0.71, 0.012, 0, 0.745, 0, M.felt, { seg: 48, tex: "felt", rough: 1 }),
    lathe([[0.5, 0], [0.505, 0.002]], 0, 0.757, 0, "#d8c9a0", { seg: 48 }),
  ];
  const chips = ["#c2452f", M.navy, M.linen, "#1a1a1a", "#3f7a45"];
  [[0.28, 0.12, 5, 0], [0.22, 0.2, 3, 1], [-0.3, 0.22, 6, 2], [-0.22, 0.3, 2, 3], [0.02, -0.42, 4, 4], [-0.08, -0.38, 3, 0], [0.42, -0.25, 2, 1]].forEach(([x, z, n, c]) => {
    for (let i = 0; i < n; i++) out.push(cyl(0.03, 0.009, x, 0.757 + i * 0.0095, z, chips[c], { seg: 16, rough: 0.5 }));
  });
  [-0.14, -0.07, 0, 0.07, 0.14].forEach((x, i) => out.push(rbox(0.058, 0.002, 0.084, x, 0.758, 0, M.paper, { radius: 0.001 }), box(0.02, 0.0025, 0.03, x, 0.758, 0, i % 2 ? "#b3261e" : "#17161a")));
  [[0.36, 0.42, 0.5], [0.44, 0.38, 0.9], [-0.42, -0.3, -0.6], [-0.36, -0.36, -0.2]].forEach(([x, z, a]) => out.push(rbox(0.058, 0.002, 0.084, x, 0.758, z, "#8f2626", { radius: 0.001, rot: [0, a, 0] })));
  out.push(lathe(GLASS, -0.45, 0.757, 0.1, "#dfe8ee", { opacity: 0.35, rough: 0.05, seg: 16 }), cyl(0.03, 0.035, -0.45, 0.762, 0.1, M.amber, { opacity: 0.85, glow: "#a8601e", glowI: 0.4 }));
  out.push(cyl(0.028, 0.008, 0.12, 0.757, -0.2, M.paper, { seg: 16 }));
  return out;
}

/** A leather dining chair. Its seat faces +z. */
export const diningChair = (): Part[] => [
  ...[[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]].map(([x, z]) => cyl(0.018, z < 0 ? 0.92 : 0.44, x, 0, z, M.walnut, { r2: 0.024 })),
  rbox(0.46, 0.07, 0.46, 0, 0.42, 0, "#2c2520", { radius: 0.03, rough: 0.55 }),
  rbox(0.44, 0.36, 0.05, 0, 0.56, -0.2, "#2c2520", { radius: 0.025, rot: [-0.08, 0, 0], rough: 0.55 }),
];

export const towerSpeaker = (): Part[] => [
  rbox(0.3, 1.05, 0.3, 0, 0, 0, "#17161a", { radius: 0.015 }),
  ...[0.3, 0.55].map((y) => cyl(0.1, 0.012, 0, y, 0.15, "#2c2c31", { rot: [H, 0, 0] })), ...[0.3, 0.55].map((y) => ell(0.05, 0.05, 0.012, 0, y, 0.156, "#0c0c0e")),
  cyl(0.045, 0.012, 0, 0.85, 0.15, "#2c2c31", { rot: [H, 0, 0] }),
];

export const sideTable = (): Part[] => [
  cyl(0.26, 0.025, 0, 0.5, 0, M.walnut, { seg: 32, tex: "grain" }),
  ...[0, 1, 2].map((i) => cyl(0.014, 0.52, Math.cos(i * 2.1) * 0.16, 0, Math.sin(i * 2.1) * 0.16, M.walnutDark, { rot: [Math.sin(i * 2.1) * 0.12, 0, -Math.cos(i * 2.1) * 0.12] })),
];

export const popcorn = (): Part[] => [
  lathe([[0, 0], [0.05, 0], [0.075, 0.14], [0.07, 0.14]], 0, 0, 0, "#c2452f", { seg: 12 }),
  ...[0, 1, 2, 3, 4, 5, 6].map((i) => ball(0.022, Math.cos(i * 0.9) * 0.035, 0.15 + (i % 3) * 0.012, Math.sin(i * 0.9) * 0.035, "#f5e8c8", { rough: 1 })),
];

export const lpCrate = (): Part[] => [
  ...[-0.2, 0.2].map((x) => box(0.02, 0.3, 0.36, x, 0, 0, M.oak, { tex: "grain" })), ...[-0.17, 0.17].map((z) => box(0.42, 0.09, 0.02, 0, 0.02, z, M.oak, { tex: "grain" })),
  ...[-0.17, 0.17].map((z) => box(0.42, 0.09, 0.02, 0, 0.18, z, M.oak, { tex: "grain" })), box(0.4, 0.02, 0.34, 0, 0, 0, M.oak),
  ...Array.from({ length: 10 }, (_, i) => box(0.31, 0.31, 0.007, 0, 0.03, -0.14 + i * 0.03, ["#161616", M.brick, M.navy, M.mustard, M.linen][i % 5], { rot: [-0.14, 0, 0] })),
];

/* ---------- bedroom ---------- */
/** A queen bed with a padded headboard, duvet and pillows (1.7 × 2.15 × 1.05). The headboard is at −z. */
export const bed = (): Part[] => [
  rbox(1.72, 0.3, 2.12, 0, 0.04, 0.02, M.walnut, { radius: 0.02, tex: "grain" }),
  ...[[-0.8, -0.98], [0.8, -0.98], [-0.8, 1.02], [0.8, 1.02]].map(([x, z]) => cyl(0.03, 0.06, x, 0, z, M.walnutDark)),
  rbox(1.62, 0.22, 2.02, 0, 0.32, 0.02, "#efe9dd", { radius: 0.07, tex: "fabric", rough: 1 }),
  rbox(1.74, 0.13, 1.42, 0, 0.47, 0.34, M.slate, { radius: 0.06, tex: "fabric", rough: 1 }),
  rbox(1.74, 0.07, 0.22, 0, 0.535, -0.36, "#e9e2d4", { radius: 0.03, tex: "fabric", rough: 1 }),
  rbox(0.68, 0.15, 0.4, -0.4, 0.52, -0.72, "#f6f1e6", { radius: 0.07, rot: [0.2, 0.05, 0], tex: "fabric", rough: 1 }),
  rbox(0.68, 0.15, 0.4, 0.4, 0.52, -0.72, "#f6f1e6", { radius: 0.07, rot: [0.2, -0.04, 0], tex: "fabric", rough: 1 }),
  rbox(0.4, 0.3, 0.12, 0.05, 0.58, -0.52, M.mustard, { radius: 0.05, rot: [-0.5, 0.1, 0], tex: "fabric" }),
  rbox(1.76, 0.05, 0.5, 0, 0.59, 0.72, "#cbb894", { radius: 0.02, tex: "fabric", rough: 1 }),
  rbox(1.82, 1.02, 0.07, 0, 0, -1.06, M.walnutDark, { radius: 0.02 }),
  ...[-0.57, 0, 0.57].map((x) => rbox(0.54, 0.58, 0.07, x, 0.4, -1.01, "#7b6a58", { radius: 0.035, tex: "fabric", rough: 1 })),
];

export const nightstand = (): Part[] => [
  rbox(0.46, 0.44, 0.4, 0, 0.06, 0, M.walnut, { radius: 0.014, tex: "grain" }),
  ...[[-0.19, -0.16], [0.19, -0.16], [-0.19, 0.16], [0.19, 0.16]].map(([x, z]) => cyl(0.014, 0.07, x, 0, z, M.walnutDark, { r2: 0.02 })),
  box(0.4, 0.004, 0.01, 0, 0.28, 0.201, "#2a1c12"), ...[0.18, 0.38].map((y) => ball(0.012, 0, y, 0.21, M.brass, { metal: 0.8, rough: 0.3 })),
];

export const wardrobe = (): Part[] => [
  rbox(1.3, 2.1, 0.6, 0, 0.05, 0, M.walnutDark, { radius: 0.012, tex: "grain" }), box(1.24, 0.05, 0.54, 0, 0, 0, "#1c120c"),
  ...[-0.325, 0.325].map((x) => rbox(0.63, 2.0, 0.02, x, 0.1, 0.3, M.walnut, { radius: 0.006, tex: "grain" })),
  ...[-0.05, 0.05].map((x) => cyl(0.007, 0.22, x, 1.0, 0.325, M.brass, { metal: 0.8, rough: 0.3 })),
  rbox(0.5, 0.2, 0.34, -0.3, 2.15, 0, "#a08a6a", { radius: 0.02 }), rbox(0.42, 0.14, 0.3, 0.32, 2.15, 0.02, M.navy, { radius: 0.03, tex: "fabric" }),
];

export function clothesRack(): Part[] {
  const out: Part[] = [
    ...[-0.5, 0.5].flatMap((x) => [cyl(0.009, 1.5, x, 0, 0, M.steel, { metal: 0.7, rough: 0.35 }), rod(0.4, 0.009, x, 0.015, 0, "z", M.steel, { metal: 0.7, rough: 0.35 })]),
    rod(1.02, 0.009, 0, 1.5, 0, "x", M.steel, { metal: 0.7, rough: 0.35 }), rbox(0.98, 0.02, 0.3, 0, 0.18, 0, M.oak, { radius: 0.008, tex: "grain" }),
  ];
  [["#3b4a5a", 0.78], [M.brick, 0.6], [M.linen, 0.7], [M.oliveDark, 0.9], ["#2b2622", 0.66]].forEach(([c, len], i) => {
    const x = -0.36 + i * 0.18;
    out.push(rbox(0.045, len as number, 0.4, x, 1.42 - (len as number), 0, c as string, { radius: 0.02, tex: "fabric", rough: 1 }), rod(0.4, 0.004, x, 1.44, 0, "z", M.oak));
  });
  out.push(rbox(0.3, 0.1, 0.12, -0.2, 0.21, 0, "#e8e4dc", { radius: 0.04 }), rbox(0.3, 0.1, 0.12, 0.22, 0.21, 0, "#3a3a40", { radius: 0.04 }));
  return out;
}

export const smallDesk = (): Part[] => [
  rbox(0.9, 0.035, 0.46, 0, 0.715, 0, M.oak, { radius: 0.01, tex: "grain" }),
  ...[[-0.4, -0.19], [0.4, -0.19], [-0.4, 0.19], [0.4, 0.19]].map(([x, z]) => cyl(0.016, 0.72, x, 0, z, M.oak, { r2: 0.024 })),
  rbox(0.84, 0.09, 0.4, 0, 0.625, 0, "#9a7850", { radius: 0.008 }), ball(0.012, 0, 0.67, 0.205, M.brass, { metal: 0.8, rough: 0.3 }),
];

export const slippers = (): Part[] => [ell(0.05, 0.03, 0.12, 0, 0.03, 0, "#cbbba6", { rot: [0, 0.2, 0], rough: 1 }), ell(0.05, 0.03, 0.12, 0.14, 0.03, 0.03, "#cbbba6", { rot: [0, -0.1, 0], rough: 1 })];

export const moonLamp = (): Part[] => [
  lathe([[0, 0], [0.06, 0], [0.05, 0.03], [0.02, 0.05]], 0, 0, 0, M.walnutDark),
  ball(0.16, 0, 0.2, 0, "#f3e8d0", { glow: "#ffe9b8", glowI: 1.4, rough: 1 }),
];

export const alarmClock = (): Part[] => [rbox(0.11, 0.065, 0.05, 0, 0, 0, "#232327", { radius: 0.012 }), box(0.085, 0.036, 0.003, 0, 0.016, 0.026, "#ff8a5a", { glow: "#ff8a5a", glowI: 1.8 })];

export const wallClock = (): Part[] => [
  cyl(0.18, 0.035, 0, 0, 0, M.walnutDark, { rot: [H, 0, 0], seg: 40 }), cyl(0.16, 0.036, 0, 0, 0.002, "#f5efe4", { rot: [H, 0, 0], seg: 40, rough: 1 }),
  box(0.012, 0.1, 0.006, 0.02, 0, 0.022, M.black, { rot: [0, 0, -0.5] }), box(0.009, 0.14, 0.006, -0.03, -0.01, 0.022, M.black, { rot: [0, 0, 0.9] }), ball(0.012, 0, 0, 0.024, M.brass, { metal: 0.8 }),
];

export const wasteBin = (): Part[] => [lathe([[0, 0], [0.12, 0], [0.15, 0.3], [0.14, 0.3], [0.112, 0.012]], 0, 0, 0, "#4a4a50", { metal: 0.3, rough: 0.5 }), ball(0.05, 0.02, 0.26, 0.02, M.paper, { rough: 1 }), ball(0.04, -0.04, 0.24, -0.02, M.paper, { rough: 1 })];

export const gameConsole = (): Part[] => [rbox(0.34, 0.07, 0.26, 0, 0, 0, "#e8e4dc", { radius: 0.02, rough: 0.4 }), box(0.3, 0.004, 0.004, 0, 0.035, 0.131, "#4ab8ff", { glow: "#4ab8ff", glowI: 2 }),
  rbox(0.15, 0.04, 0.1, 0.05, 0.07, 0.02, "#2a2a2e", { radius: 0.018, rot: [0, 0.3, 0] })];

export const headphones = (): Part[] => [
  cyl(0.05, 0.01, 0, 0, 0, M.black), cyl(0.008, 0.24, 0, 0.01, 0, M.black),
  lathe([[0.075, 0], [0.085, 0.02], [0.075, 0.04]], 0, 0.3, -0.02, "#2a2a2e", { rot: [H, 0, 0], seg: 20 }),
  ...[-0.085, 0.085].map((x) => ell(0.022, 0.045, 0.04, x, 0.27, 0, "#3a3a40")),
];

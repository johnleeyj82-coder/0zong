import { ball, box, bulb, C, cyl, plant, poster, type Space } from "../kit";

const H = Math.PI / 2;

/** The main room: desk with dual monitors (game, security study), bookshelf, easel, and a display stand for the minigames. */
export const main: Space = {
  id: "main",
  size: [6.4, 5, 2.8],
  wall: "#4a3a2e",
  floor: "#5a3e2a",
  window: { x: 0, y: 0.95, w: 2.6, h: 1.55 },
  view: { pos: [0, 2.6, 6.4], target: [0, 1, -0.6] },
  bubble: [0, 1.75, -1.25],
  from: {
    cinema: { pos: [-2.3, 2.4, 5.7], target: [-0.2, 1, -0.6] },
    bedroom: { pos: [2.3, 2.4, 5.7], target: [0.2, 1, -0.6] },
  },
  lamps: [
    { at: [0.98, 1.22, -2.12], power: 3 },
    { at: [-2.45, 1.62, -0.3], power: 5 },
    { at: [2.55, 1.5, -0.2], power: 2.2, distance: 3 },
  ],
  doors: [
    { id: "to-cinema", to: "cinema", at: [-3.14, 0, 1.3], rotY: H, label: "영화방으로" },
    { id: "to-bedroom", to: "bedroom", at: [3.14, 0, 1.3], rotY: -H, label: "침실로" },
  ],
  things: [
    { key: "rug", at: [0, 0, 0.3], parts: [box(3.4, 0.012, 2.4, 0, 0, 0, C.rug), box(3.1, 0.014, 2.1, 0, 0, 0, "#7f3a32")] },
    {
      key: "desk", at: [0, 0, -2.12],
      parts: [
        box(2.3, 0.05, 0.72, 0, 0.72, 0, C.wood),
        box(0.05, 0.72, 0.68, -1.1, 0, 0, C.woodDark), box(0.05, 0.72, 0.68, 1.1, 0, 0, C.woodDark),
        box(0.4, 0.55, 0.6, 0.78, 0.05, 0, C.black),
        box(0.16, 0.24, 0.16, -1.0, 0.77, -0.1, C.black), box(0.16, 0.24, 0.16, 0.72, 0.77, -0.1, C.black),
        box(0.62, 0.02, 0.2, 0, 0.77, 0.2, "#2a2a2e"),
        // chair
        box(0.5, 0.08, 0.5, 0, 0.45, 0.85, C.black), box(0.5, 0.6, 0.07, 0, 0.55, 1.08, C.black),
        cyl(0.03, 0.45, 0, 0, 0.85, C.metal), cyl(0.28, 0.03, 0, 0.02, 0.85, C.metal),
        // desk lamp
        cyl(0.07, 0.02, 0.98, 0.77, -0.05, C.black), box(0.02, 0.36, 0.02, 0.98, 0.79, -0.05, C.black),
        cyl(0.04, 0.1, 0.98, 1.16, -0.05, C.black, { r2: 0.09 }), bulb(0.98, 1.17, -0.05, 0.035),
      ],
    },
    {
      key: "monitor-left", hobby: "game", at: [-0.42, 0, -2.2],
      parts: [
        cyl(0.1, 0.012, 0, 0.77, 0, C.black), box(0.04, 0.16, 0.04, 0, 0.78, 0, C.black),
        box(0.8, 0.47, 0.035, 0, 0.92, 0, C.black), box(0.76, 0.43, 0.01, 0, 0.94, 0.02, "#33507a", { glow: "#4a6fa8", glowI: 1.1 }),
      ],
    },
    {
      key: "monitor-right", hobby: "hack", at: [0.42, 0, -2.2],
      parts: [
        cyl(0.1, 0.012, 0, 0.77, 0, C.black), box(0.04, 0.16, 0.04, 0, 0.78, 0, C.black),
        box(0.8, 0.47, 0.035, 0, 0.92, 0, C.black), box(0.76, 0.43, 0.01, 0, 0.94, 0.02, "#123322", { glow: "#2fae6a", glowI: 0.9 }),
      ],
    },
    {
      key: "bookshelf", hobby: "book", at: [-2.96, 0, -1.55], rotY: H,
      parts: [
        box(1.5, 2.0, 0.34, 0, 0, 0, C.woodDark),
        ...[0.05, 0.5, 0.95, 1.4].map((y) => box(1.42, 0.03, 0.3, 0, y, 0.03, C.wood)),
        ...[0.08, 0.53, 0.98, 1.43].flatMap((y, row) =>
          Array.from({ length: 9 }, (_, i) => box(0.1, 0.3 + ((i * 7 + row * 3) % 5) * 0.025, 0.22, -0.6 + i * 0.14 + (row % 2) * 0.04, y, 0.04,
            ["#8a3b2c", "#c9a24a", "#2f4f6b", "#5a6b3a", "#d8cfbd", "#6b3d5a"][(i + row * 2) % 6]))),
      ],
    },
    {
      key: "posters", at: [-3.13, 0, 0.1], rotY: H,
      parts: [...poster(0.62, 0.86, -0.4, 1.75, 0, "#1d2a44"), ...poster(0.62, 0.86, 0.45, 1.75, 0, "#c0503a")],
    },
    { key: "plant-a", at: [-1.75, 0, -2.05], parts: plant(0, 0, 1.0) },
    {
      key: "floor-lamp", at: [-2.45, 0, -0.3],
      parts: [cyl(0.15, 0.03, 0, 0, 0, C.black), cyl(0.015, 1.5, 0, 0.03, 0, C.black), cyl(0.18, 0.22, 0, 1.52, 0, C.cream, { r2: 0.12, opacity: 0.92, glow: C.bulb, glowI: 0.5 })],
    },
    {
      key: "easel", hobby: "art", at: [2.05, 0, -1.85], rotY: -0.45,
      parts: [
        box(0.05, 1.75, 0.05, -0.3, 0, 0.1, C.woodLight, { rot: [-0.12, 0, 0.12] }),
        box(0.05, 1.75, 0.05, 0.3, 0, 0.1, C.woodLight, { rot: [-0.12, 0, -0.12] }),
        box(0.05, 1.7, 0.05, 0, 0, -0.25, C.woodLight, { rot: [0.25, 0, 0] }),
        box(0.7, 0.03, 0.08, 0, 0.75, 0.12, C.woodLight),
        box(0.66, 0.85, 0.03, 0, 0.8, 0.1, C.paper, { rot: [-0.1, 0, 0] }),
        box(0.4, 0.3, 0.035, -0.05, 1.05, 0.11, "#c06a4a", { rot: [-0.1, 0, 0] }),
      ],
    },
    {
      key: "display", label: "전시대", at: [2.92, 0, -0.2], rotY: -H,
      parts: [
        box(1.9, 0.95, 0.46, 0, 0, 0, C.woodDark), box(1.94, 0.03, 0.5, 0, 0.95, 0, C.wood),
        box(0.05, 0.6, 0.05, -0.92, 0.98, 0.0, C.black), box(0.05, 0.6, 0.05, 0.92, 0.98, 0.0, C.black),
        box(0.12, 0.08, 0.12, 0, 1.45, 0.05, C.black), bulb(0, 1.5, 0.12, 0.04),
      ],
    },
    {
      key: "chess", hobby: "chess", at: [2.92, 0, -0.68], rotY: -H,
      parts: [
        box(0.44, 0.04, 0.44, 0, 0.98, 0, C.cream),
        ...Array.from({ length: 16 }, (_, i) => box(0.11, 0.045, 0.11, -0.165 + (i % 4) * 0.11, 0.982, -0.165 + Math.floor(i / 4) * 0.11, "#2b2018")).filter((_, i) => (i + Math.floor(i / 4)) % 2 === 0),
        ...[-0.15, -0.05, 0.05, 0.15].map((x) => cyl(0.022, 0.09, x, 1.025, -0.15, C.paper)),
        ...[-0.15, -0.05, 0.05, 0.15].map((x) => cyl(0.022, 0.09, x, 1.025, 0.15, "#1a1410")),
        ball(0.03, 0.05, 1.15, -0.15, C.paper),
      ],
    },
    {
      key: "console", hobby: "tetris", at: [2.92, 0, 0.28], rotY: -H,
      parts: [
        box(0.2, 0.3, 0.06, 0, 0.98, 0, "#c9c3b4", { rot: [-0.25, 0, 0] }),
        box(0.15, 0.13, 0.01, 0, 1.12, 0.035, "#9fb85a", { rot: [-0.25, 0, 0], glow: "#b6d36a", glowI: 0.8 }),
        ball(0.018, -0.05, 1.03, 0.05, "#2a2a2e"), ball(0.018, 0.05, 1.03, 0.05, "#a8322e"),
      ],
    },
  ],
};

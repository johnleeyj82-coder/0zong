import { ball, bookStack, box, bulb, C, cyl, frame, mug, plant, poster, stringLights, type Space } from "../kit";

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
      parts: [...poster(0.62, 0.86, -0.4, 1.75, 0, "#1d2a44"), ...poster(0.62, 0.86, 0.45, 1.75, 0, "#c0503a"), ...frame(0.3, 0.22, 0.02, 1.15, 0, "#6b8a7a"), ...frame(0.22, 0.3, 0.42, 1.18, 0, "#d8b07a")],
    },
    { key: "plant-a", at: [-1.75, 0, -2.05], parts: plant(0, 0, 1.0) },
    {
      key: "floor-lamp", at: [-2.45, 0, -0.3],
      parts: [cyl(0.15, 0.03, 0, 0, 0, C.black), cyl(0.015, 1.5, 0, 0.03, 0, C.black), cyl(0.18, 0.22, 0, 1.52, 0, C.cream, { r2: 0.12, opacity: 0.92, glow: C.bulb, glowI: 0.5 })],
    },
    // lived-in details
    { key: "lights-back", at: [0, 0, -2.42], parts: stringLights([-3.0, 2.6, 0], [3.0, 2.6, 0], 22, 0.14) },
    {
      key: "desk-stuff", at: [0, 0, -2.12],
      parts: [
        ...mug(-0.72, 0.77, 0.18, "#c9502e"), ...bookStack(0.98, 0.77, 0.2, 2),
        box(0.12, 0.03, 0.08, 0.42, 0.77, 0.22, "#1d1d22"), box(0.32, 0.005, 0.24, 0.42, 0.77, 0.22, "#2b2f3a"),
        // headphones on a stand
        cyl(0.05, 0.01, -0.95, 0.77, 0.05, C.black), box(0.015, 0.26, 0.015, -0.95, 0.78, 0.05, C.black),
        cyl(0.07, 0.03, -0.95, 1.03, 0.05, "#2a2a2e", { rot: [0, 0, Math.PI / 2] }),
        // console under the desk
        box(0.36, 0.08, 0.26, -0.55, 0.05, 0.05, "#e8e4dc"), box(0.12, 0.02, 0.06, -0.55, 0.13, 0.18, "#3a3a40"),
      ],
    },
    {
      key: "wall-shelf", at: [-1.15, 0, -2.42],
      parts: [
        box(0.9, 0.03, 0.18, 0, 1.95, 0.08, C.wood),
        cyl(0.04, 0.12, -0.3, 1.98, 0.08, "#c2452f"), box(0.06, 0.16, 0.05, -0.1, 1.98, 0.08, "#2f4f6b"),
        ball(0.05, 0.12, 2.03, 0.08, "#e0c070"), box(0.18, 0.12, 0.02, 0.32, 1.98, 0.04, C.paper, { rot: [-0.15, 0, 0] }),
        ...plant(-0.42, 0.06, 0.25).map((pp) => ({ ...pp, at: [pp.at[0], pp.at[1] + 1.95, pp.at[2]] as [number, number, number] })),
      ],
    },
    { key: "clock", at: [1.55, 0, -2.44], parts: [cyl(0.17, 0.04, 0, 2.05, 0, C.cream, { rot: [Math.PI / 2, 0, 0] }), cyl(0.15, 0.045, 0, 2.05, 0, "#f5efe4", { rot: [Math.PI / 2, 0, 0] }),
      box(0.012, 0.1, 0.01, 0, 2.09, 0.03, C.black, { rot: [0, 0, -0.6] }), box(0.012, 0.13, 0.01, 0, 2.1, 0.03, C.black, { rot: [0, 0, 0.3] })] },
    { key: "canvases", at: [2.6, 0, -2.25], rotY: -0.3, parts: [
      box(0.5, 0.65, 0.03, 0, 0, 0, C.paper, { rot: [-0.15, 0, 0] }), box(0.4, 0.5, 0.03, 0.12, 0, 0.08, "#2f4f6b", { rot: [-0.18, 0, 0] }),
      box(0.35, 0.42, 0.03, -0.1, 0, 0.15, "#c06a4a", { rot: [-0.2, 0, 0] })] },
    { key: "paint-cart", at: [1.55, 0, -1.25], parts: [
      box(0.42, 0.04, 0.32, 0, 0.55, 0, C.metal), box(0.42, 0.04, 0.32, 0, 0.25, 0, C.metal),
      ...[[-0.19, -0.14], [0.19, -0.14], [-0.19, 0.14], [0.19, 0.14]].map(([x, z]) => box(0.02, 0.6, 0.02, x, 0, z, C.metal)),
      ...["#c2452f", "#2f6fb5", "#e8c24a", "#3c8a4a", "#f1ebe0"].map((c, i) => cyl(0.025, 0.1, -0.15 + i * 0.075, 0.59, -0.05, c)),
      cyl(0.05, 0.14, 0.1, 0.59, 0.08, "#8a7a6a"), box(0.008, 0.2, 0.008, 0.09, 0.7, 0.08, C.woodLight), box(0.008, 0.2, 0.008, 0.12, 0.7, 0.07, C.woodLight)] },
    { key: "beanbag", at: [-1.9, 0, 0.9], parts: [ball(0.45, 0, 0.32, 0, "#6a4a3a"), ball(0.3, -0.05, 0.62, -0.18, "#5e4234")] },
    { key: "floor-books", at: [-1.35, 0, 1.25], parts: bookStack(0, 0, 0, 4) },
    { key: "coat-stand", at: [2.7, 0, 2.15], parts: [cyl(0.18, 0.03, 0, 0, 0, C.woodDark), cyl(0.02, 1.7, 0, 0.03, 0, C.woodDark),
      ball(0.16, 0.08, 1.45, 0.05, "#3b4a5a"), cyl(0.12, 0.5, 0.05, 1.05, 0.05, "#3b4a5a", { r2: 0.08 }), cyl(0.09, 0.06, -0.06, 1.68, 0, "#2a2622")] },
    { key: "bin", at: [0.95, 0, -1.45], parts: [cyl(0.13, 0.3, 0, 0, 0, "#4a4a50", { r2: 0.15 }), ball(0.05, 0.03, 0.31, 0.02, C.paper)] },
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

import { ball, box, bulb, C, cyl, plant, type Space } from "../kit";

const H = Math.PI / 2;

/** The cinema: projector and screen, the LP turntable, the whisky shelf, the poker table and a sofa to watch from. */
export const cinema: Space = {
  id: "cinema",
  size: [6.4, 5.4, 2.8],
  wall: "#3a2c26",
  floor: "#4a3224",
  view: { pos: [0, 2.7, 6.6], target: [0, 1, -0.7] },
  from: { main: { pos: [2.5, 2.5, 5.9], target: [0.2, 1, -0.7] } },
  lamps: [
    { at: [-2.55, 1.55, 1.5], power: 5.5 },
    { at: [1.85, 1.75, 1.75], power: 4.5, distance: 4 },
    { at: [2.75, 1.95, -1.5], power: 2.2, distance: 3 },
    { at: [0, 1.6, -2.1], power: 1.6, color: "#c9d6ff", distance: 4 },
    { at: [-2.75, 1.05, -1.2], power: 1.6, distance: 2.5 },
  ],
  doors: [{ id: "to-main", to: "main", at: [3.14, 0, 0.6], rotY: -H, label: "메인 방으로" }],
  things: [
    { key: "rug", at: [0, 0, 0.5], parts: [box(3.2, 0.012, 2.6, 0, 0, 0, "#3b3f52"), box(2.9, 0.014, 2.3, 0, 0, 0, "#4b4f66")] },
    {
      key: "screen", hobby: "movie", at: [0, 0, -2.62],
      parts: [
        box(3.4, 0.08, 0.1, 0, 2.5, 0, C.black),
        box(3.2, 1.75, 0.02, 0, 0.72, 0.03, C.black),
        box(3.04, 1.62, 0.025, 0, 0.785, 0.04, "#dfe4f0", { glow: "#c9d3ee", glowI: 0.55 }),
      ],
    },
    {
      key: "projector", hobby: "video", at: [0, 0, 1.75],
      parts: [
        box(0.55, 0.62, 0.42, 0, 0, 0, C.woodDark),
        box(0.36, 0.14, 0.3, 0, 0.62, 0, "#d9d4ca"),
        cyl(0.05, 0.04, 0, 0.69, -0.17, "#2a2a2e", { rot: [H, 0, 0] }),
        cyl(0.035, 0.02, 0, 0.69, -0.19, "#bcd0ff", { rot: [H, 0, 0], glow: "#d9e4ff", glowI: 2 }),
      ],
    },
    {
      key: "sofa", label: "소파", at: [0, 0, 0.35], rotY: Math.PI,
      parts: [
        box(2.3, 0.42, 0.95, 0, 0, 0, C.green), box(2.3, 0.5, 0.22, 0, 0.42, -0.37, C.green),
        box(0.22, 0.62, 0.95, -1.15, 0, 0, "#344129"), box(0.22, 0.62, 0.95, 1.15, 0, 0, "#344129"),
        box(0.95, 0.12, 0.7, -0.52, 0.42, 0.08, "#465638"), box(0.95, 0.12, 0.7, 0.52, 0.42, 0.08, "#465638"),
      ],
    },
    {
      key: "turntable", hobby: "music", at: [-2.97, 0, -1.2], rotY: H,
      parts: [
        box(1.5, 0.62, 0.44, 0, 0, 0, C.wood), box(1.46, 0.02, 0.4, 0, 0.3, 0.03, C.woodDark),
        ...Array.from({ length: 10 }, (_, i) => box(0.012, 0.28, 0.27, -0.66 + i * 0.03, 0.02, 0.02, ["#1a1a1a", "#c2452f", "#e0c070", "#2d4f7a"][i % 4])),
        box(0.46, 0.1, 0.36, 0.1, 0.62, 0, "#2b1d14"),
        cyl(0.15, 0.015, 0.06, 0.72, 0, "#111"), cyl(0.05, 0.017, 0.06, 0.72, 0, "#c2452f"),
        box(0.02, 0.02, 0.2, 0.26, 0.74, -0.02, C.metal, { rot: [0, 0.4, 0] }),
        box(0.2, 0.32, 0.2, -0.5, 0.62, 0, C.black), cyl(0.06, 0.012, -0.5, 0.82, 0.1, "#333", { rot: [H, 0, 0] }),
        box(0.06, 0.4, 0.06, 0.58, 0.62, -0.05, C.black), cyl(0.1, 0.16, 0.58, 1.0, -0.05, C.cream, { r2: 0.06, glow: C.bulb, glowI: 0.5 }),
      ],
    },
    {
      key: "whisky", hobby: "whisky", at: [2.96, 0, -1.5], rotY: -H,
      parts: [
        box(1.15, 1.85, 0.36, 0, 0, 0, C.woodDark),
        ...[0.05, 0.6, 1.15].map((y) => box(1.08, 0.03, 0.32, 0, y, 0.02, C.wood)),
        ...[0.08, 0.63, 1.18].flatMap((y, row) =>
          Array.from({ length: 5 }, (_, i) => cyl(0.045, 0.28 - (i % 2) * 0.04, -0.4 + i * 0.2, y, 0.03,
            ["#b5651d", "#d8a24a", "#8a3b1a", "#c98b2a"][(i + row) % 4], { opacity: 0.85, glow: "#a8601e", glowI: 0.25 }))),
        ...[-0.2, 0, 0.2].map((x) => cyl(0.035, 0.08, x, 1.73, 0.05, "#d8e0e6", { opacity: 0.6 })),
        bulb(0, 1.95, 0.06, 0.04),
      ],
    },
    {
      key: "poker", hobby: "poker", at: [1.85, 0, 1.75],
      parts: [
        cyl(0.07, 0.72, 0, 0, 0, C.woodDark), cyl(0.35, 0.03, 0, 0, 0, C.woodDark),
        cyl(0.82, 0.06, 0, 0.72, 0, C.wood), cyl(0.72, 0.065, 0, 0.72, 0, C.felt),
        ...[[0.2, 0.1, "#c2452f"], [-0.25, 0.2, "#2d4f7a"], [0.05, -0.3, "#e8dcc6"], [-0.1, -0.05, "#1a1a1a"]].map(([x, z, c]) =>
          cyl(0.035, 0.06, x as number, 0.785, z as number, c as string)),
        box(0.07, 0.003, 0.1, 0.25, 0.786, -0.2, C.paper, { rot: [0, 0.3, 0] }), box(0.07, 0.003, 0.1, 0.34, 0.786, -0.18, C.paper, { rot: [0, -0.2, 0] }),
        cyl(0.04, 0.08, -0.35, 0.785, -0.2, "#d8a24a", { opacity: 0.8 }),
        ...[0, 2.1, 4.2].flatMap((a) => {
          const x = Math.sin(a) * 1.05, z = Math.cos(a) * 1.05;
          return [box(0.45, 0.06, 0.45, x, 0.44, z, C.leather, { rot: [0, a, 0] }), box(0.45, 0.5, 0.06, x + Math.sin(a) * 0.2, 0.5, z + Math.cos(a) * 0.2, C.leather, { rot: [0, a, 0] }),
            box(0.04, 0.44, 0.04, x, 0, z, C.woodDark)];
        }),
      ],
    },
    {
      key: "floor-lamp", at: [-2.55, 0, 1.5],
      parts: [cyl(0.15, 0.03, 0, 0, 0, C.black), cyl(0.015, 1.42, 0, 0.03, 0, C.black), cyl(0.2, 0.24, 0, 1.45, 0, C.cream, { r2: 0.13, opacity: 0.92, glow: C.bulb, glowI: 0.5 })],
    },
    { key: "plant", at: [-2.2, 0, -2.25], parts: plant(0, 0, 1.15) },
    {
      key: "poker-lamp", at: [1.85, 0, 1.75],
      parts: [box(0.01, 0.8, 0.01, 0, 2.0, 0, C.black), cyl(0.3, 0.16, 0, 1.84, 0, "#2f4a3a", { r2: 0.08 }), bulb(0, 1.82, 0, 0.05)],
    },
    { key: "side-table", at: [-1.5, 0, 0.45], parts: [cyl(0.25, 0.03, 0, 0.5, 0, C.woodDark), cyl(0.03, 0.5, 0, 0, 0, C.black), cyl(0.04, 0.09, 0.05, 0.53, 0, "#d8a24a", { opacity: 0.8 })] },
  ],
};

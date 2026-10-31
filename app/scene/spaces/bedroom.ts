import { ball, bookStack, box, bulb, C, cyl, frame, mug, plant, poster, stringLights, type Space } from "../kit";

const H = Math.PI / 2;

/** The bedroom. Lying down on the bed lets you choose what time it is in the house (only on your screen). */
export const bedroom: Space = {
  id: "bedroom",
  size: [5.2, 4.6, 2.8],
  wall: "#3c3a44",
  floor: "#5a4434",
  window: { x: 1.05, y: 0.95, w: 1.8, h: 1.5 },
  view: { pos: [0, 2.5, 5.9], target: [0, 0.9, -0.6] },
  from: { main: { pos: [-2.1, 2.4, 5.4], target: [-0.2, 0.9, -0.6] } },
  lamps: [{ at: [0.2, 0.86, -1.95], power: 3.2 }, { at: [-2.0, 2.2, -0.5], power: 1.4, distance: 3 }, { at: [-0.95, 1.7, -2.0], power: 1.8, distance: 2.5 }, { at: [1.95, 1.1, 0.55], power: 1.6, distance: 2.2 }],
  doors: [{ id: "to-main", to: "main", at: [-2.54, 0, 1.0], rotY: H, label: "메인 방으로" }],
  things: [
    { key: "rug", at: [-0.6, 0, 0.3], parts: [box(2.4, 0.012, 1.6, 0, 0, 0, "#8a7a6a")] },
    {
      key: "bed", action: "time", label: "침대 · 시간 바꾸기", at: [-0.95, 0, -1.2],
      parts: [
        box(1.7, 0.3, 2.15, 0, 0, 0, C.woodDark), box(1.6, 0.2, 2.05, 0, 0.3, 0, "#e8e2d6"),
        box(1.64, 0.08, 1.4, 0, 0.5, 0.36, "#6a7a8c"), box(1.66, 0.06, 0.2, 0, 0.5, -0.36, "#5d6c7d"),
        box(0.62, 0.14, 0.36, -0.38, 0.5, -0.82, C.paper), box(0.62, 0.14, 0.36, 0.38, 0.5, -0.82, C.paper),
        box(1.8, 1.05, 0.08, 0, 0, -1.08, C.wood),
      ],
    },
    {
      key: "nightstand", at: [0.2, 0, -1.95],
      parts: [box(0.46, 0.5, 0.4, 0, 0, 0, C.wood), box(0.04, 0.2, 0.04, 0, 0.5, 0, C.black),
        cyl(0.13, 0.18, 0, 0.7, 0, C.cream, { r2: 0.09, opacity: 0.9, glow: C.bulb, glowI: 0.7 }), bulb(0, 0.76, 0, 0.03)],
    },
    { key: "wardrobe", at: [2.28, 0, -0.9], rotY: -H, parts: [box(1.3, 2.15, 0.6, 0, 0, 0, C.woodDark), box(0.02, 2.0, 0.01, 0, 0.07, 0.3, C.black),
      box(0.03, 0.2, 0.03, -0.06, 1.0, 0.32, C.metal), box(0.03, 0.2, 0.03, 0.06, 1.0, 0.32, C.metal)] },
    { key: "poster", at: [-2.53, 0, -0.9], rotY: H, parts: poster(0.7, 0.5, 0, 1.6, 0, "#2c3a5a") },
    { key: "headboard-lights", at: [-0.95, 0, -2.25], parts: stringLights([-1.0, 1.75, 0], [1.0, 1.75, 0], 14, 0.18) },
    { key: "frames", at: [-0.95, 0, -2.23], parts: [...frame(0.3, 0.4, -0.45, 2.15, 0, "#8aa0b8"), ...frame(0.4, 0.3, 0.15, 2.2, 0, "#d8a07a"), ...frame(0.22, 0.22, 0.6, 2.05, 0, "#7a8a5a")] },
    { key: "night-things", at: [0.2, 0, -1.95], parts: [...bookStack(-0.1, 0.5, 0.08, 2), ...mug(0.13, 0.5, 0.1),
      box(0.1, 0.07, 0.05, 0.12, 0.5, -0.1, "#2a2a2e"), box(0.07, 0.03, 0.005, 0.12, 0.53, -0.07, "#ff8a5a", { glow: "#ff8a5a", glowI: 1.5 })] },
    { key: "throw", at: [-0.95, 0, -1.2], parts: [box(1.66, 0.04, 0.45, 0, 0.56, 0.75, "#c8b08a", { rot: [0.05, 0, 0] })] },
    { key: "slippers", at: [-0.2, 0, 0.15], parts: [box(0.1, 0.05, 0.25, 0, 0, 0, "#c8b8a8", { rot: [0, 0.2, 0] }), box(0.1, 0.05, 0.25, 0.14, 0, 0.03, "#c8b8a8", { rot: [0, -0.1, 0] })] },
    { key: "clothes-rack", at: [1.3, 0, 1.2], rotY: -0.4, parts: [
      box(0.03, 1.5, 0.03, -0.5, 0, 0, C.metal), box(0.03, 1.5, 0.03, 0.5, 0, 0, C.metal), box(1.03, 0.03, 0.03, 0, 1.5, 0, C.metal),
      ...["#3b4a5a", "#a8553a", "#d8d0c0", "#2f3a2a"].map((c, i) => box(0.04, 0.75, 0.38, -0.32 + i * 0.2, 0.72, 0, c))] },
    { key: "desk-small", at: [1.95, 0, 0.55], rotY: -Math.PI / 2, parts: [box(0.9, 0.04, 0.45, 0, 0.72, 0, C.wood), box(0.04, 0.72, 0.42, -0.42, 0, 0, C.woodDark), box(0.04, 0.72, 0.42, 0.42, 0, 0, C.woodDark),
      ...bookStack(-0.25, 0.76, 0, 3), cyl(0.06, 0.02, 0.25, 0.76, -0.05, C.black), box(0.015, 0.3, 0.015, 0.25, 0.78, -0.05, C.black), bulb(0.25, 1.1, 0.02, 0.04)] },
    { key: "bed-rug", at: [-0.1, 0, -0.3], parts: [box(0.9, 0.012, 1.4, 0, 0.002, 0, "#d8c8b0")] },
    { key: "moon-lamp", at: [-2.2, 0, -1.9], parts: [cyl(0.05, 0.05, 0, 0, 0, C.woodDark), ball(0.16, 0, 0.2, 0, "#f3e8d0", { glow: "#ffe9b8", glowI: 1.2 })] },
    { key: "plant", at: [2.15, 0, -1.95], parts: plant(0, 0, 0.8) },
    { key: "pendant", at: [-2.0, 0, -0.5], parts: [box(0.01, 0.55, 0.01, 0, 2.25, 0, C.black), bulb(0, 2.22, 0, 0.06)] },
  ],
};

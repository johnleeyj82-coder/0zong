import { box, move, type Space } from "../kit";
import {
  alarmClock, bed, bookStack, clothesRack, M, moonLamp, mug, nightstand, pendant, picture, plant, slippers, smallDesk, stringLights, tableLamp, wardrobe,
} from "../furniture";

const H = Math.PI / 2;

/** The bedroom. Lying down on the bed lets you choose what time it is in the house (only on your screen). */
export const bedroom: Space = {
  id: "bedroom",
  size: [5.2, 4.6, 2.8],
  wall: "#4b4855",
  floor: "#86664a",
  window: { x: 1.05, y: 0.95, w: 1.8, h: 1.5 },
  view: { pos: [0, 2.5, 5.9], target: [0, 0.9, -0.6] },
  from: { main: { pos: [-2.1, 2.4, 5.4], target: [-0.2, 0.9, -0.6] } },
  lamps: [
    { at: [0.2, 0.8, -1.95], power: 3.2 },
    { at: [0.9, 2.05, 0.6], power: 1.8, distance: 3.4 },
    { at: [-0.95, 1.7, -2.0], power: 1.8, distance: 2.5 },
    { at: [1.95, 1.05, 0.55], power: 1.6, distance: 2.2 },
  ],
  doors: [{ id: "to-main", to: "main", at: [-2.51, 0, 1.0], rotY: H, label: "메인 방으로" }],
  things: [
    { key: "rug", at: [-0.5, 0, 0.35], parts: [box(2.6, 0.014, 1.7, 0, 0, 0, "#9a8a78", { tex: "rug", rough: 1 })] },
    { key: "bed", action: "time", label: "침대 · 시간 바꾸기", at: [-0.95, 0, -1.2], parts: bed() },
    { key: "nightstand", at: [0.2, 0, -1.98], parts: [...nightstand(), ...move(tableLamp(), 0.05, 0.5, -0.04), ...move(alarmClock(), -0.13, 0.5, 0.1), ...mug(0.15, 0.5, 0.12)] },
    { key: "wardrobe", at: [2.25, 0, -0.9], rotY: -H, parts: wardrobe() },
    { key: "headboard-lights", at: [-0.95, 0, -2.22], parts: stringLights([-1.05, 1.78, 0], [1.05, 1.78, 0], 14, 0.2) },
    { key: "frames", at: [-0.95, 0, -2.215], parts: [...picture(0.3, 0.4, -0.5, 2.5, "#8aa0b8", M.oak), ...picture(0.42, 0.3, 0.02, 2.45, "#d8a07a", M.oak), ...picture(0.22, 0.22, 0.5, 2.36, "#7a8a5a", M.oak)] },
    { key: "poster", at: [-2.515, 0, -0.9], rotY: H, parts: picture(0.7, 0.5, 0, 1.9, "#2c3a5a") },
    { key: "slippers", at: [-0.05, 0, 0.1], parts: slippers() },
    { key: "clothes-rack", at: [-2.2, 0, -0.45], rotY: H, parts: clothesRack() },
    { key: "desk-small", at: [2.2, 0, 0.6], rotY: -H, parts: [...smallDesk(), ...bookStack(-0.25, 0.75, 0, 3, 14), ...move(tableLamp(M.navy), 0.28, 0.75, -0.06)] },
    { key: "moon-lamp", at: [-2.2, 0, -1.95], parts: moonLamp() },
    { key: "plant", at: [2.2, 0, -1.95], parts: plant(0.9, 10, 5) },
    { key: "pendant", at: [0.9, 0, 0.6], parts: pendant(2.05, 2.8, "#e6ddcc") },
    { key: "floor-books", at: [0.55, 0, -1.35], parts: bookStack(0, 0, 0, 4, 17) },
  ],
};

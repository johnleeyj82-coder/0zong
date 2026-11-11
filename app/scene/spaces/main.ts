import { box, move, rbox, type Space } from "../kit";
import {
  beanbag, bookshelf, bookStack, chessSet, desk, displayPlinth, easel, floorLamp, gameConsole, handheld, headphones,
  keyboard, leaningCanvases, M, monitor, mouse, mug, officeChair, paintCart, picture, plant, speaker, stringLights, wallClock, wasteBin,
} from "../furniture";

const H = Math.PI / 2;

/** The main room: desk with dual monitors (game, security study), bookshelf, easel, and a display plinth for the minigames. */
export const main: Space = {
  id: "main",
  size: [6.4, 5, 2.8],
  wall: "#5a4636",
  floor: "#8a6242",
  window: { x: 0, y: 0.95, w: 2.6, h: 1.55 },
  view: { pos: [0, 2.6, 6.4], target: [0, 1, -0.6] },
  bubble: [0, 1.75, -1.25],
  from: {
    cinema: { pos: [-2.3, 2.4, 5.7], target: [-0.2, 1, -0.6] },
    bedroom: { pos: [2.3, 2.4, 5.7], target: [0.2, 1, -0.6] },
  },
  lamps: [
    { at: [0.98, 1.2, -2.1], power: 3 },
    { at: [-2.45, 1.6, -0.3], power: 5 },
    { at: [2.75, 1.45, -0.2], power: 2.4, distance: 3 },
  ],
  doors: [
    { id: "to-cinema", to: "cinema", at: [-3.11, 0, 1.3], rotY: H, label: "영화방으로" },
    { id: "to-bedroom", to: "bedroom", at: [3.11, 0, 1.3], rotY: -H, label: "침실로" },
  ],
  things: [
    { key: "rug", at: [0, 0, 0.3], parts: [box(3.4, 0.014, 2.4, 0, 0, 0, "#8c3a34", { tex: "rug", rough: 1 })] },
    { key: "desk", at: [0, 0, -2.1], parts: desk() },
    { key: "chair", at: [0.05, 0, -1.3], rotY: Math.PI - 0.25, parts: officeChair() },
    { key: "monitor-left", hobby: "game", at: [-0.36, 0.75, -2.22], rotY: 0.12, parts: monitor("game") },
    { key: "monitor-right", hobby: "hack", at: [0.36, 0.75, -2.22], rotY: -0.12, parts: monitor("term") },
    {
      key: "desk-stuff", at: [0, 0.75, -2.1],
      parts: [
        ...move(keyboard(), 0, 0, 0.16), ...move(mouse(), 0.36, 0, 0.17), ...mug(-0.62, 0, 0.2, M.brick),
        ...move(speaker(), -0.86, 0, -0.08), ...move(speaker(), 0.86, 0, -0.08), ...move(headphones(), -1.02, 0, 0.2),
        ...bookStack(0.98, 0, 0.22, 2, 3),
        // desk lamp with an arm
        rbox(0.14, 0.02, 0.1, 1.0, 0, -0.1, M.black, { radius: 0.008 }), box(0.014, 0.3, 0.014, 1.0, 0.02, -0.1, M.black, { rot: [0, 0, 0.25] }),
        box(0.014, 0.24, 0.014, 0.93, 0.3, -0.1, M.black, { rot: [0, 0, -0.9] }), rbox(0.1, 0.05, 0.08, 0.84, 0.39, -0.1, M.black, { radius: 0.02 }),
        box(0.07, 0.004, 0.05, 0.84, 0.388, -0.1, M.bulb, { glow: M.bulb, glowI: 3 }),
      ],
    },
    { key: "under-desk", at: [-0.5, 0, -2.1], parts: gameConsole() },
    { key: "bookshelf", hobby: "book", at: [-2.94, 0, -1.55], rotY: H, parts: bookshelf() },
    {
      key: "posters", at: [-3.115, 0, 0.1], rotY: H,
      parts: [...picture(0.6, 0.84, -0.42, 2.2, "#22324f"), ...picture(0.6, 0.84, 0.4, 2.2, M.brick), ...picture(0.3, 0.22, -0.56, 1.24, "#6b8a7a", M.oak), ...picture(0.22, 0.3, -0.2, 1.3, M.mustard, M.oak)],
    },
    { key: "plant-a", at: [-1.75, 0, -2.0], parts: plant(1.15, 12, 3) },
    { key: "floor-lamp", at: [-2.45, 0, -0.3], parts: floorLamp() },
    { key: "lights-back", at: [0, 0, -2.4], parts: stringLights([-3.05, 2.62, 0], [3.05, 2.62, 0], 24, 0.16) },
    {
      key: "wall-shelf", at: [-2.0, 1.95, -2.36],
      parts: [rbox(0.9, 0.03, 0.2, 0, 0, 0, M.walnut, { radius: 0.008, tex: "grain" }), ...move(plant(0.3, 7, 5), -0.3, 0.03, 0), ...bookStack(0.05, 0.03, 0, 3, 6), ...mug(0.32, 0.03, 0, M.navy)],
    },
    { key: "clock", at: [1.95, 2.1, -2.4], parts: wallClock() },
    { key: "canvases", at: [2.62, 0, -2.2], rotY: -0.35, parts: leaningCanvases() },
    { key: "paint-cart", at: [1.5, 0, -1.25], rotY: 0.3, parts: paintCart() },
    { key: "beanbag", at: [-1.9, 0, 0.9], parts: beanbag() },
    { key: "floor-books", at: [-1.3, 0, 1.3], parts: [...bookStack(0, 0, 0, 4, 9), ...mug(0.22, 0, 0.05)] },
    { key: "bin", at: [1.2, 0, -1.9], parts: wasteBin() },
    { key: "easel", hobby: "art", at: [2.05, 0, -1.85], rotY: -0.45, parts: easel() },
    { key: "display", label: "전시대", at: [2.9, 0, -0.2], rotY: -H, parts: displayPlinth() },
    { key: "chess", hobby: "chess", at: [2.88, 0.955, -0.66], rotY: -H, parts: chessSet() },
    { key: "handheld", hobby: "tetris", at: [2.9, 0.955, 0.3], rotY: -H + 0.25, parts: handheld() },
  ],
};

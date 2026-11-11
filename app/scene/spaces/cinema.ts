import { box, move, rbox, type Space } from "../kit";
import {
  barStool, bookStack, diningChair, floorLamp, lpCrate, M, mug, pendant, picture, plant, pokerTable, popcorn, projectionScreen, projectorOnStand,
  recordConsole, sideTable, sofa, stringLights, towerSpeaker, whiskyShelf,
} from "../furniture";

const H = Math.PI / 2;

/** The cinema: projector and screen, the record console, the whisky shelf, the poker table and a sofa to watch from. */
export const cinema: Space = {
  id: "cinema",
  size: [6.4, 5.4, 2.8],
  wall: "#4a3830",
  floor: "#6e4c34",
  view: { pos: [0, 2.7, 6.6], target: [0, 1, -0.7] },
  from: { main: { pos: [2.5, 2.5, 5.9], target: [0.2, 1, -0.7] } },
  lamps: [
    { at: [-2.55, 1.55, 1.5], power: 5.5 },
    { at: [1.85, 1.7, 1.75], power: 4.5, distance: 4 },
    { at: [2.7, 1.5, -1.5], power: 2.4, distance: 3 },
    { at: [0, 1.6, -2.0], power: 1.8, color: "#c9d6ff", distance: 4.5 },
    { at: [-2.85, 0.95, -1.3], power: 1.6, distance: 2.5 },
  ],
  doors: [{ id: "to-main", to: "main", at: [3.11, 0, 0.6], rotY: -H, label: "메인 방으로" }],
  things: [
    { key: "rug", at: [0, 0, 0.5], parts: [box(3.3, 0.014, 2.6, 0, 0, 0, "#4f5670", { tex: "rug", rough: 1 })] },
    { key: "screen", hobby: "movie", at: [0, 0, -2.62], parts: projectionScreen() },
    { key: "projector", hobby: "video", at: [0, 0, 1.75], parts: projectorOnStand() },
    { key: "sofa", label: "소파", at: [0, 0, 0.35], rotY: Math.PI, parts: sofa() },
    { key: "turntable", hobby: "music", at: [-2.92, 0, -1.2], rotY: H, parts: recordConsole() },
    { key: "whisky", hobby: "whisky", at: [2.93, 0, -1.5], rotY: -H, parts: whiskyShelf() },
    { key: "poker", hobby: "poker", at: [1.85, 0, 1.75], parts: pokerTable() },
    ...[1.9, 3.6, 5.2].map((a, i) => ({ key: `poker-chair-${i}`, at: [1.85 + Math.sin(a) * 1.08, 0, 1.75 + Math.cos(a) * 1.08] as [number, number, number], rotY: a + Math.PI, parts: diningChair() })),
    { key: "poker-lamp", at: [1.85, 0, 1.75], parts: pendant(1.72, 2.8) },
    { key: "lights", at: [0, 0, -2.6], parts: stringLights([-3.05, 2.7, 0], [3.05, 2.7, 0], 22, 0.12) },
    { key: "speaker-l", at: [-2.0, 0, -2.4], rotY: 0.2, parts: towerSpeaker() },
    { key: "speaker-r", at: [2.0, 0, -2.4], rotY: -0.2, parts: towerSpeaker() },
    {
      key: "movie-posters", at: [-3.115, 0, 0.9], rotY: H,
      parts: [...picture(0.56, 0.8, -0.72, 2.15, M.brick, M.black), ...picture(0.56, 0.8, 0, 2.15, "#1f3d5c", M.black), ...picture(0.56, 0.8, 0.72, 2.15, M.mustard, M.black)],
    },
    { key: "lp-crate", at: [-2.5, 0, -0.2], rotY: 0.3, parts: lpCrate() },
    { key: "bar-stool-a", at: [2.3, 0, -1.15], parts: barStool() },
    { key: "bar-stool-b", at: [2.3, 0, -0.55], parts: barStool() },
    { key: "side-table", at: [-1.55, 0, 0.45], parts: [...sideTable(), ...move(popcorn(), 0.06, 0.525, -0.04), ...mug(-0.1, 0.525, 0.08, M.navy)] },
    { key: "remote", at: [0.2, 0.47, 0.5], parts: [rbox(0.05, 0.018, 0.16, 0, 0, 0, "#1d1d22", { radius: 0.008, rot: [0, 0.4, 0] })] },
    { key: "floor-lamp", at: [-2.55, 0, 1.5], parts: floorLamp() },
    { key: "plant", at: [-2.45, 0, -2.25], parts: plant(1.3, 13, 7) },
    { key: "floor-books", at: [-0.9, 0, 1.7], parts: [...bookStack(0, 0, 0, 3, 12), box(0.2, 0.012, 0.28, 0.3, 0, 0.05, "#161616", { rot: [0, 0.4, 0] })] },
  ],
};

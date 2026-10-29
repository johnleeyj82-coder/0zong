import type { SpaceId } from "../../data";
import type { Space } from "../kit";
import { main } from "./main";
import { cinema } from "./cinema";
import { bedroom } from "./bedroom";

export const HOUSE: Record<SpaceId, Space> = { main, cinema, bedroom };

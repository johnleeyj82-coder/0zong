// Prints the number of frames in public/frames. Paste it into FRAME_COUNT in app/data.ts
// whenever you replace the frames (for example after extracting them from a Runway video).
import { readdirSync } from "node:fs";
const n = readdirSync(new URL("../public/frames", import.meta.url)).filter((f) => /^frame_\d{4}\.jpg$/.test(f)).length;
console.log(`FRAME_COUNT = ${n}`);

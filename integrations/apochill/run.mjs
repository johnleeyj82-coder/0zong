// Runs a local apochill-kit checkout with 0zong's overlay on top. Local evaluation only:
// apochill-kit has no reuse license, so nothing from it is copied into this repository, and its files are not edited
// (the one bubble hook below is applied in the dev server's memory).
//
//   APOCHILL_DIR=~/apochill-kit ZONG_URL=http://127.0.0.1:3000 npm run apochill
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";

const here = path.dirname(fileURLToPath(import.meta.url));
const APOCHILL = path.resolve(process.env.APOCHILL_DIR || path.join(here, "../../../apochill-kit"));
const ZONG = (process.env.ZONG_URL || "http://127.0.0.1:3000").replace(/\/$/, "");
const PORT = Number(process.env.APOCHILL_PORT || 5174);

const fail = (msg) => { console.error(`\n[0zong × apochill] ${msg}\n`); process.exit(1); };
if (!existsSync(path.join(APOCHILL, "vite.config.js"))) {
  fail(`apochill-kit 폴더를 찾지 못했어요: ${APOCHILL}\n  APOCHILL_DIR=apochill-kit폴더경로 npm run apochill 로 알려주세요.`);
}
if (!existsSync(path.join(APOCHILL, "node_modules", "vite"))) fail(`apochill-kit에서 먼저 'npm ci'를 실행해주세요 (${APOCHILL}).`);
const major = Number(process.versions.node.split(".")[0]);
if (major < 20) {
  fail(`Node.js ${process.versions.node}로는 apochill-kit(Vite 8)을 띄울 수 없어요. Node.js 24로 올려주세요:\n`
    + "  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash\n"
    + "  (터미널을 새로 연 뒤) nvm install 24 && nvm use 24\n"
    + "  그다음 apochill-kit에서 다시 npm ci");
}
if (major < 24) console.warn(`[0zong × apochill] apochill-kit은 Node.js 24 이상을 요구해요 (지금 ${process.versions.node}). 문제가 생기면 Node를 올려주세요.`);

// apochill's own predev step: copy the Draco decoder into its public folder.
const prep = spawnSync(process.execPath, [path.join(APOCHILL, "src/prepare-decoder.mjs")], { stdio: "inherit" });
if (prep.status !== 0) fail("Draco 디코더 준비(prepare-decoder)에 실패했어요.");

const require = createRequire(path.join(APOCHILL, "package.json"));
const vite = await import(pathToFileURL(require.resolve("vite")).href);
const { zongPlugin } = await import(pathToFileURL(path.join(here, "plugin.mjs")).href);

const server = await vite.createServer({
  root: APOCHILL,
  configFile: path.join(APOCHILL, "vite.config.js"),
  plugins: [zongPlugin({ zong: ZONG, apochill: APOCHILL, overlayDir: path.join(here, "overlay") })],
  server: {
    host: "127.0.0.1", port: PORT, strictPort: true,
    fs: { allow: [APOCHILL, path.join(here, "overlay")] },
    proxy: {
      "/zong": { target: ZONG, changeOrigin: true, rewrite: (p) => p.replace(/^\/zong/, "") },
      "/audio/bgm/zong/": {
        target: ZONG, changeOrigin: true,
        rewrite: (p) => p.replace(/^\/audio\/bgm\/zong\/([0-9a-f-]{36})\.[a-z0-9]+$/i, "/api/music/file/$1"),
      },
    },
  },
});
await server.listen();
const name = JSON.parse(readFileSync(path.join(APOCHILL, "package.json"), "utf8")).name;
console.log(`\n[0zong × apochill] ${name} + 0zong 기록함 → http://127.0.0.1:${PORT}/  (0zong 서버: ${ZONG})\n`);

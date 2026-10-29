// Vite plugin for the local apochill-kit run (see run.mjs). Adds the 0zong overlay, merges 0zong tracks into
// apochill's radio playlist, and wires "now playing" into the character's speech bubble.
import { readFile } from "node:fs/promises";
import path from "node:path";

const OVERLAY_ID = "/@zong/overlay.js";

// One line added after showStatus() in work-status-ui.js: lets the overlay set the bubble text with an event.
const BUBBLE_ANCHOR = "function showStatus(text){status.textContent=text;hint.textContent=text;}";
const BUBBLE_HOOK = "addEventListener('zong:phrase',e=>{const t=typeof e.detail==='string'?e.detail.slice(0,60):'';"
  + "if(t)setPhrase(t);else if(detectedApp)setPhrase(activityPhrase(detectedApp,mood));else manualPhrase();});window.__zongBubble=true;";

export function zongPlugin({ zong, apochill, overlayDir }) {
  return {
    name: "zong-overlay",
    enforce: "pre",
    resolveId(id) {
      if (id === OVERLAY_ID) return path.join(overlayDir, "zong-overlay.js");
    },
    transformIndexHtml(html, ctx) {
      if (!ctx.filename.endsWith(`${path.sep}index.html`) || ctx.filename.includes("gallery")) return html;
      return html.replace("</body>", `<script type="module" src="${OVERLAY_ID}"></script>\n</body>`);
    },
    transform(code, id) {
      if (!id.endsWith("/src/work-status-ui.js")) return;
      if (!code.includes(BUBBLE_ANCHOR)) {
        this.warn("[0zong] 말풍선 연결 지점을 찾지 못했어요. 오버레이가 자체 말풍선을 써요.");
        return;
      }
      return code.replace(BUBBLE_ANCHOR, BUBBLE_ANCHOR + BUBBLE_HOOK);
    },
    configureServer(server) {
      // apochill's playlist + 0zong's uploaded tracks. apochill's validator accepts them: same origin, under
      // /audio/bgm/, audio extension. The files themselves are proxied to 0zong (run.mjs).
      server.middlewares.use("/audio/bgm/playlist.json", async (_req, res) => {
        let own = { tracks: [] };
        try { own = JSON.parse(await readFile(path.join(apochill, "assets/web/audio/bgm/playlist.json"), "utf8")); } catch { /* none */ }
        let mine = [];
        try {
          const r = await fetch(`${zong}/api/music`, { signal: AbortSignal.timeout(2500) });
          if (r.ok) mine = ((await r.json()).tracks ?? []).map((t) => ({ title: `${t.title} · 내 곡`, src: `zong/${t.id}.${t.ext}` }));
        } catch { /* 0zong not running: apochill's own tracks only */ }
        res.setHeader("Content-Type", "application/json");
        res.setHeader("Cache-Control", "no-store");
        res.end(JSON.stringify({ tracks: [...(own.tracks ?? []), ...mine] }));
      });
    },
  };
}

// "0ZONG 기록함": 0zong's game saves, movie scores, my tracks and owner login as a panel in apochill's camp dock,
// plus "now playing" in the character's speech bubble. Talks to the 0zong server through the /zong proxy (run.mjs).
import "./zong-overlay.css";

const API = "/zong/api";
const ZONG_PAGE = (p) => `${location.protocol}//${location.hostname}:3000${p}`;
const PRESENCE_MS = 60_000;

const el = (tag, attrs = {}, ...kids) => {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") n.className = v;
    else if (k.startsWith("on")) n.addEventListener(k.slice(2), v);
    else if (v !== false && v != null) n.setAttribute(k, v === true ? "" : v);
  }
  n.append(...kids.flat().filter((k) => k != null && k !== false));
  return n;
};
const playtime = (m) => `${Math.floor(m / 60)}:${String(Math.round(m % 60)).padStart(2, "0")}`;
const blocks = (v) => (v === undefined ? null : el("span", { class: "zong-blocks", role: "img", "aria-label": `진행률 ${v}%` },
  ...Array.from({ length: 10 }, (_, i) => el("i", { "data-on": i < Math.round(v / 10) }))));
const shown = (s) => s.progress ?? (s.ach?.total ? Math.round((s.ach.done / s.ach.total) * 100) : undefined);
const STATUS = { playing: "플레이 중", cleared: "클리어", paused: "쉬는 중", dropped: "접음" };
const SCORE_KEYS = ["engagement", "aftertaste", "story", "character", "visual", "personal"];
const total = (m) => SCORE_KEYS.reduce((s, k) => s + (m.scores?.[k] ?? 0), 0);

async function api(path, init = {}) {
  try {
    const r = await fetch(API + path, { credentials: "same-origin", ...init });
    const data = await r.json().catch(() => ({}));
    return r.ok ? { ok: true, data } : { ok: false, error: data.error || `요청이 실패했어요 (${r.status}).` };
  } catch {
    return { ok: false, error: "0zong 서버에 연결하지 못했어요. 0zong 폴더에서 'npm run dev'로 켜주세요." };
  }
}

/* ---------- panel ---------- */
const TABS = [["game", "게임"], ["movie", "영화"], ["music", "음악"], ["owner", "주인"]];
const body = el("div", { class: "zong-body" });
const tabs = el("div", { class: "zong-tabs", role: "tablist" }, ...TABS.map(([k, label]) =>
  el("button", { type: "button", role: "tab", "data-tab": k, "aria-selected": k === "game" ? "true" : "false", onclick: () => show(k) }, label)));
const panel = el("section", { class: "zong-panel", "aria-label": "0zong 기록함" },
  el("div", { class: "zong-heading" }, el("span", { class: "zong-label" }, "0ZONG 기록함"), el("small", {}, "내 기록")), tabs, body);

const state = { tab: "game", owner: false, games: null, movies: null, tracks: null };

function show(tab) {
  state.tab = tab;
  for (const b of tabs.children) b.setAttribute("aria-selected", String(b.dataset.tab === tab));
  render();
}

function message(text, kind = "") { return el("p", { class: `zong-msg ${kind}`, role: kind === "error" ? "alert" : "status" }, text); }

async function render() {
  const tab = state.tab;
  body.replaceChildren(message("불러오는 중…"));
  const node = await ({ game: renderGames, movie: renderMovies, music: renderMusic, owner: renderOwner })[tab]();
  if (state.tab === tab) body.replaceChildren(node);
}

async function renderGames() {
  const r = await api("/games");
  if (!r.ok) return message(r.error, "error");
  state.games = r.data;
  const list = el("ol", { class: "zong-slots" }, ...r.data.slots.slice(0, 6).map((s, i) => el("li", {},
    el("button", { type: "button", onclick: () => openSave(s) },
      el("span", { class: "zong-slot-no" }, `SLOT ${String(i + 1).padStart(2, "0")}${s.example ? " · 예시" : ""}`),
      el("b", {}, s.title),
      el("span", { class: "zong-slot-row" }, el("span", {}, playtime(s.minutes)), blocks(shown(s))),
      el("small", {}, [STATUS[s.status], s.progressLabel, s.ach ? `업적 ${s.ach.done}/${s.ach.total}` : ""].filter(Boolean).join(", "))))));
  return el("div", {}, r.data.slots.length ? list : message("아직 슬롯에 건 게임이 없어요."),
    el("a", { class: "zong-link", href: ZONG_PAGE("/game"), target: "_blank", rel: "noopener" }, "세이브 파일 전체 보기 ↗"));
}

async function renderMovies() {
  const r = await api("/movies");
  if (!r.ok) return message(r.error, "error");
  const top = [...r.data.movies].sort((a, b) => total(b) - total(a)).slice(0, 5);
  return el("div", {},
    el("ol", { class: "zong-movies" }, ...top.map((m) => el("li", {},
      el("span", {}, m.title, m.example ? el("em", {}, " 예시") : null),
      el("b", {}, (Math.round((total(m) / 20) * 10) / 10).toFixed(1))))),
    el("a", { class: "zong-link", href: ZONG_PAGE("/movie"), target: "_blank", rel: "noopener" }, "점수 전체 보기 ↗"));
}

async function renderMusic() {
  const r = await api("/music");
  if (!r.ok) return message(r.error, "error");
  const tracks = r.data.tracks;
  const box = el("div", {},
    message(tracks.length ? `라디오 목록 끝에 내 곡 ${tracks.length}개가 들어가 있어요. 위 라디오에서 골라 들어요.` : "아직 올린 곡이 없어요. 올린 곡은 위 라디오 목록에 들어가요."),
    tracks.length ? el("ul", { class: "zong-tracks" }, ...tracks.map((t) => el("li", {}, el("span", {}, t.title), el("small", {}, t.credit || t.artist || "")))) : null);
  if (state.owner) box.append(uploadForm());
  else box.append(message("곡 올리기는 '주인' 탭에서 로그인하면 열려요."));
  return box;
}

function uploadForm() {
  const file = el("input", { type: "file", accept: ".mp3,.m4a,.ogg,.wav,audio/mpeg,audio/mp4,audio/ogg,audio/wav", "aria-label": "음원 파일" });
  const title = el("input", { type: "text", maxlength: "80", placeholder: "제목", "aria-label": "제목" });
  const credit = el("input", { type: "text", maxlength: "160", placeholder: "출처·라이선스 (예: 직접 만듦)", "aria-label": "출처와 라이선스" });
  const note = message("직접 만든 곡이나 공개해도 되는 곡만 올려주세요.");
  const send = el("button", { type: "submit" }, "곡 올리기");
  file.addEventListener("change", () => { if (file.files[0] && !title.value) title.value = file.files[0].name.replace(/\.[^.]+$/, "").slice(0, 80); });
  return el("form", { class: "zong-upload", onsubmit: async (e) => {
    e.preventDefault();
    const f = file.files[0];
    if (!f) { note.textContent = "올릴 파일을 골라주세요."; note.className = "zong-msg error"; return; }
    send.disabled = true; send.textContent = "올리는 중…";
    const form = new FormData();
    form.set("file", f); form.set("title", title.value); form.set("credit", credit.value);
    form.set("duration", String(await duration(f)));
    const r = await api("/music", { method: "POST", body: form });
    send.disabled = false; send.textContent = "곡 올리기";
    if (!r.ok) { note.textContent = r.error; note.className = "zong-msg error"; return; }
    note.className = "zong-msg";
    note.replaceChildren(`「${r.data.track.title}」을 올렸어요. `, el("button", { type: "button", onclick: () => location.reload() }, "라디오에 반영(새로고침)"));
    file.value = ""; title.value = ""; credit.value = "";
  } }, el("strong", {}, "내 곡 추가"), file, title, credit, send, note);
}

const duration = (f) => new Promise((resolve) => {
  const a = new Audio(), url = URL.createObjectURL(f);
  const done = (v) => { URL.revokeObjectURL(url); resolve(Number.isFinite(v) ? v : 0); };
  a.preload = "metadata"; a.onloadedmetadata = () => done(a.duration); a.onerror = () => done(0); a.src = url;
});

async function renderOwner() {
  const r = await api("/auth");
  state.owner = r.ok && r.data.owner;
  if (state.owner) {
    return el("div", {}, message("주인으로 들어와 있어요. 음악 탭에서 곡을 올릴 수 있어요."),
      el("button", { type: "button", onclick: async () => { await api("/auth", { method: "DELETE" }); state.owner = false; render(); } }, "로그아웃"));
  }
  const name = el("input", { type: "text", maxlength: "20", placeholder: "이름", autocomplete: "username", "aria-label": "이름" });
  const pw = el("input", { type: "password", placeholder: "비밀번호", autocomplete: "current-password", "aria-label": "비밀번호" });
  const note = message("0zong 주인 이름과 비밀번호로 들어가요.");
  return el("form", { class: "zong-login", onsubmit: async (e) => {
    e.preventDefault();
    const res = await api("/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: name.value, password: pw.value }) });
    if (!res.ok) { note.textContent = res.error; note.className = "zong-msg error"; pw.value = ""; return; }
    state.owner = true; render();
  } }, name, pw, el("button", { type: "submit" }, "들어가기"), note);
}

/* ---------- save dialog ---------- */
const dialog = el("dialog", { class: "zong-dialog", "aria-labelledby": "zong-save-title" });
document.body.append(dialog);
dialog.addEventListener("click", (e) => { if (e.target === dialog) dialog.close(); });

function openSave(s) {
  const det = s.details ?? {};
  const rare = (det.achievements ?? []).filter((a) => a.achieved && a.globalPct !== undefined).sort((a, b) => a.globalPct - b.globalPct).slice(0, 3);
  const notes = (state.games?.notes ?? []).filter((n) => n.slotId === s.id).slice(0, 5);
  dialog.replaceChildren(...[
    el("div", { class: "zong-dialog-head" }, el("h2", { id: "zong-save-title" }, s.title), el("button", { type: "button", onclick: () => dialog.close() }, "닫기")),
    el("p", { class: "zong-msg" }, [STATUS[s.status], s.progressLabel, s.lastSpot].filter(Boolean).join(" · ")),
    el("dl", { class: "zong-stats" },
      el("div", {}, el("dt", {}, "플레이 시간"), el("dd", {}, playtime(s.minutes))),
      el("div", {}, el("dt", {}, "최근 2주"), el("dd", {}, s.recentMinutes ? playtime(s.recentMinutes) : "없음")),
      s.ach ? el("div", {}, el("dt", {}, "업적"), el("dd", {}, `${s.ach.done}/${s.ach.total}`)) : null),
    blocks(shown(s)),
    rare.length ? el("div", {}, el("strong", {}, "희귀 업적"), el("ul", { class: "zong-rare" }, ...rare.map((a) =>
      el("li", {}, a.icon ? el("img", { src: a.icon, alt: "", onerror: (e) => { e.target.style.visibility = "hidden"; } }) : el("i", { "aria-hidden": "true" }), el("span", {}, a.name), el("small", {}, `전체 ${a.globalPct < 10 ? a.globalPct.toFixed(1) : Math.round(a.globalPct)}%`))))) : null,
    notes.length ? el("div", {}, el("strong", {}, "플레이 일지"), el("ul", { class: "zong-notes" }, ...notes.map((n) =>
      el("li", {}, el("small", {}, n.date.slice(5).replace("-", ".") + (n.hours ? ` · +${n.hours}h` : "")), el("p", {}, n.text))))) : null,
    el("a", { class: "zong-link", href: ZONG_PAGE("/game"), target: "_blank", rel: "noopener" }, "0zong에서 자세히 ↗"),
  ].filter(Boolean));
  dialog.showModal();
}

/* ---------- now playing → the character's speech bubble ---------- */
const fallback = el("div", { class: "zong-bubble", role: "status", hidden: true });
document.body.append(fallback);
let delivered = null; // the phrase the bubble currently shows (null: nothing sent yet)
async function presence() {
  const r = await api("/games");
  const name = r.ok ? r.data.nowPlaying?.name : undefined;
  const phrase = name ? `지금 ${name} 하는 중` : "";
  if (phrase === delivered) return;
  if (window.__zongBubble) {
    dispatchEvent(new CustomEvent("zong:phrase", { detail: phrase }));
  } else if (sceneReady()) {
    fallback.textContent = phrase; fallback.hidden = !phrase; // the bubble hook did not apply: our own bubble
  } else return; // the character is not there yet; try again on the next round
  delivered = phrase;
}
const sceneReady = () => document.documentElement.dataset.renderReady === "true";

/* ---------- mount once apochill's dock exists ---------- */
function mount() {
  const dock = document.querySelector(".scene-controls");
  if (!dock) { requestAnimationFrame(mount); return; }
  dock.append(panel);
  void api("/auth").then((r) => { state.owner = r.ok && r.data.owner; render(); });
  // The character (and its speech bubble) exists only once the scene has rendered.
  const wait = setInterval(() => { if (sceneReady()) { clearInterval(wait); void presence(); } }, 1000);
  setInterval(() => { if (!document.hidden && sceneReady()) void presence(); }, PRESENCE_MS);
}
mount();

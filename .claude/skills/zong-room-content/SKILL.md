---
name: zong-room-content
description: Use when adding or changing anything in the "0zong의 방" site — copy, sections, room detail views, the icon dock, the opening, guestbook, visitor tracking, or owner edit mode.
---

# 0zong의 방 — content, design, and feature rules

The site is one room at night. Every hobby is an object in that room. Visitors scroll through a camera tour, then
explore. Everything below the hero is the same room "with the lights on": it must feel like the inside of the hero,
not a different website.

## 1. Voice and copy

- Write in 해요체, first person, like the owner showing a friend around: "여기는 요즘 제일 자주 앉는 자리예요."
  Never marketing tone ("최고의", "혁신적인"), never 합니다체.
- One idea per sentence. Captions ≤ 2 sentences (≈ 70자). Card descriptions ≤ 3 lines.
- Each room speaks with a concrete detail only that hobby has: play hours and boss names for game, 잔디/문제 수 for hack,
  블라인드 50/100 and BB for poker, 지거·플로트·빌드 for bar, 0~5점 for movie, 2분/40줄 for tetris.
- Labels (small caps above headings) are English, mono, uppercase: `THE ROOMS`, `LATELY`, `GUESTBOOK`.
  Headings and body are Korean.
- "최근 소식" lines follow `언제 · 무엇` (e.g. `2시간 전 · 엘든링 +3h`). Always relative time first.
- Example data is always marked "예시" until the owner replaces it. Never present invented records as real.
- Empty states name what will appear and how to add the first one: "아직 방명록이 없어요. 첫 번째로 이름을 남겨주세요."

## 2. Visual system (do not drift)

Tokens live in `app/globals.css`. Use only these:

| token | use |
|---|---|
| `--bg #15100c` / `--bg-raise #1e1712` | page / raised surfaces (never pure black) |
| `--text #f3eadb`, `--text-body #cfc3b1`, `--text-dim #958a7b` | heading / body / meta |
| `--accent #e9b872` (tungsten), `--accent-hover #f3cc8e`, `--accent-ink #26190a` | the one accent: lamps, active states, buttons |
| `--felt #2f5c47`, `--olive #6e7457` | secondary, only inside poker / plants contexts |
| `--border rgba(243,234,219,.14)` | hairlines |

- Fonts: display `Nanum Myeongjo 800`, body `IBM Plex Sans KR 300–600`, labels/data `JetBrains Mono`.
- The signature motif is the **lamp frame**: a tungsten 1.5px glow with four viewfinder corners. Use it to mark "this
  object is selected" everywhere (hero focus, dock hover target, room card hover, drawer header). Do not invent other
  highlight styles.
- Motion: slow ease-out `[0.16,1,0.3,1]` for entrances, `[0.25,0,0,1]` for section reveals (y 24→0, 100ms stagger,
  once). No bounce except the dock icon lift. Respect `prefers-reduced-motion`.
- Surfaces: glassy dark cards (`rgba(24,17,12,.8)` + blur 12px) only over the canvas. Below the hero, use flat
  `--bg` with hairline grids, not floating cards.

## 3. Page structure after the hero

In this order, each a `<section>` with a label, a Korean h2, and content:

1. **About** — two columns: why the room exists + a still frame from `public/frames`.
2. **The rooms** — a hairline grid of all rooms (`ROOMS` in `app/data.ts`). Every card opens the **room drawer**.
3. **Lately** — a feed across all rooms, newest first, `when · icon · title · one-line note`.
4. **Guestbook** — public messages (name, message, relative date). Form at the top, list below.
5. **Closing** — two-line display heading, second line italic accent, "방으로 돌아가기".

### Room drawer (the detail view for one hobby)

A right-side sheet (bottom sheet under 768px) with: lamp-frame header (icon, title, Korean label, update line), then a
body specific to the room:

| room | body pattern |
|---|---|
| game | per-game rows (hours, progress) + thread feed of play notes + screenshot strip |
| hack | 26-week heatmap + notes grouped by field/technique tag + "오늘 복습할 노트" |
| poker | modes list (튜토리얼 / AI 대결 / 실시간 방) with blinds, and a seat count |
| book | question chips (owner-made categories) + entries under the selected question |
| movie | table: 영화 / 본 날 / 내 점수 (0–5, one decimal) + 보고 싶은 목록 count |
| music | now-playing row + list; the mini player persists across the page |
| whisky (bar) | recipe card with technique and layered glass + practice log |
| chess | mode + highest stage leaderboard |
| tetris | 2-minute leaderboard; names default to the guestbook name |
| video / art | work entries: 의도, 배운 것, 다음에 할 것 |

Drawer bodies live in `app/rooms/bodies.tsx`; keep them data-driven so the owner can edit them.

## 4. The icon dock

- Always visible, bottom center, glass pill. Order: 홈 · tour rooms in tour order · tetris · divider · 방명록 ·
  (owner only) 대시보드.
- A thin tungsten progress line on top of the dock shows tour progress (0–100% of the hero).
- Hover/focus: icon lifts 3px, tooltip with the Korean label. Active room (camera resting on it) is filled tungsten.
- Clicking a tour room scrolls the hero to that room's mark; non-tour rooms open their drawer.
- If the visitor left a name, a small chip at the dock's left shows it ("하늘님"). Owner sees "편집 모드".
- The dock is a framer-motion element: center it with `style={{ x: "-50%" }}`, not a CSS transform (framer overwrites it).
- Every dock click is tracked (`dock` event).

## 5. Opening (first load)

1. Dark room: the first frame at ~10% brightness, rain visible through the window.
2. Lamps flicker on (brightness 0.1 → 0.45 → 0.3 → 1 over ~1.6s).
3. Guestbook gate appears (skipped for returning visitors, who get "다시 왔네요, ○○님"):
   이름 입력 + [들어가기] · [익명으로] · [그냥 둘러볼게요], with the disclosure line
   "이름을 남기면 이 방에서 무엇을 봤는지 방 주인이 볼 수 있어요. IP나 위치는 저장하지 않아요."
4. Then the identity block rises in.

## 6. Visitors, tracking, privacy

- Modes: `named` (their name), `anonymous` (stored as `익명 ####`), `skip` (no record at all — send nothing).
- Never store IP, user agent, or location. Store only: visitor id (random, client-generated), name, mode, timestamps,
  and events.
- Events: `enter`, `view` (a room caption visible ≥ 1.2s), `dock`, `open` (drawer), `guestbook`, `score`. Batch them
  client-side; flush on an interval and on `pagehide` with `sendBeacon`.
- Guestbook messages are public. Activity is visible only to the owner.
- Storage goes through `lib/store.ts` only (JSON file by default). For serverless hosts, replace those functions with a
  database; never call storage from components.

## 7. Owner mode

- Typing the owner name (env `OWNER_NAME`) in the gate reveals a password field. The password is checked on the
  server against `OWNER_PASSWORD_HASH` (`scrypt:<salt>:<hash>`, made with `npm run hash-password`; never use `$` in
  it, because `.env` files expand `$`). Never ship the password or the hash to the client.
- Success sets an HTTP-only signed cookie. Owner can: edit room copy inline (title, desc, update) and drawer data,
  hide guestbook messages, and open `/admin` (visitor list, per-visitor timeline, interest per room).
- Everyone else can only play, record scores, and write in the guestbook.

## 8. Adding a new room (checklist)

1. Add a record to `ROOMS` in `app/data.ts` (key, label, title, desc, update, lucide icon) and its key to
   `ROOM_KEYS` in `lib/validate.ts`.
2. If it is in the camera tour: add its `mark` and frame `rect`, and re-render frames.
3. Add a drawer body in `app/rooms/bodies.tsx` following the table above.
4. It appears automatically in the dock, the grid, and the dashboard's interest chart.

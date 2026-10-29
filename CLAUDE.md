# 0zong의 방 — project memory for Claude Code

A personal portfolio site: a small 3D house (main room, cinema, bedroom) where every hobby is an object. No scrolling:
`/` is one full-screen scene; you look around, click objects, and walk through doors. Korean UI, 해요체.

**Before changing copy, sections, the dock, drawers, the opening, guestbook, tracking, or owner mode, follow the
`zong-room-content` skill** (`.claude/skills/zong-room-content/SKILL.md`).

## Commands

```bash
npm run dev               # http://localhost:3000
npx tsc --noEmit          # must pass before any commit
npm run build             # must pass before any commit
npm run hash-password -- "pw"   # prints OWNER_PASSWORD_HASH + SESSION_SECRET for .env.local
npm run export-preview    # static demo-mode copy in ./out (no server, demo password "demo") — never deploy it
```

## Map

| path | what |
|---|---|
| `app/page.tsx` | composition: RoomProvider > SceneProvider > RoomStage, SpaceBar, Caption, Opening, IconBar, RoomDrawer, Panels, DashboardOverlay |
| `app/data.ts` | ROOMS (hobbies: copy, icon, `space`), SPACES (main, cinema, bedroom) |
| `app/scene/` | the 3D house (react-three-fiber, loaded only on `/`): `kit.ts` types + placeholder helpers, `spaces/<id>.ts` one room each (shell, things, doors, lamps, camera), `look.ts` time × weather → lighting, `House.tsx` canvas |
| `app/components/SceneContext.tsx` | current room (`?room=`), selection/hover, quality, Seoul env, bed time override (sessionStorage) |
| `app/components/RoomStage.tsx` | canvas or still photo (3D off), dark blink between rooms, hover label, hidden keyboard list of objects |
| `app/components/SpaceBar.tsx` / `Caption.tsx` / `Panels.tsx` | top-left room tabs + time/weather + settings / selected object card (bed = time picker) / about + guestbook sheets |
| `lib/env.ts` + `app/api/env` | Open-Meteo Seoul weather (30-min cache, `OPEN_METEO_BASE` for tests), time of day, owner weather pin |
| `app/components/RoomContext.tsx` | visitor identity/mode, event queue + flush, room overrides, drawer/panel/dashboard state |
| `app/components/Opening.tsx` | lights-on intro + guestbook gate + owner password reveal |
| `app/components/IconBar.tsx` | fixed dock: hobbies grouped by room (clicking one in another room walks there), about, guestbook |
| `app/rooms/bodies.tsx` | per-room drawer content (all example data for now; movie reads `getMovies()`) |
| `lib/movies.ts` | movie scoring (6 criteria = 100, stars = total/20), sort, summary; examples in `lib/movies.example.ts` |
| `app/movie/` + `app/components/movie/` | `/movie` score anatomy page (own route); owner add/edit/delete, TMDB search, 0zong-cinema import |
| `app/components/music/` | site-wide player (`PlayerProvider` in `app/layout.tsx`): audio engine with generated rain/fire, mini player, listening mode, music drawer |
| `app/game/` + `app/components/game/` | `/game` LOAD GAME screen: save slots (↑↓/Enter), play notes with screenshots, owner pin/edit; drawer summary |
| `lib/games.ts` | slots, notes, Steam snapshot types, `buildView` (merges Steam minutes), examples |
| `lib/steam.ts` | server-only Steam Web API (`STEAM_API_KEY`, `STEAM_ID`): owned games + platform time, per pinned game achievements (schema, world %), named stats, store facts; now playing (opt-in). Refreshed by owner, on pin, or when 6h stale |
| `lib/files.ts` | server-only file storage (`data/music/`, `data/shots/`), audio/image sniffing; swap with `lib/store.ts` for deployment |
| `lib/tmdb.ts` | server-only TMDB client (`TMDB_API_KEY` in `.env.local`); only `/api/tmdb` (owner only) calls it |
| `app/api/*` | visit, auth, events, guestbook, rooms, admin, movies (+ import), tmdb, music (+ `file/[id]` with Range), games (sync, library, slots, notes, shots, settings) |
| `integrations/apochill/` | LOCAL-ONLY overlay on a separate apochill-kit checkout (`npm run apochill`): proxy to 0zong, playlist merge, speech-bubble hook. apochill has no reuse license: never copy its files here or deploy |
| `lib/store.ts` | the only storage layer (JSON file `data/db.json`) |
| `lib/auth.ts` | owner check (scrypt), signed HTTP-only cookie |
| `lib/client.ts` | browser API; `NEXT_PUBLIC_DEMO=1` switches to localStorage |

## Invariants (don't break these)

- `/` never scrolls. Selecting an object never moves the camera (a `focus` slot is reserved for later); no tours.
- Rooms are data (`app/scene/spaces/`): a GLB replaces a placeholder by setting `model`, never by editing the scene code.
- Outside the window draws only through the window's stencil (the rooms have no ceiling).
- The bed's time is per tab and never sent anywhere; the owner's weather pin is for everyone.
- UI on top of the canvas is never gated on the 3D loading; without WebGL the still photo + dock still work.
- Never store IP, user agent, or location. `skip` and `owner` modes send no events.
- Password hash format `scrypt:<salt>:<hash>` — no `$` (dotenv expands it). Secrets only in `.env.local`.
- Framer-motion elements that need centering use `style={{ x: "-50%" }}` (framer overwrites CSS transforms).
- Example data stays labeled "예시" until replaced with real records.
- One `<audio>` for the whole site, created in `PlayerProvider`; the AudioContext starts only from a user gesture. Links
  between pages go through `PageLink` (client navigation) so playback survives `/` ↔ `/movie`.
- Uploaded audio is checked by its bytes (`sniffAudio`), never by name or browser MIME; uploads are owner only, 30MB max.
- Steam key and SteamID stay on the server; visitors get only pinned slots, never the full library. Screenshots are
  sniffed (jpg/png/webp), owner only, 5MB, 4 per note. Achievement icons pass only from Steam CDN hosts; "now playing"
  is off by default and turning it off deletes the stored status.
- The TMDB key stays on the server; movie writes and `/api/tmdb` are owner only. Poster paths must match TMDB's `/x.jpg` form.

## Status (2026-10-29)

Done: 3D house phase 1 (spec `docs/superpowers/specs/2026-10-29-3d-room-design.md`): three rooms with placeholder
furniture, doors, captions → drawers, bed time picker, Seoul time + weather, quality presets + still fallback. The old
scroll hero and its 202 frames are gone. Also: movie, music, game rooms, guestbook, tracking, owner mode, demo export.

## Backlog (rough priority)

1. Real content: replace example data per room; give drawers real data sources the owner can edit (not just title/desc/update).
2. Storage for deployment: swap `lib/store.ts` to Supabase/Postgres before hosting on Vercel.
3. Playable rooms: tetris 2-minute mode with leaderboard (`score` events), poker tutorial → AI → realtime tables,
   variant chess with stages.
5. 3D phases 2–4: Windows helper + 오늘의 방, Tripo models (`npm run models`) + character + events, owner arrange mode.
6. Mobile polish of the tour framing; Lighthouse/accessibility pass; deploy.

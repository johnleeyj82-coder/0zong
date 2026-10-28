# 0zong의 방 — project memory for Claude Code

A personal portfolio site: one photoreal room at night where every hobby is an object. Visitors scroll a camera
tour (canvas frame scrub), then explore. Korean UI, 해요체.

**Before changing copy, sections, the dock, drawers, the opening, guestbook, tracking, or owner mode, follow the
`zong-room-content` skill** (`.claude/skills/zong-room-content/SKILL.md`).

## Commands

```bash
npm run dev               # http://localhost:3000
npx tsc --noEmit          # must pass before any commit
npm run build             # must pass before any commit
npm run frames            # prints FRAME_COUNT after replacing public/frames
npm run hash-password -- "pw"   # prints OWNER_PASSWORD_HASH + SESSION_SECRET for .env.local
npm run export-preview    # static demo-mode copy in ./out (no server, demo password "demo") — never deploy it
```

## Map

| path | what |
|---|---|
| `app/page.tsx` | composition: RoomProvider > HeroProvider > hero, sections, Opening, IconBar, RoomDrawer, DashboardOverlay |
| `app/data.ts` | ROOMS (copy, icon, tour `mark`, frame `rect`), FRAME_COUNT, MARKS |
| `app/components/ScrollHero.tsx` | canvas scrub, scroll-synced beats, view tracking |
| `app/components/RoomContext.tsx` | visitor identity/mode, event queue + flush, room overrides, drawer/dashboard state |
| `app/components/Opening.tsx` | lights-on intro + guestbook gate + owner password reveal |
| `app/components/IconBar.tsx` | fixed dock with tour progress |
| `app/rooms/bodies.tsx` | per-room drawer content (all example data for now; movie reads `getMovies()`) |
| `lib/movies.ts` | movie scoring (6 criteria = 100, stars = total/20), sort, summary; examples in `lib/movies.example.ts` |
| `app/movie/` + `app/components/movie/` | `/movie` score anatomy page (own route); owner add/edit/delete, TMDB search, 0zong-cinema import |
| `app/components/music/` | site-wide player (`PlayerProvider` in `app/layout.tsx`): audio engine with generated rain/fire, mini player, listening mode, music drawer |
| `lib/files.ts` | server-only audio file storage (`data/music/`), format sniffing; swap with `lib/store.ts` for deployment |
| `lib/tmdb.ts` | server-only TMDB client (`TMDB_API_KEY` in `.env.local`); only `/api/tmdb` (owner only) calls it |
| `app/api/*` | visit, auth, events, guestbook, rooms, admin, movies (+ import), tmdb, music (+ `file/[id]` with Range) |
| `lib/store.ts` | the only storage layer (JSON file `data/db.json`) |
| `lib/auth.ts` | owner check (scrypt), signed HTTP-only cookie |
| `lib/client.ts` | browser API; `NEXT_PUBLIC_DEMO=1` switches to localStorage |

## Invariants (don't break these)

- Canvas: only mark a frame "drawn" when a loaded image was painted (`draw()` returns boolean); keep the separate
  `wanted` index checked by both the rAF loop and each image's onload. No scroll listeners in the hero — rAF only.
- Hero text is never gated on image loading.
- Never store IP, user agent, or location. `skip` and `owner` modes send no events.
- Password hash format `scrypt:<salt>:<hash>` — no `$` (dotenv expands it). Secrets only in `.env.local`.
- Framer-motion elements that need centering use `style={{ x: "-50%" }}` (framer overwrites CSS transforms).
- Example data stays labeled "예시" until replaced with real records.
- One `<audio>` for the whole site, created in `PlayerProvider`; the AudioContext starts only from a user gesture. Links
  between pages go through `PageLink` (client navigation) so playback survives `/` ↔ `/movie`.
- Uploaded audio is checked by its bytes (`sniffAudio`), never by name or browser MIME; uploads are owner only, 30MB max.
- The TMDB key stays on the server; movie writes and `/api/tmdb` are owner only. Poster paths must match TMDB's `/x.jpg` form.

## Status (2026-10-26)

Done: scroll hero with 202 frames rendered from the owner's room image (`public/frames`), icon dock, room drawers,
guestbook, visitor tracking, owner edit mode + dashboard, demo-mode preview export. Verified end to end with Playwright.

## Backlog (rough priority)

1. Real content: replace example data per room; give drawers real data sources the owner can edit (not just title/desc/update).
2. Storage for deployment: swap `lib/store.ts` to Supabase/Postgres before hosting on Vercel.
3. Playable rooms: tetris 2-minute mode with leaderboard (`score` events), poker tutorial → AI → realtime tables,
   variant chess with stages.
5. Runway video (needs a paid Runway plan): generate the fly-through from the room image, extract frames with ffmpeg,
   update FRAME_COUNT / MARKS / rects (README has the steps).
6. Mobile polish of the tour framing; Lighthouse/accessibility pass; deploy.

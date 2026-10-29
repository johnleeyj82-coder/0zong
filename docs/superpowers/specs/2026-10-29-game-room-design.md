# 게임 방: 세이브 파일 화면 (설계)

2026-10-29 · 승인: 소유자 (채팅, "게임 방 설계대로 진행해줘")

## 목표

Steam에서 가져온 플레이 시간 위에 주인이 진행 상황과 그날 메모·스크린샷을 덧붙이고, `/game`을 게임의 "LOAD GAME"
화면처럼 보여준다. 방 서랍에는 요약만.

## 범위 밖

Steam 업적 진행률, 방문자 댓글, 날짜별 Steam 플레이 시간(Steam이 주지 않음).

## Steam (서버 전용, `lib/steam.ts`)

- `STEAM_API_KEY`, `STEAM_ID`(17자리)는 `.env.local`에만. `STEAM_API_BASE`는 테스트용.
- `IPlayerService/GetOwnedGames/v1` (include_appinfo, include_played_free_games): appid, name, playtime_forever(분),
  playtime_2weeks, rtime_last_played. 응답에 games가 없으면 "게임 세부 정보 비공개" 안내, 401/403은 키 안내.
- 결과는 `db.json`의 `games.steam = { syncedAt, games, error? }`에 저장. 주인의 "Steam에서 가져오기", 또는 6시간이 지난
  뒤 `GET /api/games`가 들어오면 뒤에서 한 번(동시에 하나만) 갱신. 방문자는 Steam을 직접 부르지 않는다.
- 표지: Steam CDN `library_600x900.jpg`, 실패하면 `header.jpg`, 그것도 실패하면 글자 표지.
- 전체 게임 목록은 주인만(`GET /api/games/library`). 공개 응답에는 슬롯에 건 게임만.

## 데이터 (`lib/games.ts`, `db.json`의 `games`)

- Slot: id, kind(`steam`|`manual`), appid?, title ≤80, status(`playing`|`cleared`|`paused`|`dropped`),
  progress?(0~100 정수), progressLabel ≤30, lastSpot ≤60, manualMinutes?(직접 추가 게임), addedAt.
- Note: id, slotId, date(실제 날짜), hours?(0~24, 소수 첫째 자리), text 1~500, shots(이미지 id 0~4개).
- Shot: id(uuid), ext, mime, size. 파일은 `lib/files.ts`가 이미지 폴더에 저장. jpg/png/webp를 바이트로 판별, 5MB까지.
- 공개 보기(GameView): 슬롯 + Steam 숫자 합침. 분 = Steam 총 시간 또는 manualMinutes, 최근 2주, 마지막 플레이
  (Steam 또는 가장 최근 메모 날짜). 마지막 플레이 최신순.
- 슬롯이 하나도 없으면 예시 3개(엘든링, 할로우 나이트, 발더스 게이트 3)와 예시 메모를 "예시"로 표시.

## API (쓰기는 모두 주인만)

`GET /api/games` · `POST /api/games/sync` · `GET /api/games/library?q=` · `POST|PUT|DELETE /api/games/slots` ·
`POST|PUT|DELETE /api/games/notes` · `POST /api/games/shots`(multipart 한 장) · `GET /api/games/shot/[id]`(오래 캐시).
슬롯을 지우면 그 메모와 스크린샷 파일도 지운다.

## 화면

- `/game`: 라벨 `LOAD GAME`, 제목. 왼쪽 슬롯 목록(SLOT 번호, 표지, 제목, `시:분`, 마지막 저장 장소, 10칸 진행률,
  상태), 오른쪽 상세(총 시간·최근 2주·마지막 플레이, 진행 한 줄, 날짜별 메모와 스크린샷, 누르면 크게).
  ↑↓로 고르고 Enter로 연다. 고른 슬롯은 ▶ 깜박임과 램프 프레임. 768px 미만은 목록과 상세가 한 화면씩.
- 주인: Steam에서 가져오기(마지막 갱신 시각, 오류 안내), 슬롯에 걸기(가진 게임 검색, 최근 2주 게임 먼저),
  직접 추가, 슬롯 고치기·내리기, 메모 쓰기·고치기·지우기(두 번), 스크린샷 올리기.
- 게임 서랍: 슬롯 상위 3개, 최근 메모 한 줄, "세이브 파일 열기"(`PageLink`, 음악 유지).
- 데모: Steam·스크린샷 꺼짐(안내), 슬롯·메모는 localStorage.

## 검증

Steam 흉내 로컬 서버로 가져오기·비공개 안내·6시간 갱신. curl: 403/400/415/413, 공개 응답에 전체 목록 없음.
Playwright: 걸기 → 메모·스크린샷 → 키보드 선택·열기, 데스크톱·모바일 스크린샷. `tsc`, `build`, `export-preview`.

---

# 2단계: Steam에서 가져올 수 있는 것 전부

2026-10-29 · 승인: 소유자 (채팅, "가져올 수 있는것들 다 가져와서 붙여줘")

## 가져오는 것 (슬롯에 건 Steam 게임만, 서버에서)

| 정보 | API | 저장 |
|---|---|---|
| 플랫폼별 시간 (Windows/Mac/Linux/Deck) | `GetOwnedGames` (이미 부름) | SteamGame에 필드 추가 |
| 업적 달성·달성 시각 | `ISteamUserStats/GetPlayerAchievements/v1` (l=koreana) | `games.details[appid].achievements` |
| 업적 이름·설명·아이콘·숨김, 통계 이름 | `ISteamUserStats/GetSchemaForGame/v2` (l=koreana) | 같은 곳 |
| 업적 전 세계 달성률 | `ISteamUserStats/GetGlobalAchievementPercentagesForApp/v2` | 같은 곳 |
| 게임별 통계 | `ISteamUserStats/GetUserStatsForGame/v2` | `details[appid].stats` (이름 있는 것만, 최대 8개) |
| 소개·장르·출시일·개발사 | 상점 `appdetails` (l=korean, cc=kr) | `details[appid].store` |
| 지금 플레이 중 | `ISteamUser/GetPlayerSummaries/v2` | `games.presence` |

- 갱신: "Steam에서 가져오기", 6시간 지난 자동 갱신, 슬롯에 걸 때(그 게임만, 뒤에서). 항목별 실패는 그 항목만 비우고
  나머지는 저장. 게임마다 순서대로 요청(Steam에 부담 주지 않게).
- 아이콘 주소는 Steam CDN 호스트만 통과(`*.steamstatic.com`, `steamcdn-a.akamaihd.net`), 아니면 버린다.
- 숨김 업적은 달성 전까지 이름·설명 대신 "숨겨진 업적".
- 지금 플레이 중: `games.settings.showPresence`가 켜져 있을 때만(기본 꺼짐) 2분마다 갱신, 10분 넘은 정보는 안 보냄.
  게임 이름만 공개(온라인 상태 등은 저장하지 않음). `STEAM_STORE_BASE`는 테스트용.

## 화면

- 슬롯 진행률: 주인이 적은 진행률이 없고 업적이 있으면 업적 달성률로 채우고 "업적 34/52"로 표시.
- 세이브 상세: 장르·출시일·개발사와 짧은 소개, 플랫폼별 시간(0 아닌 것), 업적 요약과 희귀 업적 3개(아이콘, 이름,
  전 세계 달성률), "업적 전체 보기"(달성한 것 먼저, 날짜와 달성률), 통계 표.
- 플레이 일지: 직접 쓴 메모와 최근 업적 달성(최대 20개)을 날짜순으로 섞음. 업적 줄은 🏆 대신 아이콘 + "업적".
- 지금 플레이 중: 켜져 있으면 `/game` 머리와 게임 서랍에 "지금 ○○ 하는 중" 한 줄(램프 색 점 하나).
  주인 막대에 켜기/끄기.

## 검증

Steam·상점 흉내 서버에 업적·스키마·전 세계 달성률·통계·상점·요약 응답 추가. 통계 없는 게임(400), 업적 없는 게임,
숨김 업적, CDN 아닌 아이콘 주소, 플레이 중 끄기/켜기/오래된 정보를 확인. Playwright 스크린샷.

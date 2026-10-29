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

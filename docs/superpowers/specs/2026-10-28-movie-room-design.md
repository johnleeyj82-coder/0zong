# 영화 방: 점수 해부도 (설계)

2026-10-28 · 승인: 소유자 (채팅, 점수 해부도 방향 선택)

## 목표

0zong-cinema의 6항목 100점 점수 체계를 가져와서, 영화 서랍에는 요약을, `/movie`에는 정렬 가능한 전체 목록을 보여준다.
평론(메모, 본 장소)은 가져오지 않는다. 이번 단계는 예시 데이터로 읽기 전용이다.

## 범위 밖 (다음 단계)

- 주인이 영화를 추가·수정·삭제하는 화면, TMDB 검색(서버에서 호출, 키는 `.env.local`)
- 0zong-cinema localStorage 데이터 가져오기
- `/movie` 페이지 방문 기록

## 데이터

`lib/movies.ts` (클라이언트·서버 공용)

- `CRITERIA`: engagement 25 · aftertaste 20 · story 20 · character 15 · visual 15 · personal 5 (합 100)
- `Movie`: id, title, originalTitle?, year, director, genres, runtime?, posterPath?, tmdbId?, watchedAt (YYYY-MM-DD),
  scores (항목별), example?
- 총점·별점은 저장하지 않고 계산: `total(m)`, `stars(m) = round(total / 20, 1)`
- `sortMovies(list, key, dir)`: key = `total` | `watched` | 항목 키. 같은 값이면 본 날 최신순.

`lib/movies.example.ts`: 예시 8편. 영화 정보(감독·연도·상영 시간)는 실제 값, 점수와 본 날은 예시. 포스터 경로는 지어내지
않고 비워 둔다 (글자 포스터로 대체). 모든 행에 `example: true` → 화면에 "예시" 표시.

## 흐름

`lib/store.ts`의 `listMovies()` (DB에 `movies`가 없거나 비면 예시) → `GET /api/movies` → `lib/client.ts`의 `getMovies()`
(데모 모드는 예시를 바로 반환). 컴포넌트는 저장소를 직접 부르지 않는다.

## 화면

**영화 서랍** (`app/rooms/bodies.tsx`의 `Movie`): 편수와 평균 별점, 총점 상위 5편 (제목, 작은 해부도 막대, 별점),
"전체 보기" → `/movie`. 불러오는 중 / 빈 상태 / 실패 상태를 둔다.

**`/movie`** (`app/movie/page.tsx` + `app/components/movie/*`)

- 머리: 라벨 `FILM LOG`(페이지에서 유일한 라벨), h1 "내가 매긴 점수들", 한 줄 설명
- 숫자 3개: 편수, 평균 별점, 가장 후한 항목 (항목 평균 / 만점 비율이 가장 높은 것)
- 범례: 6개 항목의 견본과 만점
- 정렬 버튼: 총점, 본 날, 6개 항목. 같은 버튼을 다시 누르면 방향이 바뀐다. `aria-pressed`
- 줄: 순위, 포스터(없으면 글자 포스터), 제목·연도·감독, 해부도 막대, 별점과 총점. 누르면 펼쳐져 항목별 점수/만점
- 해부도 막대: 너비 100% = 100점. 회색 바탕 트랙은 두지 않고 100점 위치에 얇은 끝 눈금만 둔다.
  항목은 텅스텐 한 색의 진하기 6단계로 구분하고 사이에 1px 틈을 둔다. 정렬 중인 항목은 램프 색으로 밝게.
- 펼친 줄과 호버한 줄에 램프 프레임
- 모션: 정렬 시 framer `layout`, 펼치기 높이 전환. `prefers-reduced-motion`이면 즉시
- 768px 미만: 막대가 제목 아래로, 포스터 작게

## 검증

`npx tsc --noEmit`, `npm run build`, `curl /api/movies`, Playwright로 데스크톱·모바일 스크린샷 (서랍, `/movie`, 정렬 변경,
펼침), `npm run export-preview` 빌드 성공.

---

# 2단계: 주인 편집, TMDB 검색, 0zong-cinema 가져오기

2026-10-28 · 승인: 소유자 (채팅, "그대로 진행하고 가져오기 칸도 넣어줘")

## 서버

- `lib/tmdb.ts` (server-only): `searchTmdb(q)` 최대 8개, `tmdbMovie(id)` (감독은 credits에서, 장르·상영 시간·포스터).
  키는 `TMDB_API_KEY` (v3 키는 `api_key`, `eyJ`로 시작하는 v4 토큰은 Bearer). `TMDB_API_BASE`는 테스트용 주소 바꾸기.
  언어 `ko-KR`, 8초 제한. 키 없음 / 키 틀림 / 연결 실패를 구분한 한국어 메시지.
- `GET /api/tmdb?q=` · `GET /api/tmdb?id=`: 주인만. 키가 없으면 503 + 안내.
- `POST /api/movies` (새로 만들기, id는 서버가 생성) · `PUT` (있는 것만) · `DELETE ?id=`: 주인만.
- `POST /api/movies/import`: 주인만, 최대 500편, 칸마다 검사해서 틀린 것은 건너뛰고 개수를 돌려줌. 같은 id는 덮어씀
  (다시 가져와도 중복되지 않음).
- `parseMovie()` (`lib/validate.ts`): 제목 1~100자, 원제 ≤100, 연도 1888~2100 정수, 감독 ≤60, 장르 ≤6개 각 ≤20자,
  상영 시간 1~999, 포스터는 `^/[A-Za-z0-9_-]+\.(jpg|jpeg|png)$`만, tmdbId 양의 정수, 본 날 실제 날짜 `YYYY-MM-DD`,
  점수는 0~만점, 소수 첫째 자리로 반올림.
- 저장소: `saveMovie`, `updateMovie`, `removeMovie`, `importMovies`. 실제 기록이 하나라도 있으면 예시는 보이지 않음.

## 가져오기

0zong-cinema의 `localStorage['0zong-films']` 배열을 붙여넣는다. `fromCinema()` (`lib/movies.ts`)가 변환:
id → `cin-<원래 id>`, 문자열 점수 → 숫자, `watchedDate`(없으면 `savedAt` 날짜) → `watchedAt`.
평론(memo, watchedPlace, overview)과 TMDB 평점은 가져오지 않는다. 미리보기(편수, 건너뛸 편수, 앞 5편 제목) 후 저장.

## 화면 (`/movie`, 주인일 때만)

- 정렬 줄에 "영화 추가", "가져오기". 예시가 보이는 동안 "첫 영화를 저장하면 예시 8편은 사라져요" 안내.
- 펼친 줄(예시 제외)에 "수정", "삭제"(두 번 눌러야 삭제).
- 편집 시트: 방 서랍과 같은 오른쪽 시트(768px 미만은 아래에서). TMDB 검색(350ms 멈추면 검색, 이전 요청 취소) →
  고르면 칸 채움. 직접 입력칸, 날짜, 6개 슬라이더(0~만점, 1점 단위)와 실시간 해부도 막대·총점·별점. Esc로 닫기.
- 데모 모드: 편집·가져오기는 그 브라우저 localStorage에, TMDB 검색은 꺼짐(안내).

## 검증

TMDB 흉내 로컬 서버 + `TMDB_API_BASE`로 검색 → 선택 → 저장을 Playwright로. 주인 아님 403, 잘못된 값 400을 curl로.
가져오기는 0zong-cinema 형식 샘플로. `tsc`, `build`, 데스크톱·모바일 스크린샷, `export-preview` 빌드.

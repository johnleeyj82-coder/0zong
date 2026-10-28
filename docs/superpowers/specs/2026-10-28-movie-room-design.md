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

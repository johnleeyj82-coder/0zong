# apochill-kit 위에 0zong 기능 얹기 (로컬 시험판, 설계)

2026-10-29 · 승인: 소유자 (채팅, "진행해보고 음악같은 경우는 자체 플레이어 + 내가 추가할 수 있는 느낌으로")

## 조건

apochill-kit(jujinghks3-svg)은 라이선스가 없고 "공개 열람·검토용"이다. 그래서 **내 컴퓨터에서만** 돌리는 시험판이다.
0zong 저장소(공개)에는 우리가 쓴 코드만 넣고, apochill의 코드·모델·텍스처·음악은 넣지도 배포하지도 않는다.
apochill 파일은 디스크에서 고치지 않는다(아래 말풍선 연결은 개발 서버 메모리에서만).

## 실행 구조

`npm run apochill` (0zong) → `integrations/apochill/run.mjs`가 apochill 폴더(`APOCHILL_DIR`, 기본 `../apochill-kit`)의
Vite를 불러 `createServer({ root, configFile: 그쪽 vite.config.js, plugins: [zong 플러그인], server: { proxy } })`로 띄운다.
0zong(`npm run dev`, 3000)은 따로 켜둔다.

- `/zong/*` → 0zong 서버 중계(쿠키 포함). 주인 로그인은 오버레이에서 `/zong/api/auth`로 해서 127.0.0.1 쿠키를 받는다.
- `/audio/bgm/playlist.json` → apochill 원래 목록 + 0zong 곡(`zong/<id>.<ext>`)을 합쳐서 돌려준다.
  `/audio/bgm/zong/<id>.<ext>` → 0zong `/api/music/file/<id>` 중계(Range 포함). apochill 플레이어의 검사(같은 출처,
  `/audio/bgm/` 아래, 음원 확장자)를 그대로 통과한다.
- `index.html`에 오버레이 스크립트 한 줄을 끼운다(transformIndexHtml).
- `src/work-status-ui.js`에 `zong:phrase` 이벤트를 듣는 한 줄을 끼운다(transform). 대상 문자열을 못 찾으면 끼우지 않고
  오버레이가 자체 도트 말풍선으로 대신한다.

## 오버레이 (`integrations/apochill/overlay/`, 우리 코드, apochill 도트 UI 변수 사용)

캠프 설정 독 안에 "0ZONG 기록함" 패널: 탭 4개.
- 게임: 세이브 슬롯(제목, 시:분, 10칸 진행률, 업적 수). 누르면 대화창(통계, 희귀 업적, 최근 일지 5개).
- 영화: 총점 상위 5편(별점), "전체 보기"는 0zong `/movie`를 새 탭.
- 음악: 라디오에 들어간 내 곡 목록, 주인이면 곡 올리기(0zong `/api/music`). 올린 뒤 "라디오에 반영(새로고침)".
- 주인: 로그인/로그아웃(이름, 비밀번호 → 0zong).
- 지금 플레이 중: 60초마다 `/zong/api/games`의 `nowPlaying`을 보고 캐릭터 말풍선을 "지금 ○○ 하는 중"으로,
  끝나면 원래 문구로.
- 0zong 서버가 꺼져 있으면 패널에 "0zong 서버(3000)를 켜주세요" 안내, apochill은 그대로 동작.

## 검증

로컬에서 apochill `npm ci`, 0zong 서버 + 흉내 Steam, `npm run apochill`, Playwright(WebGL 소프트웨어 렌더)로 패널·말풍선·
재생 목록 합치기·곡 중계(206)·주인 로그인·업로드 확인, 스크린샷. 0zong `tsc`, `build`.

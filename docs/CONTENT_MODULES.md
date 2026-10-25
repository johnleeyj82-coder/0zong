# CONTENT MODULES

> 상태: PHASE 0 데이터 모델 **초안**. 필드는 PHASE 3 구현 때 확정한다.
> PHASE 1에서는 아래 3개 모듈의 **임시 화면**만 있다(예시 데이터, 저장 없음).

## 공통 계약

모든 모듈은 다음을 가진다 (`src/modules/types.ts`, `src/room/objects.ts`).

| 항목 | 현재 필드 | 설명 |
|---|---|---|
| moduleId | `ModuleDefinition.moduleId` | 모듈 고유 ID |
| objectId | `RoomObject.objectId` → `moduleId` | 방 안 사물과 연결 (여러 사물이 한 모듈을 가리킬 수 있음) |
| 제목 | `title`, `subtitle` | |
| 진입 효과 | `entry` (`monitor-zoom` / `poster-zoom`) | PHASE 1은 공통 포커싱 + 패널 |
| 권한 | `permission` (`public` / `admin`), 사물 `visibility` | 실제 판정은 PHASE 3 서버 |
| 상태 | `status` (`placeholder` / `live`) | 임시 화면이면 패널에 표시 |
| 사용 기록 | — | PHASE 3: 익명 집계 이벤트 (`ANALYTICS` 절) |
| 복귀 동선 | 패널 "방으로 돌아가기", ESC, 뒤로 가기 | 모든 모듈 공통 |

## 공통 데이터 (계획)

```ts
// 모든 기록형 엔티티가 공유
type Visibility = 'public' | 'unlisted' | 'private'
type Base = {
  id: string            // uuid
  createdAt: string     // ISO
  updatedAt: string
  visibility: Visibility // 기본 private (보안 노트), public (영화·게임은 선택)
  tags: string[]
}
type MediaRef = { id: string; kind: 'image' | 'video' | 'audio'; url: string; alt?: string; width?: number; height?: number }
```

## 모듈별 초안

### GAME ARCHIVE — 왼쪽 27" 모니터 (PHASE 1 임시 화면 있음)

```ts
type Game = Base & {
  title: string; platform: string[]; cover?: MediaRef
  status: 'playing' | 'completed' | 'paused' | 'dropped' | 'backlog'
  playMinutes: number; rating?: number /* 0~5 */; review?: string
  steamAppId?: number   // 연동은 검토 대상
}
type GameLog = Base & { gameId: string; date: string; kind: 'progress' | 'clear' | 'tip' | 'thought'; body: string /* Markdown */; screenshots: MediaRef[] }
type Achievement = Base & { gameId: string; name: string; achievedAt?: string }
```
- 피드: GameLog를 게임별·전체 타임라인으로 정렬.
- Steam: 공개 프로필 + Web API 키 필요. 키는 서버 환경 변수. 미지원이면 수동 입력만.

### CYBERSECURITY KNOWLEDGE LAB — 오른쪽 24" 모니터 (PHASE 1 임시 화면 있음)

```ts
type Field = 'crypto' | 'pwnable' | 'reversing' | 'web' | 'system' | 'ctf'
type Note = Base & { title: string; field: Field; path: string[] /* 계층 분류 */; body: string /* Markdown + 코드 + 수식 */; links: string[] /* 다른 Note id, 양방향은 역참조로 계산 */ }
type Problem = Base & { source: string /* dreamhack, boj, ctf명 */; title: string; url?: string; status: 'todo' | 'solving' | 'solved' | 'review'; solvedAt?: string; noteIds: string[]; reviewAt?: string }
type StudyEvent = { date: string; minutes: number; field: Field }  // 히트맵 집계용
```
- **비공개 보안 실습 기록은 기본 private, 저장 위치를 공개 콘텐츠와 분리**.
- 이후 임베딩/RAG를 위해 Note 본문은 원문 Markdown 그대로 저장.

### CINEMA ARCHIVE — 포스터 (PHASE 1 임시 화면 있음)

```ts
type Movie = Base & { title: string; year?: number; poster?: MediaRef; genres: string[] }
type Viewing = Base & { movieId: string; watchedAt: string; rating?: number /* 0~5, 0.5 단위 */; review?: string; rewatch: boolean; scenes: { note: string; image?: MediaRef }[] }
type Watchlist = Base & { movieId: string; priority: number }
```
- `johnleeyj82-coder/0zong-cinema` 재사용 검토 예정. **이 세션에서는 접근 범위 밖이라 내용을 보지 못했다.**

### 나머지 모듈 (설계만)

| 모듈 | 사물 | 핵심 엔티티 초안 | 먼저 정할 것 |
|---|---|---|---|
| MY FILM THEATER | 걸이형 스크린 | `Film { title, video: MediaRef \| externalUrl, intent, process, scenes[] }` | 영상 호스팅 위치 |
| TETRIS CHALLENGE | 큐브 | `Run { nickname, mode, score, lines, durationMs, inputLog, verified }` | 게임 방식(스프린트/시간 제한/점수전), 서버 재검증 방식 |
| POKER STUDIO | 카드 | `Table`, `Seat`, `Hand`, `Action` (가상 칩만) | A단계 연출 범위 |
| IMAGINATION ARCHIVE | 소설책 | `Book`, `Entity { kind: 자유 문자열, fields: JSON }`, `Relation`, `Event`, `ImageGen { prompt, version, result }`, `origin: 'canon' \| 'mine'` | 원작/개인 해석 구분 표시 |
| TIME & ATMOSPHERE | 침대 | `LightPreset { name, sunDir, color, intensity, sky }` | 프리셋 6종 품질 |
| PHYSICAL INTERACTIONS | 커튼·조명 | 상태만 (`curtainOpen`, `lamp`) | 천 시뮬 대신 보간 애니메이션 |
| EXPERIMENTAL CHESS | 체스판 | `RuleSet`, `Match`, `Move`, `Duel` | 특수 규칙 후보 비교 |
| SOUND & MUSIC | 헤드셋 | `Track { media, rights: 'own' \| 'embed' }`, `Playlist` | 권리 있는 파일만 |
| BREWING LAB | 위스키잔 | `Recipe`, `Batch { measured vs simulated }`, `TastingNote` | 실측/추정 구분 |

## 방명록·통계 (계획)

```ts
type GuestEntry = { id: string; nickname?: string /* 없으면 익명 */; body: string; createdAt: string; hidden: boolean }
type AnalyticsEvent = { day: string /* 날짜 단위로만 */; kind: 'object_select' | 'module_enter' | 'game_play'; key: string; count: number }
```
- 원시 IP·정밀 위치·지문 수집 안 함. 날짜 단위 집계 테이블에 카운트만 올린다.
- 방명록 닉네임과 이벤트를 잇지 않는다.
- 수집 범위 고지 문구, 보유 기간(예: 13개월) 후 삭제.

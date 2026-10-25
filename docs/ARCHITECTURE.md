# ARCHITECTURE

> 상태: PHASE 1 구현 기준. "현재"는 저장소에 있는 코드, "계획"은 설계만 있는 부분이다.

## 1. 기술 스택 (PHASE 1에서 고른 최소 구성)

설치 시점(2026-10-25)에 npm 레지스트리에서 확인한 안정 버전으로 고정했다.

| 영역 | 선택 | 버전 | 이유 |
|---|---|---|---|
| 웹 프레임워크 | Next.js (App Router) | 16.4.3 | 마스터 프롬프트 후보. 이후 서버 기능(API, 인증)을 같은 저장소에서 붙이기 쉬움 |
| UI | React | 19.3.1 | R3F 9.8의 피어 범위(`>=19 <19.4`) 안 |
| 3D | three | 0.186.1 | |
| 3D React 바인딩 | @react-three/fiber | 9.8.2 | 선언형 장면, 포인터 이벤트 레이캐스트 내장 |
| 3D 도우미 | @react-three/drei | 10.7.9 | OrbitControls, Edges, Html, useTexture, useProgress |
| 언어 | TypeScript | ~6.0.3 | 7.0.2가 최신이지만 Next 16 빌드 도구와의 호환을 확인하지 않아 6.0 유지 |
| 린트 | oxlint | ^1.88 | 이전 저장소 설정 유지. Next 16은 `next lint`를 제공하지 않음 |
| 단위 테스트 | Vitest | 5.0.5 | |
| E2E | @playwright/test | 1.63.0 | 컨테이너에 설치된 크로미움(1.63)과 맞춤 |

**넣지 않은 것**: 상태 관리 라이브러리, 애니메이션 라이브러리(GSAP/Motion), 후처리, DB, 인증. PHASE 1에 필요하지 않다.

**이전 코드와의 관계**: `main`의 Vite + Spark(가우시안 스플랫) 뷰어는 Next.js 구조로 옮기면서 걷어냈다. 스플랫 렌더러(`@sparkjsdev/spark`)는 실사 복원 방식이 정해지는 PHASE 2에서 다시 검토한다. 사진 질감 임시 방은 이전 커밋 `cd3f2db`의 조립 방을 가져와 다듬었다.

## 2. 폴더 구조 (현재)

```
src/
  app/                    Next.js 진입점 (layout, page, 전역 CSS)
    RoomLoader.tsx        3D를 브라우저에서만 불러오는 dynamic import (ssr: false)
  room/                   ── Room Renderer + Object Interaction Manager
    layout.ts             방 치수, 처음 시점, Orbit 제한, 카메라 경계 상자
    objects.ts            사물 등록표 (objectId → moduleId, 히트박스, 포커스 시점, 공개 여부)
    interaction/machine.ts 상호작용 상태 기계 (순수 함수)
    camera/math.ts        가감속 보간, 경계 클램프, 전환 시간 (순수 함수)
    RoomExperience.tsx    최상위 클라이언트 컴포넌트: Canvas + UI + 상태
    scene/
      TempRoom.tsx        임시 방 메쉬 (사진 질감 상자 방)
      Lights.tsx          낮 조명 한 가지
      InteractiveObjects.tsx 히트박스, 호버 테두리·이름표, 클릭
      CameraDirector.tsx  OrbitControls + 포커싱/복귀 비행 + 패널 쪽 화면 밀기
      DebugBridge.tsx     window.__room 테스트/측정 창구
    ui/                   HUD, 콘텐츠 패널, 로딩, WebGL 대체 화면, 주소(#) 동기화
  modules/                ── Content Module Registry
    types.ts              ModuleDefinition
    registry.ts           moduleId → 정의
    placeholders/         PHASE 1 임시 화면 3개
tests/unit                Vitest
tests/e2e                 Playwright
reference/                원본 자료 보관 (웹에 배포하지 않음)
public/tex                임시 방 질감 (방 사진에서 잘라 낸 것)
```

## 3. 런타임 구조

```
RoomExperience (상태: roomReducer)
 ├─ Canvas (R3F)
 │   ├─ Lights
 │   ├─ TempRoom            ← PHASE 2에서 실사 배경으로 교체되는 자리
 │   ├─ InteractiveObjects  ← objects.ts 를 읽어 히트박스 생성
 │   ├─ CameraDirector      ← 상태를 보고 비행 시작, 도착하면 arrived 이벤트
 │   └─ DebugBridge
 ├─ Hud (사물 바로가기 버튼 = 키보드/접근성 경로)
 ├─ ContentPanel           ← modules/registry 를 읽어 본문 표시
 └─ LoadingOverlay
```

### 상호작용 상태 기계

```
explore ──select──▶ focusing ──arrived──▶ content
   ▲                   │ close               │ close
   └──returned── returning ◀─────────────────┘
```

- 사물 클릭, 바로가기 버튼, 주소 `#objectId`, 브라우저 뒤로 가기는 모두 같은 `select`/`close` 이벤트로 들어간다.
- 카메라는 `focusing`/`returning`에서만 움직이고, 도착하면 `arrived`/`returned`를 보낸다.
- 패널은 `content`에서만 열린다. 카메라가 도착하기 전에는 UI를 띄우지 않는다.
- WebGL 대체 화면은 같은 상태 기계를 쓰되 비행 없이 바로 `arrived`/`returned`를 보낸다.

### 카메라

- OrbitControls: 패닝 끔, 감쇠(관성) 켬, 거리 0.6~1.75m, 상하 각도 31°~96°.
- 벽 관통 방지: OrbitControls 갱신 직후 카메라 위치를 `CAMERA_BOUNDS` 상자로 클램프한다. 방이 직육면체라 상자 하나로 충분하다. 실사 배경이 오면 충돌 메쉬 기반으로 바꾼다(계획).
- 포커싱: 현재 시점 → 사물의 `focus` 시점을 easeInOutCubic으로 보간. 시간은 이동 거리에 따라 0.55~1.3초. 모션 감소 설정이면 0초.
- 복귀: 사물로 가기 직전 시점을 기억했다가 그 자리로 돌아간다. "방 전체 보기"는 `HOME_POSE`로 간다.
- 패널이 오른쪽을 가리는 넓은 화면에서는 `camera.setViewOffset`으로 장면 중심을 왼쪽으로 민다. 레이캐스트도 같은 투영 행렬을 쓰므로 선택 위치가 어긋나지 않는다.

## 4. 사물·모듈 확장 방법

1. `src/modules/types.ts`의 `ModuleId`에 새 ID 추가, `registry.ts`에 정의와 본문 컴포넌트 등록.
2. `src/room/objects.ts`에 사물 한 줄 추가: `objectId`, `moduleId`, 히트박스, 포커스 시점, `visibility`.
3. 방 렌더러 코드는 고치지 않는다. 단위 테스트가 ID 중복·모듈 연결·시점이 방 안인지 검사한다.

완전히 새로운 게임(테트리스, 포커 등)은 본문 컴포넌트가 커지므로 각자 하위 폴더와 별도 상태를 가진다(계획).

## 5. 이후 Phase의 독립 모듈 (계획)

| # | 모듈 | 현재 | 계획 |
|---|---|---|---|
| 1 | Room Renderer | `room/scene` (임시 방) | 실사 배경(스플랫 or 메쉬) + 상호작용 메쉬 정합, 품질 단계 |
| 2 | Object Interaction Manager | `room/objects.ts`, `InteractiveObjects`, `machine.ts` | 사물별 진입 연출 훅 |
| 3 | Cinematic Transition System | `CameraDirector` 비행 | 오프닝 연출(직접 렌더한 카메라 경로 or 영상 프레임), 사물별 전환 |
| 4 | Content Module Registry | `modules/registry.ts` | 지연 로딩(dynamic import), 권한 필드 서버 판정 |
| 5 | User & Permission Service | 없음 | 관리자 세션·역할 (서버) |
| 6 | Guestbook Service | 없음 | |
| 7 | Activity Analytics Service | 없음 | 익명 집계 이벤트만 |
| 8 | Media Storage Service | 없음 | S3 호환 스토리지 |
| 9 | Game Service | 없음 | 점수 서버 검증, 이후 WebSocket 권위 서버 |
| 10 | Admin Dashboard | 없음 | |

### 데이터 (계획)

- PostgreSQL. 공개 콘텐츠와 비공개 학습/보안 실습 기록은 테이블 또는 스키마를 분리하고, 비공개는 기본값.
- 서버: 처음에는 Next.js Route Handler/Server Action. 실시간 멀티플레이(포커)가 필요해지면 독립 WebSocket 서버.
- 자세한 데이터 모델 초안은 `CONTENT_MODULES.md`.

## 6. 실사 복원 경로 비교 (PHASE 2 결정 대상)

| 경로 | 장점 | 위험 | 필요한 입력 |
|---|---|---|---|
| 가우시안 스플랫 (Spark 등) | 사진 같은 질감, 반사·빛 표현 | 첫 스캔 품질이 낮았음. 상호작용·충돌은 별도 메쉬 필요. 모바일 메모리 부담 | 겹치게 찍은 사진/영상, 고정 조명 |
| 포토그래메트리 메쉬 | 충돌·레이캐스트·조명 변경이 쉬움 | 흰 벽·모니터·유리 같은 무늬 없는 면이 잘 안 잡힘. 정리 작업 필요(Blender) | 사진 200장 이상, 실측 |
| 사진 질감 + 손 모델링 (현재 임시 방) | 가볍고 제어 쉬움, 시간대 조명 변경 가능 | 실사감 한계 | 실측 + 정면 사진 |
| 360 사진 구 | 한 자리에서는 가장 사실적 | 시점 이동 불가, 사물 정합이 어려움, 조명 변경 불가 | 360 카메라 |

권장 가설: **실측 기반 메쉬(상호작용·충돌·조명) + 배경 질감은 사진/스플랫 중 품질 좋은 쪽**. 입력 자료를 받으면 같은 시점에서 비교 렌더를 만들어 결정한다.

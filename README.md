# 0zong ROOM

실제 방을 디지털 공간으로 복원하고, 방 안의 사물을 눌러 게임·공부·영화 기록으로 들어가는 개인 아카이브.

> **현재 단계: PHASE 1 — Room Prototype.**
> 방은 손 평면도 치수로 조립하고 방 사진에서 잘라 낸 질감을 입힌 **임시 방**이다. 실사 복원은 PHASE 2에서 한다.

## 실행

```bash
npm install
npm run dev          # http://localhost:3000
```

운영 빌드로 확인:

```bash
npm run build
npm run start
```

## 해 볼 수 있는 것

- 드래그로 방을 돌려 보고, 휠/핀치로 확대·축소
- 왼쪽 모니터 · 오른쪽 모니터 · 포스터에 마우스를 올리면 테두리와 이름표
- 누르면 카메라가 다가가고 임시 콘텐츠(GAME ARCHIVE / CYBERSECURITY KNOWLEDGE LAB / CINEMA ARCHIVE)가 열림
- "방으로 돌아가기", ESC, 뒤로 가기로 복귀. 주소 `#poster` 처럼 열면 그 사물로 바로 들어감
- 아래 바로가기 버튼으로 키보드만으로도 이동
- `?nowebgl=1` 로 WebGL 없는 환경의 목록 화면 확인

## 검사

```bash
npm run typecheck    # TypeScript
npm run lint         # oxlint
npm test             # Vitest 단위 테스트
npm run build && npm run test:e2e   # Playwright (데스크톱 1280px + 모바일 375px)
```

E2E 스크린샷은 `test-results/evidence/`에 남는다. 결과 기록은 [docs/TEST_PLAN.md](docs/TEST_PLAN.md).

## 문서

| 문서 | 내용 |
|---|---|
| [PROJECT_VISION](docs/PROJECT_VISION.md) | 목적과 핵심 경험 |
| [REQUIREMENTS](docs/REQUIREMENTS.md) | 기능·비기능 요구사항, 입력 자료 현황 |
| [ARCHITECTURE](docs/ARCHITECTURE.md) | 스택, 폴더, 상태 기계, 카메라, 복원 경로 비교 |
| [CONTENT_MODULES](docs/CONTENT_MODULES.md) | 모듈별 데이터 모델 초안 |
| [INTERACTION_DESIGN](docs/INTERACTION_DESIGN.md) | 카메라·사물·전환 |
| [DESIGN_SYSTEM](docs/DESIGN_SYSTEM.md) | 색·글꼴·구성 요소 |
| [IMPLEMENTATION_ROADMAP](docs/IMPLEMENTATION_ROADMAP.md) | 단계별 계획, PHASE 2 준비물 |
| [TEST_PLAN](docs/TEST_PLAN.md) | 검증 기준과 실제 결과 |
| [DECISION_LOG](docs/DECISION_LOG.md) | 확정·가정·보류·대안 |

## 사물 추가하기

1. `src/modules/registry.ts`에 모듈 등록 (`src/modules/types.ts`의 `ModuleId`에도 추가)
2. `src/room/objects.ts`에 사물 한 줄: 히트박스 위치·크기, 다가갈 카메라 시점, 연결할 모듈

## 폴더

- `src/room` 방 렌더러, 카메라, 사물 상호작용
- `src/modules` 콘텐츠 모듈
- `public/tex` 임시 방 질감 (방 사진에서 잘라 냄)
- `reference/` 원본 자료 보관 (첫 Scaniverse 스캔, 이전 미리보기). 웹에 배포하지 않음

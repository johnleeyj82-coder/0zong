# 0zong의 방

실제 방을 스캔한 3D(가우시안 스플랫) 위에 클릭할 수 있는 물체를 얹은 개인 포트폴리오 사이트.

## 실행

```bash
npm install
npm run dev
```

## 스캔 파일 넣기

- 빠르게 확인: 실행한 화면에 `.spz` 또는 `.ply` 파일을 끌어다 놓는다.
- 고정으로 쓰기: 파일을 `public/room.spz`로 저장한다.
- 방이 뒤집혀 보이면 `src/room/config.ts`의 `splatRotation`을 고친다.

## 물체 위치 잡기

1. 화면 아래 **배치 모드**를 켠다. 히트박스가 파란 테두리로 보인다.
2. 방에서 물체가 있는 곳을 클릭하면 좌표가 나온다.
3. 그 좌표를 `src/room/config.ts`의 `hotspots` 항목 `position`에 넣는다.

## 구조

| 파일 | 역할 |
| --- | --- |
| `src/room/config.ts` | 방 스캔 경로, 눈 높이, 물체 목록과 위치 |
| `src/room/RoomSplat.tsx` | Spark로 스플랫 방 렌더링, 시간대 색 보정 |
| `src/room/CameraRig.tsx` | 의자 자리 고정 카메라, 드래그로 360도, 물체로 다가가기 |
| `src/room/Hotspots.tsx` | 호버 테두리·확대·이름표, 클릭 선택 |
| `src/room/timeOfDay.ts` | 시간별 색과 빛 |
| `src/room/PlaceholderRoom.tsx` | 스캔 전 임시 상자 방 |

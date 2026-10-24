// 방 설정. 스캔 파일이 바뀌면 이 파일의 숫자만 고치면 된다.
// 좌표 단위는 미터, 원점은 의자에 앉은 눈 위치 바로 아래 바닥이다.

export type Vec3 = [number, number, number]

export type Hotspot = {
  id: string
  label: string
  description: string
  // 히트박스 중심과 크기
  position: Vec3
  size: Vec3
  // 클릭했을 때 카메라가 서는 자리
  focus: { position: Vec3; lookAt: Vec3 }
}

export const room = {
  // public/room.spz (또는 .ply)가 있으면 그걸 띄운다. 없으면 임시 상자 방.
  splatUrl: '/room.spz',
  // 스캔 결과가 뒤집혀 나오면 여기서 돌린다 (라디안).
  splatRotation: [Math.PI, 0, 0] as Vec3,
  splatPosition: [0, 0, 0] as Vec3,
  splatScale: 1,

  // 의자에 앉은 눈 높이
  eye: [0, 1.15, 0] as Vec3,
  // 위아래로 볼 수 있는 각도 (도)
  pitchLimit: 45,
}

// 1단계 프로토타입 물체 3개. 위치는 실제 스캔이 오면 배치 모드로 다시 잡는다.
export const hotspots: Hotspot[] = [
  {
    id: 'monitor-left',
    label: '왼쪽 모니터',
    description: '게임 기록과 피드',
    position: [-0.55, 1.15, -0.9],
    size: [0.62, 0.38, 0.06],
    focus: { position: [-0.45, 1.15, -0.25], lookAt: [-0.55, 1.15, -0.9] },
  },
  {
    id: 'cube',
    label: '큐브',
    description: '테트리스 기록',
    position: [0.25, 0.8, -0.6],
    size: [0.07, 0.07, 0.07],
    focus: { position: [0.22, 0.98, -0.3], lookAt: [0.25, 0.8, -0.6] },
  },
  {
    id: 'poster',
    label: '포스터',
    description: '영화 기록',
    position: [1.66, 1.55, 0.2],
    size: [0.04, 0.9, 0.62],
    focus: { position: [0.6, 1.5, 0.2], lookAt: [1.6, 1.55, 0.2] },
  },
]

// 방 설정. 단위는 미터.
// 좌표: x = 포스터 벽(0) → 모니터 벽(W), z = 창문 벽(0) → 옷장 쪽 벽(L), y = 바닥(0) → 천장.
// 치수는 손 평면도에서 읽은 임시값이다. 실제 치수를 받으면 dims만 고치면 된다.

export type Vec3 = [number, number, number]

export const dims = {
  W: 2.9, // 포스터 벽 ↔ 모니터 벽 (임시)
  L: 3.8, // 창문 벽 ↔ 옷장 쪽 벽 (임시)
  H: 2.3, // 천장 높이 (임시)
}

export const room = {
  // 의자에 앉은 눈 위치. 모니터 책상 앞.
  eye: [1.95, 1.15, 1.85] as Vec3,
  // 처음 바라보는 방향 (라디안, 0 = 창문 쪽, π/2 = 모니터 벽)
  startYaw: Math.PI / 2,
  pitchLimit: 50,
}

export type Hotspot = {
  id: string
  label: string
  description: string
  position: Vec3
  size: Vec3
  // 클릭했을 때 카메라가 서는 자리
  focus: { position: Vec3; lookAt: Vec3 }
}

const { W } = dims

export const hotspots: Hotspot[] = [
  {
    id: 'monitor-left',
    label: '왼쪽 모니터',
    description: '게임 기록과 피드',
    position: [W - 0.32, 1.06, 1.58],
    size: [0.08, 0.38, 0.62],
    focus: { position: [W - 0.95, 1.08, 1.62], lookAt: [W - 0.32, 1.06, 1.58] },
  },
  {
    id: 'monitor-right',
    label: '오른쪽 모니터',
    description: '보안 공부 노트',
    position: [W - 0.32, 1.04, 2.16],
    size: [0.08, 0.33, 0.55],
    focus: { position: [W - 0.95, 1.06, 2.1], lookAt: [W - 0.32, 1.04, 2.16] },
  },
  {
    id: 'screen',
    label: '걸이형 스크린',
    description: '내가 만든 영상',
    position: [W - 0.04, 1.75, 1.85],
    size: [0.04, 0.9, 1.2],
    focus: { position: [W - 1.6, 1.6, 1.85], lookAt: [W - 0.04, 1.7, 1.85] },
  },
  {
    id: 'cards',
    label: '트럼프 카드',
    description: '홀덤',
    position: [2.08, 0.765, 0.75],
    size: [0.12, 0.05, 0.12],
    focus: { position: [1.75, 1.1, 1.05], lookAt: [2.08, 0.76, 0.75] },
  },
  {
    id: 'headset',
    label: '헤드셋',
    description: '좋아하는 소리와 음악',
    position: [2.25, 0.79, 0.6],
    size: [0.2, 0.1, 0.22],
    focus: { position: [1.85, 1.12, 0.95], lookAt: [2.25, 0.78, 0.6] },
  },
  {
    id: 'novel',
    label: '소설책',
    description: '내가 그린 소설 속 세계',
    position: [2.38, 0.8, 0.82],
    size: [0.2, 0.16, 0.26],
    focus: { position: [2.0, 1.15, 1.15], lookAt: [2.38, 0.8, 0.82] },
  },
  {
    id: 'posters',
    label: '포스터',
    description: '영화 기록',
    position: [0.02, 1.6, 2.65],
    size: [0.04, 0.6, 1.5],
    focus: { position: [1.4, 1.5, 2.65], lookAt: [0.02, 1.55, 2.65] },
  },
  {
    id: 'bed',
    label: '침대',
    description: '시간 정하고 자기',
    position: [0.55, 0.35, 1.0],
    size: [1.1, 0.5, 2.0],
    focus: { position: [1.7, 1.5, 1.6], lookAt: [0.55, 0.4, 1.0] },
  },
]

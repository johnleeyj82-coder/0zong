// 임시 방의 치수와 카메라 기준값. 단위는 미터.
// 좌표: x = 포스터 벽(0) → 모니터 벽(W), z = 창문 벽(0) → 옷장 쪽 벽(L), y = 바닥(0) → 천장(H).
// 치수는 손 평면도에서 읽은 임시값이다(실측 아님). 실측값을 받으면 dims만 고친다.

export type Vec3 = [number, number, number]

export type CameraPose = {
  position: Vec3
  target: Vec3
}

export const dims = {
  W: 2.9,
  L: 3.8,
  H: 2.3,
} as const

export const DESK_TOP = 0.73

// 처음 방에 들어왔을 때와 "방 전체 보기"로 돌아갈 때의 시점.
export const HOME_POSE: CameraPose = {
  position: [0.62, 1.55, 2.75],
  target: [1.75, 1.0, 1.75],
}

// Orbit 제한. 방이 좁아서 거리와 위아래 각도를 짧게 묶는다.
export const ORBIT_LIMITS = {
  minDistance: 0.6,
  maxDistance: 1.75,
  // 라디안. 0 = 바로 위에서 내려다봄, π/2 = 수평.
  minPolarAngle: 0.55,
  maxPolarAngle: 1.68,
  rotateSpeed: 0.55,
  zoomSpeed: 0.6,
  dampingFactor: 0.08,
} as const

// 카메라가 들어갈 수 있는 상자. 벽, 옷장, 모니터 안으로 들어가지 않게 한다.
export const CAMERA_BOUNDS = {
  min: [0.18, 0.85, 0.3] as Vec3,
  max: [dims.W - 0.5, dims.H - 0.15, dims.L - 0.75] as Vec3,
}

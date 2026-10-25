import type { CameraPose, Vec3 } from '../layout'

export function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v))
}

export function clampToBounds(p: Vec3, bounds: { min: Vec3; max: Vec3 }): Vec3 {
  return [
    clamp(p[0], bounds.min[0], bounds.max[0]),
    clamp(p[1], bounds.min[1], bounds.max[1]),
    clamp(p[2], bounds.min[2], bounds.max[2]),
  ]
}

export function easeInOutCubic(t: number) {
  const x = clamp(t, 0, 1)
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2
}

function lerp3(a: Vec3, b: Vec3, t: number): Vec3 {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
}

export function distance(a: Vec3, b: Vec3) {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])
}

// 두 시점 사이를 t(0~1)로 보간한다. 가속·감속 곡선을 적용한 값이다.
export function interpolatePose(from: CameraPose, to: CameraPose, t: number): CameraPose {
  const k = easeInOutCubic(t)
  return { position: lerp3(from.position, to.position, k), target: lerp3(from.target, to.target, k) }
}

// 이동 거리에 따라 전환 시간을 정한다. 가까우면 짧게, 멀면 길게, 단 상한이 있다.
export function transitionSeconds(from: CameraPose, to: CameraPose, reducedMotion: boolean) {
  if (reducedMotion) return 0
  const d = Math.max(distance(from.position, to.position), distance(from.target, to.target))
  return clamp(0.55 + d * 0.35, 0.55, 1.3)
}

// 세로로 긴 화면은 가로 시야가 좁아 사물이 잘린다. 화면비에 맞춰 사물에서 더 물러선다.
// 물러선 자리도 방 안 상자를 넘지 않는다.
export function fitPoseToAspect(pose: CameraPose, aspect: number, bounds: { min: Vec3; max: Vec3 }): CameraPose {
  if (aspect >= 1) return pose
  const k = Math.min(2, 1 / aspect)
  const [px, py, pz] = pose.position
  const [tx, ty, tz] = pose.target
  const pulled: Vec3 = [tx + (px - tx) * k, ty + (py - ty) * k, tz + (pz - tz) * k]
  return { position: clampToBounds(pulled, bounds), target: pose.target }
}

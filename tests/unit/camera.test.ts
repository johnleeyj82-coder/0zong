import { describe, expect, it } from 'vitest'
import { clampToBounds, easeInOutCubic, fitPoseToAspect, interpolatePose, transitionSeconds } from '@/room/camera/math'
import { CAMERA_BOUNDS, HOME_POSE, ORBIT_LIMITS, dims } from '@/room/layout'
import { roomObjects } from '@/room/objects'

const inside = (p: number[], min: number[], max: number[]) => p.every((v, i) => v >= min[i] && v <= max[i])

describe('camera math', () => {
  it('방 밖 좌표를 방 안 상자로 되돌린다', () => {
    expect(clampToBounds([-5, 10, 99], CAMERA_BOUNDS)).toEqual([
      CAMERA_BOUNDS.min[0],
      CAMERA_BOUNDS.max[1],
      CAMERA_BOUNDS.max[2],
    ])
    expect(clampToBounds([1, 1.2, 1], CAMERA_BOUNDS)).toEqual([1, 1.2, 1])
  })

  it('가감속 곡선은 0에서 시작해 1에서 끝나고 단조 증가한다', () => {
    expect(easeInOutCubic(0)).toBe(0)
    expect(easeInOutCubic(1)).toBe(1)
    expect(easeInOutCubic(0.5)).toBeCloseTo(0.5)
    let prev = 0
    for (let t = 0; t <= 1; t += 0.05) {
      const v = easeInOutCubic(t)
      expect(v).toBeGreaterThanOrEqual(prev)
      prev = v
    }
  })

  it('보간 끝점은 정확히 목표 시점이다', () => {
    const to = roomObjects[0].focus
    expect(interpolatePose(HOME_POSE, to, 0)).toEqual(HOME_POSE)
    expect(interpolatePose(HOME_POSE, to, 1)).toEqual(to)
  })

  it('모션 감소 설정이면 전환 시간이 0이다', () => {
    expect(transitionSeconds(HOME_POSE, roomObjects[0].focus, true)).toBe(0)
    const s = transitionSeconds(HOME_POSE, roomObjects[0].focus, false)
    expect(s).toBeGreaterThanOrEqual(0.55)
    expect(s).toBeLessThanOrEqual(1.3)
  })
})

describe('room layout', () => {
  it('처음 시점과 모든 포커스 시점이 방 안에 있다', () => {
    const room = { min: [0, 0, 0], max: [dims.W, dims.H, dims.L] }
    expect(inside(HOME_POSE.position, CAMERA_BOUNDS.min, CAMERA_BOUNDS.max)).toBe(true)
    for (const o of roomObjects) {
      expect(inside(o.focus.position, room.min, room.max), o.objectId).toBe(true)
      expect(inside(o.hitbox.position, room.min, room.max), o.objectId).toBe(true)
    }
  })

  it('처음 시점의 거리가 Orbit 거리 제한 안에 있다', () => {
    const d = Math.hypot(...HOME_POSE.position.map((v, i) => v - HOME_POSE.target[i]))
    expect(d).toBeGreaterThanOrEqual(ORBIT_LIMITS.minDistance)
    expect(d).toBeLessThanOrEqual(ORBIT_LIMITS.maxDistance)
  })
})

describe('fitPoseToAspect', () => {
  const pose = roomObjects[0].focus

  it('가로 화면이면 그대로 둔다', () => {
    expect(fitPoseToAspect(pose, 1.6, CAMERA_BOUNDS)).toBe(pose)
  })

  it('세로 화면이면 더 물러서되 방 안에 머문다', () => {
    const fitted = fitPoseToAspect(pose, 375 / 812, CAMERA_BOUNDS)
    const d0 = Math.hypot(...pose.position.map((v, i) => v - pose.target[i]))
    const d1 = Math.hypot(...fitted.position.map((v, i) => v - pose.target[i]))
    expect(d1).toBeGreaterThan(d0)
    expect(inside(fitted.position, CAMERA_BOUNDS.min, CAMERA_BOUNDS.max)).toBe(true)
    expect(fitted.target).toEqual(pose.target)
  })
})

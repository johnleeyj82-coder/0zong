'use client'

import { OrbitControls } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useEffectEvent, useRef } from 'react'
import { MathUtils, type PerspectiveCamera } from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { clampToBounds, fitPoseToAspect, interpolatePose, transitionSeconds } from '../camera/math'
import type { RoomState } from '../interaction/machine'
import { CAMERA_BOUNDS, HOME_POSE, ORBIT_LIMITS, type CameraPose, type Vec3 } from '../layout'
import { findObject } from '../objects'
import type { PanelCover } from '../ui/environment'

type Props = {
  state: RoomState
  reducedMotion: boolean
  // 패널이 화면을 가리는 비율(0~1). 그만큼 장면을 왼쪽(x) 또는 위(y)로 민다.
  panelCover: PanelCover
  // 값이 바뀔 때마다 "방 전체 보기" 시점으로 돌아간다.
  homeRequest: number
  onArrived: () => void
  onReturned: () => void
}

type Flight = { from: CameraPose; to: CameraPose; t: number; duration: number; done: () => void }

export function CameraDirector({ state, reducedMotion, panelCover, homeRequest, onArrived, onReturned }: Props) {
  const camera = useThree((s) => s.camera) as PerspectiveCamera
  const size = useThree((s) => s.size)
  const controls = useRef<OrbitControlsImpl>(null)
  const flight = useRef<Flight | null>(null)
  // 사물로 다가가기 직전의 시점. 돌아갈 때 이 자리로 간다.
  const saved = useRef<CameraPose | null>(null)
  const shift = useRef({ x: 0, y: 0 })

  const currentPose = (): CameraPose => ({
    position: camera.position.toArray() as Vec3,
    target: (controls.current?.target.toArray() as Vec3) ?? HOME_POSE.target,
  })

  const fly = (to: CameraPose, done: () => void) => {
    const from = currentPose()
    flight.current = { from, to, t: 0, duration: transitionSeconds(from, to, reducedMotion), done }
  }

  // 상태가 바뀌면 카메라 비행을 시작한다.
  const startFlight = useEffectEvent(() => {
    if (state.mode === 'focusing') {
      const target = findObject(state.objectId)
      if (!target) return
      if (!saved.current) saved.current = currentPose()
      fly(fitPoseToAspect(target.focus, size.width / size.height, CAMERA_BOUNDS), onArrived)
    } else if (state.mode === 'returning') {
      const back = saved.current ?? HOME_POSE
      saved.current = null
      fly(back, onReturned)
    }
  })
  const objectId = state.mode === 'focusing' || state.mode === 'content' ? state.objectId : null
  useEffect(() => startFlight(), [state.mode, objectId])

  const goHome = useEffectEvent(() => {
    if (state.mode === 'explore') fly(HOME_POSE, () => {})
  })
  useEffect(() => {
    if (homeRequest > 0) goHome()
  }, [homeRequest])

  useFrame((_, delta) => {
    const c = controls.current
    if (!c) return
    const f = flight.current
    if (f) {
      f.t = f.duration === 0 ? 1 : Math.min(1, f.t + delta / f.duration)
      const p = interpolatePose(f.from, f.to, f.t)
      camera.position.set(...p.position)
      c.target.set(...p.target)
      camera.lookAt(c.target)
      if (f.t >= 1) {
        flight.current = null
        // 비행 중 쌓인 관성이 도착 후 튀지 않도록 지운다.
        c.update()
        f.done()
      }
    } else if (state.mode === 'explore') {
      // 벽 관통 방지: OrbitControls가 움직인 뒤 방 안 상자로 되돌린다.
      const p = clampToBounds(camera.position.toArray() as Vec3, CAMERA_BOUNDS)
      camera.position.set(...p)
    }

    // 패널이 열려 있으면 장면 중심을 패널 반대쪽으로 밀어 사물이 가리지 않게 한다.
    const open = state.mode === 'content' || state.mode === 'focusing'
    const s = shift.current
    for (const axis of ['x', 'y'] as const) {
      const want = open ? panelCover[axis] : 0
      s[axis] = reducedMotion ? want : MathUtils.damp(s[axis], want, 6, delta)
    }
    if (Math.abs(s.x) < 0.001 && Math.abs(s.y) < 0.001) {
      if (camera.view?.enabled) camera.clearViewOffset()
    } else {
      const ox = (s.x * size.width) / 2
      const oy = (s.y * size.height) / 2
      camera.setViewOffset(size.width, size.height, ox, oy, size.width, size.height)
    }
  })

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      target={HOME_POSE.target}
      enabled={state.mode === 'explore'}
      enablePan={false}
      enableDamping
      dampingFactor={ORBIT_LIMITS.dampingFactor}
      rotateSpeed={ORBIT_LIMITS.rotateSpeed}
      zoomSpeed={ORBIT_LIMITS.zoomSpeed}
      minDistance={ORBIT_LIMITS.minDistance}
      maxDistance={ORBIT_LIMITS.maxDistance}
      minPolarAngle={ORBIT_LIMITS.minPolarAngle}
      maxPolarAngle={ORBIT_LIMITS.maxPolarAngle}
    />
  )
}

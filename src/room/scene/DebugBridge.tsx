'use client'

import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { Vector3 } from 'three'
import type { RoomState } from '../interaction/machine'
import { findObject } from '../objects'

// 브라우저 테스트와 성능 측정을 위한 읽기 전용 창구.
// window.__room 으로 노출한다. 비밀값이나 사용자 데이터는 담지 않는다.

export type RoomDebug = {
  ready: boolean
  state: RoomState
  // 사물 히트박스 중심이 화면 어디에 있는지(CSS px). 화면 밖이면 null.
  project: (objectId: string) => { x: number; y: number } | null
  camera: () => { position: number[]; fov: number }
  renderInfo: () => { calls: number; triangles: number; textures: number; geometries: number }
  // ms 동안 프레임 수를 세서 평균 FPS를 돌려준다.
  sampleFps: (ms: number) => Promise<number>
}

declare global {
  interface Window {
    __room?: RoomDebug
  }
}

export function DebugBridge({ state }: { state: RoomState }) {
  const { camera, gl } = useThree()
  const frames = useRef(0)
  const stateRef = useRef(state)
  useEffect(() => {
    stateRef.current = state
  }, [state])

  useFrame(() => {
    frames.current++
  })

  useEffect(() => {
    const api: RoomDebug = {
      ready: true,
      get state() {
        return stateRef.current
      },
      project(objectId) {
        const o = findObject(objectId)
        if (!o) return null
        const v = new Vector3(...o.hitbox.position).project(camera)
        if (v.z > 1 || Math.abs(v.x) > 1 || Math.abs(v.y) > 1) return null
        const r = gl.domElement.getBoundingClientRect()
        return { x: r.left + ((v.x + 1) / 2) * r.width, y: r.top + ((1 - v.y) / 2) * r.height }
      },
      camera: () => ({ position: camera.position.toArray(), fov: 'fov' in camera ? (camera.fov as number) : 0 }),
      renderInfo: () => ({
        calls: gl.info.render.calls,
        triangles: gl.info.render.triangles,
        textures: gl.info.memory.textures,
        geometries: gl.info.memory.geometries,
      }),
      sampleFps: (ms) =>
        new Promise((resolve) => {
          const start = frames.current
          const t0 = performance.now()
          setTimeout(() => resolve(((frames.current - start) * 1000) / (performance.now() - t0)), ms)
        }),
    }
    window.__room = api
    return () => {
      if (window.__room === api) delete window.__room
    }
  }, [camera, gl])

  return null
}

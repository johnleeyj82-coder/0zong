'use client'

import { useMemo } from 'react'
import { Object3D } from 'three'
import { dims } from '../layout'

// 낮 시간 한 가지 프리셋. 시간대별 조명은 PHASE 2에서 다룬다.
const { W, L, H } = dims

export function Lights({ shadows }: { shadows: boolean }) {
  // 햇빛이 방 가운데를 향하도록 대상 물체를 장면에 함께 둔다.
  const sunTarget = useMemo(() => {
    const o = new Object3D()
    o.position.set(W / 2, 0, L / 2)
    return o
  }, [])
  return (
    <>
      <primitive object={sunTarget} />
      <hemisphereLight args={['#f4f1ea', '#b9ab97', 0.9]} />
      {/* 창문(z=0) 쪽에서 들어오는 햇빛 */}
      <directionalLight
        position={[W * 0.6, H * 1.6, -2.2]}
        color="#fff3de"
        intensity={1.6}
        castShadow={shadows}
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
        shadow-camera-left={-2.5}
        shadow-camera-right={2.5}
        shadow-camera-top={2.5}
        shadow-camera-bottom={-2.5}
        shadow-camera-near={0.5}
        shadow-camera-far={9}
        target={sunTarget}
      />
      {/* 천장 조명 */}
      <pointLight position={[W / 2, H - 0.12, L / 2]} color="#fff6e8" intensity={1.2} distance={6} decay={2} />
    </>
  )
}

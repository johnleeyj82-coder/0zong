'use client'

import { Canvas } from '@react-three/fiber'
import { Suspense, useCallback, useEffect, useReducer, useState } from 'react'
import { ACESFilmicToneMapping } from 'three'
import { activeObjectId, canOrbit, initialRoomState, roomReducer } from './interaction/machine'
import { HOME_POSE } from './layout'
import { findObject } from './objects'
import { CameraDirector } from './scene/CameraDirector'
import { DebugBridge } from './scene/DebugBridge'
import { InteractiveObjects } from './scene/InteractiveObjects'
import { Lights } from './scene/Lights'
import { TempRoom } from './scene/TempRoom'
import { ContentPanel } from './ui/ContentPanel'
import { FallbackRoom } from './ui/FallbackRoom'
import { Hud } from './ui/Hud'
import { LoadingOverlay } from './ui/LoadingOverlay'
import { useHashSelection } from './ui/useHashSelection'
import { usePanelCover, useReducedMotion, useWebGLSupport } from './ui/environment'

export default function RoomExperience() {
  const [state, dispatch] = useReducer(roomReducer, initialRoomState)
  const [rawHoveredId, setHoveredId] = useState<string | null>(null)
  const [homeRequest, setHomeRequest] = useState(0)
  const webgl = useWebGLSupport()
  const reducedMotion = useReducedMotion()
  const panelCover = usePanelCover()

  const activeId = activeObjectId(state)
  // 선택 중에는 호버 표시를 지운다.
  const hoveredId = canOrbit(state) ? rawHoveredId : null
  const select = useCallback((objectId: string) => {
    if (findObject(objectId)) dispatch({ type: 'select', objectId })
  }, [])
  const close = useCallback(() => dispatch({ type: 'close' }), [])
  const onArrived = useCallback(() => dispatch({ type: 'arrived' }), [])
  const onReturned = useCallback(() => dispatch({ type: 'returned' }), [])

  useHashSelection(state, select, close)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dispatch({ type: 'close' })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // 사물 위에 있으면 손가락 커서
  useEffect(() => {
    document.body.style.cursor = hoveredId ? 'pointer' : ''
  }, [hoveredId])

  if (webgl === 'unknown') return <LoadingOverlay forced />

  if (webgl === 'unsupported') {
    return (
      <FallbackRoom state={state} onSelect={select} onClose={close} onArrived={onArrived} onReturned={onReturned} />
    )
  }

  return (
    <main className="room" data-mode={state.mode}>
      <Canvas
        className="room-canvas"
        shadows
        dpr={[1, 1.75]}
        gl={{ antialias: true, toneMapping: ACESFilmicToneMapping }}
        camera={{ fov: 62, near: 0.02, far: 30, position: HOME_POSE.position }}
        aria-label="0zong의 방 3D 장면. 아래 사물 바로가기 버튼으로도 들어갈 수 있어요."
      >
        <color attach="background" args={['#1b1a18']} />
        <Lights shadows />
        <Suspense fallback={null}>
          <TempRoom litScreens={new Set([hoveredId, activeId].filter((v): v is string => !!v))} />
        </Suspense>
        <InteractiveObjects
          enabled={canOrbit(state)}
          hoveredId={hoveredId}
          activeId={activeId}
          onHover={setHoveredId}
          onSelect={select}
        />
        <CameraDirector
          state={state}
          reducedMotion={reducedMotion}
          panelCover={panelCover}
          homeRequest={homeRequest}
          onArrived={onArrived}
          onReturned={onReturned}
        />
        <DebugBridge state={state} />
      </Canvas>

      <LoadingOverlay />
      <Hud state={state} onSelect={select} onHome={() => setHomeRequest((n) => n + 1)} />
      <ContentPanel state={state} onClose={close} />
    </main>
  )
}

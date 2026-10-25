import { useEffect, useRef } from 'react'
import type { DirectionalLight } from 'three'
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js'
import { dims } from './config'
import type { Mood } from './timeOfDay'

const { W, L, H } = dims

RectAreaLightUniformsLib.init()

// 창문으로 들어오는 햇빛 + 하늘빛 + 천장 조명.
export function Lights({ mood, lampOn }: { mood: Mood; lampOn: boolean }) {
  const sun = useRef<DirectionalLight>(null)

  // 해는 창문 바깥(z<0)에서 시간에 따라 동쪽(x<0)에서 서쪽(x>W)으로 지나간다.
  const t = Math.min(1, Math.max(0, (mood.hour - 6) / 13))
  const sunX = W / 2 + (t - 0.5) * 8
  const sunY = 1.2 + Math.sin(t * Math.PI) * 4

  useEffect(() => {
    if (sun.current) sun.current.target.position.set(W / 2, 0, L * 0.6)
    sun.current?.target.updateMatrixWorld()
  }, [])

  return (
    <>
      <hemisphereLight args={[mood.sky, '#8a7f72', mood.ambient * 0.9]} />
      <directionalLight
        ref={sun}
        position={[sunX, sunY, -4]}
        color={mood.sun}
        intensity={mood.sunIntensity * 2.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={4}
        shadow-camera-bottom={-4}
      />
      {/* 커튼을 통과한 부드러운 창빛 */}
      <rectAreaLight
        args={[mood.sun, mood.sunIntensity * 3, W, H * 0.8]}
        position={[W / 2, H * 0.5, 0.1]}
        rotation={[0, Math.PI, 0]}
      />
      {lampOn && (
        <pointLight position={[W / 2, H - 0.15, L / 2]} color="#ffd9a8" intensity={6} distance={7} decay={1.6} castShadow />
      )}
    </>
  )
}

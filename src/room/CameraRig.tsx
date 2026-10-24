import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { MathUtils, Vector3 } from 'three'
import { room, type Hotspot } from './config'

// 의자 자리에 고정된 카메라. 드래그로 고개를 360도 돌리고,
// 물체가 선택되면 그 물체 앞으로 부드럽게 다가간다.
export function CameraRig({ focused, dragged }: { focused: Hotspot | null; dragged: React.RefObject<boolean> }) {
  const { camera, gl } = useThree()
  const look = useRef({ yaw: 0, pitch: 0 })
  const eye = useRef(new Vector3(...room.eye))
  const target = useRef(new Vector3())

  useEffect(() => {
    const el = gl.domElement
    let down: { x: number; y: number } | null = null
    let moved = 0
    const onDown = (e: PointerEvent) => {
      down = { x: e.clientX, y: e.clientY }
      moved = 0
      dragged.current = false
    }
    const onMove = (e: PointerEvent) => {
      if (!down || focused) return
      const dx = e.clientX - down.x
      const dy = e.clientY - down.y
      down = { x: e.clientX, y: e.clientY }
      moved += Math.abs(dx) + Math.abs(dy)
      if (moved > 6) dragged.current = true
      const speed = 0.0035
      look.current.yaw -= dx * speed
      const limit = MathUtils.degToRad(room.pitchLimit)
      look.current.pitch = MathUtils.clamp(look.current.pitch - dy * speed, -limit, limit)
    }
    const onUp = () => {
      down = null
    }
    el.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      el.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [gl, focused, dragged])

  useFrame((_, delta) => {
    const k = 1 - Math.exp(-delta * 6)
    if (focused) {
      eye.current.lerp(new Vector3(...focused.focus.position), k)
      target.current.lerp(new Vector3(...focused.focus.lookAt), k)
    } else {
      const { yaw, pitch } = look.current
      const home = new Vector3(...room.eye)
      const dir = new Vector3(Math.sin(yaw) * Math.cos(pitch), -Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch))
      eye.current.lerp(home, k)
      target.current.lerp(home.clone().add(dir), Math.min(1, k * 3))
    }
    camera.position.copy(eye.current)
    camera.lookAt(target.current)
  })

  return null
}

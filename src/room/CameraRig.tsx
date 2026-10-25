import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { MathUtils, type PerspectiveCamera, Vector3 } from 'three'
import { direction, room, type Hotspot } from './config'

// 의자 자리(원점)에 고정된 카메라. 드래그로 고개를 360도 돌리고, 휠로 확대한다.
// 물체가 선택되면 그쪽으로 고개를 돌리고 물체가 화면을 채우도록 확대한다.
export function CameraRig({ focused, dragged }: { focused: Hotspot | null; dragged: React.RefObject<boolean> }) {
  const { camera, gl } = useThree()
  const look = useRef({ yaw: room.startYaw, pitch: room.startPitch, fov: room.fov.start })
  const view = useRef({ yaw: room.startYaw, pitch: room.startPitch, fov: room.fov.start })

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
      // 화면을 잡고 끄는 느낌. 확대했을수록 천천히 돈다.
      const degPerPx = look.current.fov / el.clientHeight
      look.current.yaw -= dx * degPerPx
      look.current.pitch = MathUtils.clamp(look.current.pitch + dy * degPerPx, -room.pitchLimit, room.pitchLimit)
    }
    const onUp = () => {
      down = null
    }
    const onWheel = (e: WheelEvent) => {
      if (focused) return
      e.preventDefault()
      look.current.fov = MathUtils.clamp(look.current.fov * Math.exp(e.deltaY * 0.001), room.fov.min, room.fov.max)
    }
    el.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      el.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      el.removeEventListener('wheel', onWheel)
    }
  }, [gl, focused, dragged])

  useFrame((_, delta) => {
    const cam = camera as PerspectiveCamera
    const k = 1 - Math.exp(-delta * 8)
    let goal = look.current
    if (focused) {
      // 패널이 오른쪽을 가리므로 물체를 화면 왼쪽으로 조금 비켜 둔다.
      const fov = MathUtils.clamp(Math.max(focused.height, focused.width / cam.aspect) * 2.4, 30, 75)
      goal = { yaw: focused.yaw + fov * cam.aspect * 0.18, pitch: focused.pitch, fov }
    }
    const v = view.current
    // yaw는 한 바퀴 돌아도 가까운 쪽으로 돈다.
    const dyaw = ((((goal.yaw - v.yaw) % 360) + 540) % 360) - 180
    v.yaw += dyaw * k
    v.pitch += (goal.pitch - v.pitch) * k
    v.fov += (goal.fov - v.fov) * k
    cam.position.set(0, 0, 0)
    cam.lookAt(new Vector3(...direction(v.yaw, v.pitch)))
    // 세로로 긴 휴대폰 화면에서는 좌우가 너무 좁아지지 않게 세로 화각을 넓힌다.
    const minFov = (2 * Math.atan(Math.tan((room.minHorizontalFov * Math.PI) / 360) / cam.aspect) * 180) / Math.PI
    const fov = Math.min(100, Math.max(v.fov, focused ? 0 : minFov))
    if (Math.abs(cam.fov - fov) > 0.01) {
      cam.fov = fov
      cam.updateProjectionMatrix()
    }
  })

  return null
}

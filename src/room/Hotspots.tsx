import { Html, Line } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef, useState } from 'react'
import { type Group, type Mesh, Vector3 } from 'three'
import { direction, hotspots, type Hotspot } from './config'

// 사진 속 물건 자리마다 보이지 않는 판을 두고, 마우스가 닿으면 테두리와 이름표를 띄운다.
// 판은 카메라에서 같은 거리(R)에 놓여 항상 카메라를 바라본다.
// 테두리는 판 모양 대신 yaw / pitch 선을 따라 그려서, 화면 가장자리에서도 비뚤어지지 않는다.
const R = 10

export function Hotspots({
  showBoxes,
  focused,
  onSelect,
  dragged,
}: {
  showBoxes: boolean
  focused: Hotspot | null
  onSelect: (h: Hotspot) => void
  dragged: React.RefObject<boolean>
}) {
  return (
    <>
      {hotspots.map((h, i) => (
        <HotspotPlane
          key={h.id}
          hotspot={h}
          // 겹치는 판이 깜빡이지 않게 작은 물건일수록 조금 더 앞에 둔다.
          radius={R - 0.5 + (h.width * h.height) / 4000 + i * 0.001}
          showBox={showBoxes}
          active={focused?.id === h.id}
          disabled={focused !== null}
          onSelect={onSelect}
          dragged={dragged}
        />
      ))}
    </>
  )
}

function HotspotPlane({
  hotspot,
  radius,
  showBox,
  active,
  disabled,
  onSelect,
  dragged,
}: {
  hotspot: Hotspot
  radius: number
  showBox: boolean
  active: boolean
  disabled: boolean
  onSelect: (h: Hotspot) => void
  dragged: React.RefObject<boolean>
}) {
  const ref = useRef<Mesh>(null)
  const outline = useRef<Group>(null)
  const [hover, setHover] = useState(false)
  const lit = (hover && !disabled) || active

  const { position, size } = useMemo(() => {
    const position = new Vector3(...direction(hotspot.yaw, hotspot.pitch)).multiplyScalar(radius)
    const tan = (deg: number) => Math.tan(((deg / 2) * Math.PI) / 180)
    return { position, size: [2 * radius * tan(hotspot.width), 2 * radius * tan(hotspot.height)] as const }
  }, [hotspot, radius])

  const border = useMemo(() => {
    const { yaw, pitch, width, height } = hotspot
    const corners = [
      [yaw - width / 2, pitch + height / 2],
      [yaw + width / 2, pitch + height / 2],
      [yaw + width / 2, pitch - height / 2],
      [yaw - width / 2, pitch - height / 2],
    ]
    const pts: [number, number, number][] = []
    for (let c = 0; c < 4; c++) {
      const [y0, p0] = corners[c]
      const [y1, p1] = corners[(c + 1) % 4]
      for (let i = 0; i < 16; i++) {
        const t = i / 16
        const d = direction(y0 + (y1 - y0) * t, p0 + (p1 - p0) * t)
        pts.push([d[0] * radius, d[1] * radius, d[2] * radius])
      }
    }
    pts.push(pts[0])
    return pts
  }, [hotspot, radius])

  useFrame((_, delta) => {
    const m = ref.current
    if (!m) return
    m.lookAt(0, 0, 0)
    const s = lit ? 1.05 : 1
    m.scale.setScalar(m.scale.x + (s - m.scale.x) * (1 - Math.exp(-delta * 12)))
    // 테두리는 방향은 그대로 두고 물건 가운데를 기준으로 살짝 커진다.
    const g = outline.current
    if (g) {
      g.position.copy(position).multiplyScalar(1 - m.scale.x)
      g.scale.setScalar(m.scale.x)
    }
  })

  return (
    <>
      {(lit || showBox) && (
        <group ref={outline}>
          <Line
            points={border}
            color={lit ? '#ffd27a' : '#7ad1ff'}
            lineWidth={lit ? 2.5 : 1}
            transparent
            opacity={0.95}
            depthTest={false}
          />
        </group>
      )}
      <mesh
        ref={ref}
        position={position}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHover(true)
          document.body.style.cursor = disabled ? 'default' : 'pointer'
        }}
        onPointerOut={() => {
          setHover(false)
          document.body.style.cursor = 'default'
        }}
        onClick={(e) => {
          e.stopPropagation()
          if (disabled || dragged.current) return
          onSelect(hotspot)
        }}
      >
        <planeGeometry args={[size[0], size[1]]} />
        <meshBasicMaterial color="#ffd27a" transparent opacity={0} depthWrite={false} />
        {lit && !active && (
          <Html center position={[0, size[1] / 2 + 0.25, 0]} style={{ pointerEvents: 'none' }}>
            <div className="tag">
              <strong>{hotspot.label}</strong>
              <span>{hotspot.description}</span>
            </div>
          </Html>
        )}
      </mesh>
    </>
  )
}

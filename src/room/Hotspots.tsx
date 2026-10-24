import { Edges, Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef, useState } from 'react'
import type { Mesh } from 'three'
import { hotspots, type Hotspot } from './config'

// 물체마다 보이지 않는 히트박스를 두고, 마우스가 닿으면 테두리와 이름표를 띄운다.
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
      {hotspots.map((h) => (
        <HotspotBox
          key={h.id}
          hotspot={h}
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

function HotspotBox({
  hotspot,
  showBox,
  active,
  disabled,
  onSelect,
  dragged,
}: {
  hotspot: Hotspot
  showBox: boolean
  active: boolean
  disabled: boolean
  onSelect: (h: Hotspot) => void
  dragged: React.RefObject<boolean>
}) {
  const ref = useRef<Mesh>(null)
  const [hover, setHover] = useState(false)
  const lit = (hover && !disabled) || active

  useFrame((_, delta) => {
    const s = lit ? 1.06 : 1
    const m = ref.current
    if (m) m.scale.setScalar(m.scale.x + (s - m.scale.x) * (1 - Math.exp(-delta * 12)))
  })

  return (
    <mesh
      ref={ref}
      position={hotspot.position}
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
      <boxGeometry args={hotspot.size} />
      <meshBasicMaterial color="#ffd27a" transparent opacity={lit ? 0.12 : showBox ? 0.18 : 0} depthWrite={false} />
      {(lit || showBox) && (
        <Edges scale={1.02} color={lit ? '#ffd27a' : '#7ad1ff'} lineWidth={lit ? 2.5 : 1} />
      )}
      {lit && !active && (
        <Html center position={[0, hotspot.size[1] / 2 + 0.08, 0]} style={{ pointerEvents: 'none' }}>
          <div className="tag">
            <strong>{hotspot.label}</strong>
            <span>{hotspot.description}</span>
          </div>
        </Html>
      )}
    </mesh>
  )
}

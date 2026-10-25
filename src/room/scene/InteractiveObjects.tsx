'use client'

import { Edges, Html } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import { publicObjects, type RoomObject } from '../objects'

// 사물 선택 영역. 보이지 않는 상자로 레이캐스트를 받고,
// 호버하면 테두리와 이름표를 보여 준다.

// 이만큼(px) 넘게 끌었으면 클릭이 아니라 시점 회전으로 본다.
const DRAG_TOLERANCE = 6

type Props = {
  enabled: boolean
  hoveredId: string | null
  activeId: string | null
  onHover: (id: string | null) => void
  onSelect: (id: string) => void
}

export function InteractiveObjects({ enabled, hoveredId, activeId, onHover, onSelect }: Props) {
  return (
    <group name="interactive-objects">
      {publicObjects().map((o) => (
        <Hitbox
          key={o.objectId}
          object={o}
          enabled={enabled}
          hovered={hoveredId === o.objectId}
          active={activeId === o.objectId}
          onHover={onHover}
          onSelect={onSelect}
        />
      ))}
    </group>
  )
}

function Hitbox({
  object,
  enabled,
  hovered,
  active,
  onHover,
  onSelect,
}: {
  object: RoomObject
  enabled: boolean
  hovered: boolean
  active: boolean
  onHover: (id: string | null) => void
  onSelect: (id: string) => void
}) {
  const over = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    if (enabled) onHover(object.objectId)
  }
  const out = () => onHover(null)
  const click = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    if (!enabled || e.delta > DRAG_TOLERANCE) return
    onSelect(object.objectId)
  }
  const showOutline = (enabled && hovered) || active

  return (
    <mesh
      name={`hitbox:${object.objectId}`}
      position={object.hitbox.position}
      onPointerOver={over}
      onPointerOut={out}
      onClick={click}
    >
      <boxGeometry args={object.hitbox.size} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      {showOutline && (
        <Edges scale={1.04} threshold={15} color={active ? '#ffd48a' : '#ffb347'} lineWidth={2} renderOrder={10} />
      )}
      {enabled && hovered && (
        <Html center position={[0, object.hitbox.size[1] / 2 + 0.07, 0]} pointerEvents="none" zIndexRange={[20, 0]}>
          <div className="object-label" data-testid="hover-label">
            <strong>{object.label}</strong>
            <span>{object.hint}</span>
          </div>
        </Html>
      )}
    </mesh>
  )
}

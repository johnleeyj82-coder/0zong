'use client'

import { useEffect } from 'react'
import { getModule } from '@/modules/registry'
import type { RoomState } from '../interaction/machine'
import { publicObjects } from '../objects'
import { ContentPanel } from './ContentPanel'

// WebGL을 쓸 수 없을 때 보여 주는 목록형 방. 같은 상태 기계와 패널을 쓴다.
export function FallbackRoom({
  state,
  onSelect,
  onClose,
  onArrived,
  onReturned,
}: {
  state: RoomState
  onSelect: (id: string) => void
  onClose: () => void
  onArrived: () => void
  onReturned: () => void
}) {
  // 카메라 비행이 없으니 바로 도착/복귀 처리한다.
  useEffect(() => {
    if (state.mode === 'focusing') onArrived()
    if (state.mode === 'returning') onReturned()
  }, [state, onArrived, onReturned])

  return (
    <main className="fallback" data-mode={state.mode} data-testid="fallback">
      <header>
        <h1>0zong ROOM</h1>
        <p>이 브라우저에서는 3D 방을 띄울 수 없어서 목록으로 보여 드려요.</p>
      </header>
      <ul>
        {publicObjects().map((o) => {
          const mod = getModule(o.moduleId)
          return (
            <li key={o.objectId}>
              <button type="button" onClick={() => onSelect(o.objectId)} data-object={o.objectId}>
                <strong>{o.label}</strong>
                <span>{mod.title}</span>
              </button>
            </li>
          )
        })}
      </ul>
      <ContentPanel state={state} onClose={onClose} />
    </main>
  )
}

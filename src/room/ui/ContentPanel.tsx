'use client'

import { useEffect, useRef } from 'react'
import { getModule } from '@/modules/registry'
import type { RoomState } from '../interaction/machine'
import { findObject } from '../objects'

// 사물에 도착하면 열리는 콘텐츠 패널. 카메라가 도착한 뒤(content)에만 연다.
export function ContentPanel({ state, onClose }: { state: RoomState; onClose: () => void }) {
  const back = useRef<HTMLButtonElement>(null)
  const object = state.mode === 'content' ? findObject(state.objectId) : undefined

  useEffect(() => {
    if (object) back.current?.focus({ preventScroll: true })
  }, [object])

  if (!object) return null
  const mod = getModule(object.moduleId)

  return (
    <section
      className="panel"
      role="dialog"
      aria-modal="false"
      aria-labelledby="panel-title"
      data-module={mod.moduleId}
      data-testid="content-panel"
    >
      <button ref={back} type="button" className="back" onClick={onClose}>
        ← 방으로 돌아가기 <kbd>ESC</kbd>
      </button>
      <p className="eyebrow">{object.label}</p>
      <h1 id="panel-title">{mod.title}</h1>
      <p className="subtitle">{mod.subtitle}</p>
      {mod.status === 'placeholder' && <p className="status">임시 화면 · PHASE 3에서 실제 기록과 연결</p>}
      <mod.Body />
    </section>
  )
}

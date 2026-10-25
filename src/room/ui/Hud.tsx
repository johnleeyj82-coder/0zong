'use client'

import type { RoomState } from '../interaction/machine'
import { publicObjects } from '../objects'

const hints: Record<RoomState['mode'], string> = {
  explore: '드래그해서 둘러보고, 휠로 확대해요. 빛나는 사물을 눌러 보세요.',
  focusing: '다가가는 중…',
  content: 'ESC 또는 돌아가기로 방에 돌아와요.',
  returning: '방으로 돌아가는 중…',
}

export function Hud({ state, onSelect, onHome }: { state: RoomState; onSelect: (id: string) => void; onHome: () => void }) {
  const exploring = state.mode === 'explore'
  return (
    <>
      <header className="hud top">
        <span className="brand">0zong ROOM</span>
        <span className="badge" title="실제 방 복원 전 임시 방이에요">임시 방 · 실사 복원 전</span>
        <span className="hint" aria-live="polite">
          {hints[state.mode]}
        </span>
      </header>
      <nav className="hud bottom" aria-label="사물 바로가기">
        {publicObjects().map((o) => (
          <button key={o.objectId} type="button" onClick={() => onSelect(o.objectId)} data-object={o.objectId}>
            {o.label}
          </button>
        ))}
        <button type="button" className="ghost" onClick={onHome} disabled={!exploring}>
          방 전체 보기
        </button>
      </nav>
    </>
  )
}

'use client'

import { useEffect, useRef } from 'react'
import { activeObjectId, type RoomState } from '../interaction/machine'

// 열린 사물을 주소 #뒤에 적어 둔다. 새로고침하거나 링크를 공유해도 같은 사물로 들어간다.
// 브라우저 뒤로 가기로 # 가 바뀌면 그에 맞춰 열거나 닫는다.

function readHash() {
  const id = decodeURIComponent(window.location.hash.replace(/^#/, ''))
  return id || null
}

export function useHashSelection(state: RoomState, select: (id: string) => void, close: () => void) {
  const restored = useRef(false)

  useEffect(() => {
    if (restored.current) return
    restored.current = true
    const id = readHash()
    if (id) select(id)
  }, [select])

  const active = activeObjectId(state)
  useEffect(() => {
    if (!restored.current) return
    const want = active ? `#${encodeURIComponent(active)}` : ''
    if (window.location.hash === want) return
    const url = window.location.pathname + window.location.search + want
    window.history.replaceState(null, '', url)
  }, [active])

  useEffect(() => {
    const onHash = () => {
      const id = readHash()
      if (id) select(id)
      else close()
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [select, close])
}

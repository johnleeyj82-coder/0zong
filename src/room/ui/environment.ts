'use client'

import { useState, useSyncExternalStore } from 'react'

export type WebGLSupport = 'unknown' | 'supported' | 'unsupported'

function detectWebGL(): boolean {
  // ?nowebgl=1 로 대체 화면을 강제로 확인할 수 있다.
  if (new URLSearchParams(window.location.search).has('nowebgl')) return false
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

// 이 훅은 브라우저에서만 그려지는 컴포넌트(ssr: false)에서 쓴다.
export function useWebGLSupport(): WebGLSupport {
  const [support] = useState<WebGLSupport>(() =>
    typeof window === 'undefined' ? 'unknown' : detectWebGL() ? 'supported' : 'unsupported',
  )
  return support
}

function useMedia(query: string): boolean {
  return useSyncExternalStore(
    (notify) => {
      const m = window.matchMedia(query)
      m.addEventListener('change', notify)
      return () => m.removeEventListener('change', notify)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}

function subscribeResize(notify: () => void) {
  window.addEventListener('resize', notify)
  return () => window.removeEventListener('resize', notify)
}

export function useReducedMotion() {
  return useMedia('(prefers-reduced-motion: reduce)')
}

// 콘텐츠 패널이 화면을 가리는 비율. globals.css의 .panel 크기와 맞춘다.
// 넓은 화면은 오른쪽 패널(x), 좁은 화면은 아래 시트(y).
export const PANEL_WIDTH_PX = 460
export const SHEET_HEIGHT_RATIO = 0.62
export const WIDE_QUERY = '(min-width: 900px)'

export type PanelCover = { x: number; y: number }

export function usePanelCover(): PanelCover {
  const wide = useMedia(WIDE_QUERY)
  const width = useSyncExternalStore(subscribeResize, () => window.innerWidth, () => 1)
  return wide ? { x: Math.min(PANEL_WIDTH_PX, width * 0.42) / width, y: 0 } : { x: 0, y: SHEET_HEIGHT_RATIO }
}

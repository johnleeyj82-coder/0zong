'use client'

import { useProgress } from '@react-three/drei'

// 질감을 다 받기 전에 빈 화면이 보이지 않게 덮는다.
export function LoadingOverlay({ forced = false }: { forced?: boolean }) {
  const { active, progress } = useProgress()
  const show = forced || active || progress < 100
  if (!show) return null
  return (
    <div className="loading" role="status" data-testid="loading">
      <span>방 불러오는 중{forced ? '' : ` ${Math.round(progress)}%`}</span>
    </div>
  )
}

import type { ComponentType } from 'react'

export type ModuleId = 'game-archive' | 'security-lab' | 'cinema-archive'

// 사물을 선택했을 때 어떤 방식으로 콘텐츠에 들어가는지.
// PHASE 1은 카메라 포커싱 후 패널을 여는 방식 하나만 쓴다.
export type EntryEffect = 'monitor-zoom' | 'poster-zoom'

export type ModuleStatus = 'placeholder' | 'live'

export type ModuleDefinition = {
  moduleId: ModuleId
  title: string
  subtitle: string
  entry: EntryEffect
  // 누가 볼 수 있는지. 실제 접근 제어는 PHASE 3에서 서버가 판정한다.
  permission: 'public' | 'admin'
  status: ModuleStatus
  // 패널 안에 들어갈 본문
  Body: ComponentType
}

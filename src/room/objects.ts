import type { ModuleId } from '@/modules/types'
import { dims, type CameraPose, type Vec3 } from './layout'

// 방 안의 상호작용 사물 등록표.
// 새 사물은 여기에 한 줄 추가하면 히트박스, 호버, 포커싱, 콘텐츠 연결이 모두 따라온다.

export type Visibility = 'public' | 'private'

export type RoomObject = {
  objectId: string
  moduleId: ModuleId
  label: string
  hint: string
  // 선택 영역(보이지 않는 상자). 중심과 크기.
  hitbox: { position: Vec3; size: Vec3 }
  // 선택했을 때 카메라가 서는 자리
  focus: CameraPose
  visibility: Visibility
}

const { W } = dims

export const roomObjects: RoomObject[] = [
  {
    objectId: 'monitor-left',
    moduleId: 'game-archive',
    label: '왼쪽 모니터',
    hint: '게임 아카이브',
    hitbox: { position: [W - 0.33, 1.06, 1.58], size: [0.1, 0.4, 0.66] },
    focus: { position: [W - 1.3, 1.12, 1.66], target: [W - 0.33, 1.06, 1.58] },
    visibility: 'public',
  },
  {
    objectId: 'monitor-right',
    moduleId: 'security-lab',
    label: '오른쪽 모니터',
    hint: '보안 지식 연구실',
    hitbox: { position: [W - 0.33, 1.04, 2.16], size: [0.1, 0.36, 0.59] },
    focus: { position: [W - 1.25, 1.1, 2.1], target: [W - 0.33, 1.04, 2.16] },
    visibility: 'public',
  },
  {
    objectId: 'poster',
    moduleId: 'cinema-archive',
    label: '포스터',
    hint: '시네마 아카이브',
    hitbox: { position: [0.03, 1.57, 2.6], size: [0.06, 0.82, 1.62] },
    focus: { position: [1.5, 1.52, 2.6], target: [0.03, 1.55, 2.6] },
    visibility: 'public',
  },
]

export function findObject(objectId: string | null | undefined): RoomObject | undefined {
  return roomObjects.find((o) => o.objectId === objectId)
}

export function publicObjects(): RoomObject[] {
  return roomObjects.filter((o) => o.visibility === 'public')
}

// 방 상호작용 상태. 렌더러와 UI가 같은 상태를 보도록 순수 함수로 둔다.
//
// explore ──select──▶ focusing ──arrived──▶ content
//    ▲                   │ close               │ close
//    └──returned── returning ◀─────────────────┘
//
// focusing / content 중에 다른 사물을 select 하면 그 사물로 바로 다시 focusing 한다.

export type RoomState =
  | { mode: 'explore' }
  | { mode: 'focusing'; objectId: string }
  | { mode: 'content'; objectId: string }
  | { mode: 'returning' }

export type RoomEvent =
  | { type: 'select'; objectId: string }
  | { type: 'arrived' }
  | { type: 'close' }
  | { type: 'returned' }

export const initialRoomState: RoomState = { mode: 'explore' }

export function roomReducer(state: RoomState, event: RoomEvent): RoomState {
  switch (event.type) {
    case 'select':
      if (state.mode === 'content' && state.objectId === event.objectId) return state
      if (state.mode === 'focusing' && state.objectId === event.objectId) return state
      return { mode: 'focusing', objectId: event.objectId }
    case 'arrived':
      return state.mode === 'focusing' ? { mode: 'content', objectId: state.objectId } : state
    case 'close':
      return state.mode === 'focusing' || state.mode === 'content' ? { mode: 'returning' } : state
    case 'returned':
      return state.mode === 'returning' ? { mode: 'explore' } : state
  }
}

export function activeObjectId(state: RoomState): string | null {
  return state.mode === 'focusing' || state.mode === 'content' ? state.objectId : null
}

// 사용자가 직접 시점을 돌릴 수 있는 상태인지
export function canOrbit(state: RoomState): boolean {
  return state.mode === 'explore'
}

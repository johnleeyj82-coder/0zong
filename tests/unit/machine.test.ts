import { describe, expect, it } from 'vitest'
import { activeObjectId, canOrbit, initialRoomState, roomReducer, type RoomEvent, type RoomState } from '@/room/interaction/machine'

const run = (events: RoomEvent[], from: RoomState = initialRoomState) => events.reduce(roomReducer, from)

describe('roomReducer', () => {
  it('선택 → 도착 → 닫기 → 복귀 순서로 방에 돌아온다', () => {
    let s = run([{ type: 'select', objectId: 'poster' }])
    expect(s).toEqual({ mode: 'focusing', objectId: 'poster' })
    expect(canOrbit(s)).toBe(false)
    s = run([{ type: 'arrived' }], s)
    expect(s).toEqual({ mode: 'content', objectId: 'poster' })
    s = run([{ type: 'close' }], s)
    expect(s).toEqual({ mode: 'returning' })
    s = run([{ type: 'returned' }], s)
    expect(s).toEqual({ mode: 'explore' })
    expect(canOrbit(s)).toBe(true)
  })

  it('콘텐츠를 보는 중 다른 사물을 고르면 그 사물로 다시 다가간다', () => {
    const s = run([{ type: 'select', objectId: 'poster' }, { type: 'arrived' }, { type: 'select', objectId: 'monitor-left' }])
    expect(s).toEqual({ mode: 'focusing', objectId: 'monitor-left' })
  })

  it('같은 사물을 다시 고르면 상태가 그대로다', () => {
    const content = run([{ type: 'select', objectId: 'poster' }, { type: 'arrived' }])
    expect(roomReducer(content, { type: 'select', objectId: 'poster' })).toBe(content)
  })

  it('다가가는 도중 닫으면 바로 돌아간다', () => {
    expect(run([{ type: 'select', objectId: 'poster' }, { type: 'close' }])).toEqual({ mode: 'returning' })
  })

  it('맞지 않는 이벤트는 무시한다', () => {
    expect(run([{ type: 'arrived' }])).toEqual({ mode: 'explore' })
    expect(run([{ type: 'close' }])).toEqual({ mode: 'explore' })
    expect(run([{ type: 'returned' }])).toEqual({ mode: 'explore' })
    expect(run([{ type: 'select', objectId: 'poster' }, { type: 'returned' }])).toEqual({ mode: 'focusing', objectId: 'poster' })
  })

  it('activeObjectId는 다가가는 중과 보는 중에만 값이 있다', () => {
    expect(activeObjectId({ mode: 'explore' })).toBeNull()
    expect(activeObjectId({ mode: 'returning' })).toBeNull()
    expect(activeObjectId({ mode: 'focusing', objectId: 'a' })).toBe('a')
    expect(activeObjectId({ mode: 'content', objectId: 'b' })).toBe('b')
  })
})

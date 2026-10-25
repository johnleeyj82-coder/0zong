import { describe, expect, it } from 'vitest'
import { modules } from '@/modules/registry'
import { findObject, publicObjects, roomObjects } from '@/room/objects'

describe('object & module registry', () => {
  it('사물 ID는 겹치지 않는다', () => {
    const ids = roomObjects.map((o) => o.objectId)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('모든 사물은 등록된 모듈을 가리킨다', () => {
    for (const o of roomObjects) expect(modules[o.moduleId], o.objectId).toBeDefined()
  })

  it('모듈 ID와 등록 키가 같다', () => {
    for (const [key, mod] of Object.entries(modules)) expect(mod.moduleId).toBe(key)
  })

  it('PHASE 1 테스트 사물 3개가 공개되어 있다', () => {
    expect(publicObjects().map((o) => o.objectId)).toEqual(['monitor-left', 'monitor-right', 'poster'])
  })

  it('없는 사물은 찾지 못한다', () => {
    expect(findObject('nope')).toBeUndefined()
    expect(findObject(null)).toBeUndefined()
  })
})

import { describe, expect, it } from 'vitest'
import { categoryKey } from '@/lib/navigation'

describe('categoryKey', () => {
  it('для комнаты включает roomId', () => {
    expect(categoryKey({ type: 'room', roomId: 'room-1' })).toBe('room:room-1')
  })

  it('для остальных категорий возвращает просто type', () => {
    expect(categoryKey({ type: 'groups' })).toBe('groups')
    expect(categoryKey({ type: 'sensors' })).toBe('sensors')
    expect(categoryKey({ type: 'scenarios' })).toBe('scenarios')
  })
})

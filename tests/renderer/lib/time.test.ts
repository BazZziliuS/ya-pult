import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { formatRelativeTime } from '@/lib/time'

const NOW = 1_700_000_000_000

describe('formatRelativeTime', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('меньше 5 секунд назад — "только что" / "just now"', () => {
    expect(formatRelativeTime(NOW - 2_000, 'ru')).toBe('только что')
    expect(formatRelativeTime(NOW - 2_000, 'en')).toBe('just now')
  })

  it('от 5 до 59 секунд — в секундах', () => {
    expect(formatRelativeTime(NOW - 23_000, 'ru')).toBe('23 сек назад')
    expect(formatRelativeTime(NOW - 23_000, 'en')).toBe('23s ago')
  })

  it('от минуты и больше — в минутах', () => {
    expect(formatRelativeTime(NOW - 4 * 60_000, 'ru')).toBe('4 мин назад')
    expect(formatRelativeTime(NOW - 4 * 60_000, 'en')).toBe('4m ago')
  })

  it('будущий timestamp не уходит в отрицательное значение', () => {
    expect(formatRelativeTime(NOW + 10_000, 'ru')).toBe('только что')
  })
})

import { describe, expect, it } from 'vitest'
import { hexToHsv, hsvToHex } from '@/lib/color'

describe('hexToHsv', () => {
  it('чистый красный', () => {
    expect(hexToHsv(0xff0000)).toEqual({ h: 0, s: 100, v: 100 })
  })

  it('чистый зелёный', () => {
    expect(hexToHsv(0x00ff00)).toEqual({ h: 120, s: 100, v: 100 })
  })

  it('чистый синий', () => {
    expect(hexToHsv(0x0000ff)).toEqual({ h: 240, s: 100, v: 100 })
  })

  it('белый (без насыщенности)', () => {
    expect(hexToHsv(0xffffff)).toEqual({ h: 0, s: 0, v: 100 })
  })

  it('чёрный (без яркости)', () => {
    expect(hexToHsv(0x000000)).toEqual({ h: 0, s: 0, v: 0 })
  })
})

describe('hsvToHex', () => {
  it('чистый красный', () => {
    expect(hsvToHex(0, 100, 100)).toBe(0xff0000)
  })

  it('чистый зелёный', () => {
    expect(hsvToHex(120, 100, 100)).toBe(0x00ff00)
  })

  it('чистый синий', () => {
    expect(hsvToHex(240, 100, 100)).toBe(0x0000ff)
  })

  it('белый', () => {
    expect(hsvToHex(0, 0, 100)).toBe(0xffffff)
  })

  it('чёрный', () => {
    expect(hsvToHex(0, 0, 0)).toBe(0x000000)
  })
})

function channels(hex: number): [number, number, number] {
  return [(hex >> 16) & 0xff, (hex >> 8) & 0xff, hex & 0xff]
}

describe('hexToHsv / hsvToHex round-trip', () => {
  it('преобразование туда-обратно сохраняет цвет с точностью до ошибки округления HSV (±2 на канал)', () => {
    const samples = [0xff8800, 0x123456, 0xabcdef, 0x336699, 0x800080]
    for (const hex of samples) {
      const hsv = hexToHsv(hex)
      const back = hsvToHex(hsv.h, hsv.s, hsv.v)
      const original = channels(hex)
      const roundTripped = channels(back)
      for (let i = 0; i < 3; i++) {
        expect(Math.abs(original[i] - roundTripped[i])).toBeLessThanOrEqual(2)
      }
    }
  })
})

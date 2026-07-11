import { afterEach, describe, expect, it, vi } from 'vitest'
import { checkForUpdate, isNewer, parseVersion } from '../../src/main/updateCheck'

describe('parseVersion', () => {
  it('парсит версию с префиксом v и без', () => {
    expect(parseVersion('v1.2.3')).toEqual([1, 2, 3])
    expect(parseVersion('1.2.3')).toEqual([1, 2, 3])
  })

  it('нечисловые сегменты считает нулём вместо падения', () => {
    expect(parseVersion('v1.x.3')).toEqual([1, 0, 3])
  })
})

describe('isNewer', () => {
  it('сравнивает по сегментам, а не по строке ("v10" не меньше "v9")', () => {
    expect(isNewer('v10.0.0', 'v9.0.0')).toBe(true)
    expect(isNewer('v9.0.0', 'v10.0.0')).toBe(false)
  })

  it('true только когда версия строго новее', () => {
    expect(isNewer('v1.2.4', 'v1.2.3')).toBe(true)
    expect(isNewer('v1.2.3', 'v1.2.3')).toBe(false)
    expect(isNewer('v1.2.2', 'v1.2.3')).toBe(false)
  })

  it('корректно сравнивает версии разной длины', () => {
    expect(isNewer('v1.3', 'v1.2.9')).toBe(true)
    expect(isNewer('v1.2.0', 'v1.2')).toBe(false)
  })
})

describe('checkForUpdate', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('возвращает информацию о релизе, если он новее текущей версии', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ tag_name: 'v2.0.0', html_url: 'https://example.com/release' })
      })
    )

    const result = await checkForUpdate('1.0.0')
    expect(result).toEqual({ version: 'v2.0.0', url: 'https://example.com/release' })
  })

  it('возвращает null, если релиз не новее текущей версии', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ tag_name: 'v1.0.0', html_url: 'https://example.com/release' })
      })
    )

    expect(await checkForUpdate('1.0.0')).toBeNull()
  })

  it('возвращает null при неуспешном HTTP-ответе', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))

    expect(await checkForUpdate('1.0.0')).toBeNull()
  })

  it('возвращает null, если сетевой запрос падает с ошибкой', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('network error'))
    )

    expect(await checkForUpdate('1.0.0')).toBeNull()
  })

  it('возвращает null, если в ответе нет tag_name', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) })
    )

    expect(await checkForUpdate('1.0.0')).toBeNull()
  })
})

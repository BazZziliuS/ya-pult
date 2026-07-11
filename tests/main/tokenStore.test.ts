import { describe, expect, it } from 'vitest'
import { isTokenValid, type StoredToken } from '../../src/main/tokenStore'

function tokenExpiringIn(ms: number): StoredToken {
  return { accessToken: 'token', expiresAt: Date.now() + ms }
}

describe('isTokenValid', () => {
  it('null считается невалидным токеном', () => {
    expect(isTokenValid(null)).toBe(false)
  })

  it('токен с будущим expiresAt валиден', () => {
    expect(isTokenValid(tokenExpiringIn(60_000))).toBe(true)
  })

  it('токен с прошедшим expiresAt невалиден', () => {
    expect(isTokenValid(tokenExpiringIn(-1))).toBe(false)
  })
})

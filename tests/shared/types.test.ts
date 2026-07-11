import { describe, expect, it } from 'vitest'
import { ApiError, decodeError, encodeError } from '@shared/types'

describe('encodeError / decodeError', () => {
  it('кодирует и обратно декодирует ApiError без потерь', () => {
    const err = new ApiError('auth', 'токен истёк', 401)
    const decoded = decodeError(encodeError(err))
    expect(decoded).toEqual({ kind: 'auth', message: 'токен истёк', httpStatus: 401 })
  })

  it('обычный Error кодируется как kind: unknown', () => {
    const decoded = decodeError(encodeError(new Error('boom')))
    expect(decoded).toEqual({ kind: 'unknown', message: 'boom' })
  })

  it('не-Error значение приводится к строке', () => {
    const decoded = decodeError(encodeError('просто строка'))
    expect(decoded).toEqual({ kind: 'unknown', message: 'просто строка' })
  })

  it('decodeError на "чужом" сообщении (не JSON от encodeError) не падает', () => {
    expect(decodeError('какая-то ошибка IPC-транспорта')).toEqual({
      kind: 'unknown',
      message: 'какая-то ошибка IPC-транспорта'
    })
  })

  it('decodeError на JSON без нужной формы (kind/message) тоже откатывается на unknown', () => {
    const raw = JSON.stringify({ foo: 'bar' })
    expect(decodeError(raw)).toEqual({ kind: 'unknown', message: raw })
  })
})

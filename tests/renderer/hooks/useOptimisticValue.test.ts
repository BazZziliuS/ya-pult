import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useOptimisticValue } from '@/hooks/useOptimisticValue'

describe('useOptimisticValue', () => {
  it('изначально равен внешнему значению', () => {
    const { result } = renderHook(() => useOptimisticValue(10))
    expect(result.current.value).toBe(10)
  })

  it('commit сразу же меняет value, не дожидаясь ответа сервера (optimistic UI)', () => {
    const { result } = renderHook(() => useOptimisticValue(10))
    act(() => {
      result.current.commit(20)
    })
    expect(result.current.value).toBe(20)
  })

  it('rollback(token) возвращает к последнему подтверждённому сервером значению', () => {
    const { result } = renderHook(() => useOptimisticValue(10))
    let token = -1
    act(() => {
      token = result.current.commit(20)
    })
    act(() => {
      result.current.rollback(token)
    })
    expect(result.current.value).toBe(10)
  })

  it('когда внешнее значение (опрос) догоняет отправленное — value и confirmed синхронизируются', () => {
    const { result, rerender } = renderHook(({ external }) => useOptimisticValue(external), {
      initialProps: { external: 10 }
    })
    act(() => {
      result.current.commit(20)
    })
    rerender({ external: 20 })
    expect(result.current.value).toBe(20)

    // rollback после ресинхронизации откатывает уже на новое подтверждённое значение
    let token = -1
    act(() => {
      token = result.current.commit(30)
    })
    act(() => {
      result.current.rollback(token)
    })
    expect(result.current.value).toBe(20)
  })

  it('опрос с ещё не подтверждённым значением НЕ перетирает optimistic value (регрессия на баг "зависания" UI)', () => {
    const { result, rerender } = renderHook(({ external }) => useOptimisticValue(external), {
      initialProps: { external: 10 }
    })
    act(() => {
      result.current.commit(20)
    })
    // Опрос вернул промежуточное значение, отличное и от подтверждённого, и от отправленного
    rerender({ external: 15 })
    expect(result.current.value).toBe(20)
  })

  it('устаревший rollback не перетирает значение более нового commit (регрессия на race двух подряд команд)', () => {
    const { result } = renderHook(() => useOptimisticValue(10))
    let firstToken = -1
    act(() => {
      firstToken = result.current.commit(20) // например, "выключить" — запрос ещё не ответил
    })
    act(() => {
      result.current.commit(30) // быстрый повторный клик — "включить" — уже успел примениться
    })
    // Первый (уже устаревший) запрос наконец возвращает ошибку и пытается откатить —
    // но его токен больше не актуален, так что откат должен быть no-op
    act(() => {
      result.current.rollback(firstToken)
    })
    expect(result.current.value).toBe(30)
  })

  it('rollback с заведомо устаревшим токеном (до какого-либо commit) — no-op', () => {
    const { result } = renderHook(() => useOptimisticValue(10))
    act(() => {
      result.current.rollback(-1)
    })
    expect(result.current.value).toBe(10)
  })
})

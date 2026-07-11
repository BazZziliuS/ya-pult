import { useEffect, useRef, useState } from 'react'

/**
 * Значение, привязанное к состоянию устройства, которое приходит только по
 * опросу раз в N секунд. Если сделать контрол строго controlled на внешнем
 * значении без собственного состояния — он либо не реагирует на клик/драг
 * визуально, либо дёргается обратно к старому значению сразу после действия
 * (пока опрос не подтвердит изменение). Хуже того, для тумблера (on/off) это
 * приводит к тому, что повторные клики всегда шлют одну и ту же команду,
 * потому что controlled-проп фактически не меняется между кликами.
 *
 * Держим локальное значение и ресинхронизируемся с внешним только пока не
 * отправили свою команду, либо когда внешнее значение уже её догнало.
 *
 * `rollback(token)` — для optimistic UI: коммитим значение сразу (не
 * дожидаясь ответа API), и если реальный запрос вернул ошибку, откатываем
 * обратно на последнее подтверждённое сервером значение (`confirmedRef`,
 * обновляется только опросом, а не commit-ом — иначе откат во время
 * быстрого драга слайдера откатывал бы на предыдущую ПРОМЕЖУТОЧНУЮ точку
 * драга, а не на реально последнее известное состояние устройства).
 *
 * `commit` возвращает токен поколения — его нужно передать в `rollback`,
 * чтобы откат сработал только если это всё ещё самый последний commit
 * (см. комментарий у rollback).
 */
export function useOptimisticValue<T>(externalValue: T): {
  value: T
  setValue: (next: T) => void
  commit: (next: T) => number
  rollback: (token: number) => void
} {
  const [value, setValue] = useState(externalValue)
  const lastSentRef = useRef<T | undefined>(undefined)
  const confirmedRef = useRef<T>(externalValue)
  const generationRef = useRef(0)

  useEffect(() => {
    if (lastSentRef.current === undefined || externalValue === lastSentRef.current) {
      setValue(externalValue)
      confirmedRef.current = externalValue
      lastSentRef.current = undefined
    }
  }, [externalValue])

  const commit = (next: T): number => {
    setValue(next)
    lastSentRef.current = next
    generationRef.current += 1
    return generationRef.current
  }

  const rollback = (token: number): void => {
    // Если после этого commit-а был ещё один (token устарел) — второй,
    // более поздний commit уже мог успешно завершиться и обновить value.
    // Откат по устаревшему токену не должен затирать его результат: он
    // просто игнорируется, а свежий commit откатится по своему токену сам.
    if (token !== generationRef.current) return
    setValue(confirmedRef.current)
    lastSentRef.current = undefined
  }

  return { value, setValue, commit, rollback }
}

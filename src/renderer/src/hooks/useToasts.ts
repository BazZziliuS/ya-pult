import { useCallback, useRef, useState } from 'react'

export type ToastKind = 'error' | 'info' | 'success'

export interface ToastAction {
  label: string
  onPress: () => void
}

export interface ToastItem {
  id: string
  kind: ToastKind
  message: string
  action?: ToastAction
}

const MAX_VISIBLE_TOASTS = 4

let counter = 0

export function useToasts(): {
  toasts: ToastItem[]
  pushToast: (message: string, kind?: ToastKind, action?: ToastAction) => void
  dismissToast: (id: string) => void
} {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>())

  const clearTimer = useCallback((id: string) => {
    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
  }, [])

  const dismissToast = useCallback(
    (id: string) => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
      clearTimer(id)
    },
    [clearTimer]
  )

  const scheduleDismiss = useCallback(
    (id: string, kind: ToastKind) => {
      clearTimer(id)
      const timer = setTimeout(() => dismissToast(id), kind === 'error' ? 8000 : 4000)
      timers.current.set(id, timer)
    },
    [clearTimer, dismissToast]
  )

  const pushToast = useCallback(
    (message: string, kind: ToastKind = 'info', action?: ToastAction) => {
      setToasts((prev) => {
        // не дублируем уже показанное сообщение того же типа — просто продлеваем его жизнь
        const existing = prev.find((t) => t.kind === kind && t.message === message)
        if (existing) {
          scheduleDismiss(existing.id, kind)
          return prev
        }

        const id = `toast-${++counter}`
        scheduleDismiss(id, kind)
        const next = [...prev, { id, kind, message, action }]
        return next.length > MAX_VISIBLE_TOASTS ? next.slice(next.length - MAX_VISIBLE_TOASTS) : next
      })
    },
    [scheduleDismiss]
  )

  return { toasts, pushToast, dismissToast }
}

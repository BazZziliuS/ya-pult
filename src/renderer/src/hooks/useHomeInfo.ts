import { useCallback, useEffect, useRef, useState } from 'react'
import { decodeError, type AppError, type HomeInfo } from '@shared/types'

const DEFAULT_POLL_INTERVAL_MS = 12_000

/** После скольких подряд неудачных опросов считаем недоступность устойчивой (не разовым сбоем сети) */
const PERSISTENT_FAILURE_THRESHOLD = 3

export interface UseHomeInfoHandlers {
  onAuthError: () => void
  /** failureCount — сколько опросов подряд провалились этой же ошибкой */
  onError: (error: AppError, failureCount: number) => void
  onRecovered: () => void
}

interface UseHomeInfoResult {
  homeInfo: HomeInfo | null
  loading: boolean
  error: AppError | null
  refresh: () => Promise<void>
  /** Когда последний раз успешно обновились — для индикации свежести данных в шапке */
  lastUpdatedAt: number | null
}

export function useHomeInfo(
  enabled: boolean,
  handlers: UseHomeInfoHandlers,
  pollIntervalMs: number = DEFAULT_POLL_INTERVAL_MS
): UseHomeInfoResult {
  const [homeInfo, setHomeInfo] = useState<HomeInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<AppError | null>(null)
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null)
  const handlersRef = useRef(handlers)
  handlersRef.current = handlers
  const failureCountRef = useRef(0)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const info = await window.api.getHomeInfo()
      setHomeInfo(info)
      setLastUpdatedAt(Date.now())
      if (failureCountRef.current > 0) handlersRef.current.onRecovered()
      failureCountRef.current = 0
      setError(null)
    } catch (err) {
      const appError = decodeError((err as Error).message)
      failureCountRef.current += 1
      setError(appError)
      if (appError.kind === 'auth') {
        handlersRef.current.onAuthError()
      } else if (failureCountRef.current === 1 || failureCountRef.current === PERSISTENT_FAILURE_THRESHOLD) {
        handlersRef.current.onError(appError, failureCountRef.current)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!enabled) {
      setHomeInfo(null)
      setError(null)
      setLastUpdatedAt(null)
      failureCountRef.current = 0
      return
    }
    void refresh()
    const interval = setInterval(() => void refresh(), pollIntervalMs)
    return () => clearInterval(interval)
  }, [enabled, refresh, pollIntervalMs])

  return { homeInfo, loading, error, refresh, lastUpdatedAt }
}

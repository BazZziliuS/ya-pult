import { useCallback, useEffect, useState } from 'react'
import { decodeError, type YandexProfile } from '@shared/types'

export type AuthState = 'checking' | 'authed' | 'guest'

export interface UseAuthResult {
  authState: AuthState
  profile: YandexProfile | null
  loggingIn: boolean
  loginError: string | undefined
  login: () => Promise<void>
  logout: () => Promise<void>
  /** Переводит сессию в "гость", если она была активна — используется опросом дома и action-хендлерами при 401 */
  handleAuthError: () => void
}

/** Состояние авторизации + профиль аккаунта для шапки. Отделено от App.tsx, чтобы не мешать с логикой дома/действий. */
export function useAuth(notCompletedMessage: string): UseAuthResult {
  const [authState, setAuthState] = useState<AuthState>('checking')
  const [profile, setProfile] = useState<YandexProfile | null>(null)
  const [loggingIn, setLoggingIn] = useState(false)
  const [loginError, setLoginError] = useState<string | undefined>(undefined)

  useEffect(() => {
    void (async () => {
      const authed = await window.api.authStatus()
      setAuthState(authed ? 'authed' : 'guest')
    })()
  }, [])

  // Логин аккаунта для профиля в шапке — не критично для работы приложения,
  // поэтому не мешаем остальному UI, если запрос не удался (getProfile сам
  // резолвится в null вместо throw, см. yandexApi.ts).
  useEffect(() => {
    if (authState !== 'authed') {
      setProfile(null)
      return
    }
    void window.api.getProfile().then(setProfile)
  }, [authState])

  const login = useCallback(async () => {
    setLoggingIn(true)
    setLoginError(undefined)
    try {
      const ok = await window.api.login()
      setAuthState(ok ? 'authed' : 'guest')
      if (!ok) setLoginError(notCompletedMessage)
    } catch (err) {
      const appError = decodeError((err as Error).message)
      setLoginError(appError.message)
    } finally {
      setLoggingIn(false)
    }
  }, [notCompletedMessage])

  const logout = useCallback(async () => {
    await window.api.logout()
    setAuthState('guest')
  }, [])

  const handleAuthError = useCallback(() => {
    setAuthState((prev) => (prev === 'authed' ? 'guest' : prev))
  }, [])

  return { authState, profile, loggingIn, loginError, login, logout, handleAuthError }
}

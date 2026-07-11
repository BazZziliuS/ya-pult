import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { translations, type Lang } from './translations'

const STORAGE_KEY = 'yapult-lang'

function detectInitialLang(): Lang {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'ru' || stored === 'en') return stored
  return navigator.language?.toLowerCase().startsWith('ru') ? 'ru' : 'en'
}

type Vars = Record<string, string | number>

function interpolate(template: string, vars?: Vars): string {
  if (!vars) return template
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
    const value = vars[key]
    return value === undefined ? match : String(value)
  })
}

function resolvePath(dict: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((node, key) => {
    if (node && typeof node === 'object' && key in (node as Record<string, unknown>)) {
      return (node as Record<string, unknown>)[key]
    }
    return undefined
  }, dict)
}

interface I18nContextValue {
  lang: Lang
  setLang: (lang: Lang) => void
  /** Статические UI-строки по точечному пути, например t('topbar.login') */
  t: (path: string, vars?: Vars) => string
  /** Динамические словари с ключами-константами API (могут содержать точки, например 'devices.types.light') */
  dict: (typeof translations)['ru']
}

export const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }): JSX.Element {
  const [lang, setLangState] = useState<Lang>(detectInitialLang)

  const setLang = useCallback((next: Lang) => {
    setLangState(next)
    localStorage.setItem(STORAGE_KEY, next)
  }, [])

  // main-процесс тоже шлёт нативные уведомления (например, при истечении
  // сессии) — держим его в курсе выбранного языка при старте и при смене
  useEffect(() => {
    window.api.setLanguage(lang).catch(() => {})
  }, [lang])

  const t = useCallback(
    (path: string, vars?: Vars): string => {
      const value = resolvePath(translations[lang], path)
      return typeof value === 'string' ? interpolate(value, vars) : path
    },
    [lang]
  )

  const value = useMemo<I18nContextValue>(
    () => ({ lang, setLang, t, dict: translations[lang] }),
    [lang, setLang, t]
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n должен использоваться внутри I18nProvider')
  return ctx
}

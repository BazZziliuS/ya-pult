import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

const STORAGE_KEY = 'yapult-settings'

export const POLL_INTERVAL_OPTIONS_MS = [10_000, 12_000, 15_000, 30_000, 60_000] as const

interface Settings {
  notificationsEnabled: boolean
  pollIntervalMs: number
}

const DEFAULT_SETTINGS: Settings = { notificationsEnabled: true, pollIntervalMs: 12_000 }

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_SETTINGS
    const parsed = JSON.parse(raw) as Partial<Settings>
    return {
      notificationsEnabled:
        typeof parsed.notificationsEnabled === 'boolean' ? parsed.notificationsEnabled : DEFAULT_SETTINGS.notificationsEnabled,
      pollIntervalMs:
        typeof parsed.pollIntervalMs === 'number' && POLL_INTERVAL_OPTIONS_MS.includes(parsed.pollIntervalMs as (typeof POLL_INTERVAL_OPTIONS_MS)[number])
          ? parsed.pollIntervalMs
          : DEFAULT_SETTINGS.pollIntervalMs
    }
  } catch {
    return DEFAULT_SETTINGS
  }
}

interface SettingsContextValue extends Settings {
  setNotificationsEnabled: (value: boolean) => void
  setPollIntervalMs: (value: number) => void
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }): JSX.Element {
  const [settings, setSettings] = useState<Settings>(loadSettings)

  const persist = useCallback((next: Settings) => {
    setSettings(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }, [])

  const setNotificationsEnabled = useCallback(
    (value: boolean) => persist({ ...settings, notificationsEnabled: value }),
    [settings, persist]
  )
  const setPollIntervalMs = useCallback(
    (value: number) => persist({ ...settings, pollIntervalMs: value }),
    [settings, persist]
  )

  const value = useMemo<SettingsContextValue>(
    () => ({ ...settings, setNotificationsEnabled, setPollIntervalMs }),
    [settings, setNotificationsEnabled, setPollIntervalMs]
  )

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings должен использоваться внутри SettingsProvider')
  return ctx
}

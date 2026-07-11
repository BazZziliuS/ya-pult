import { useCallback, useEffect, useState } from 'react'
import type { HomeInfo, TrayMruItem } from '@shared/types'

const STORAGE_KEY = 'yapult-tray-mru'
const MAX_ITEMS = 5

function loadStored(): TrayMruItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function persist(items: TrayMruItem[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

function findOnOffState(homeInfo: HomeInfo, kind: 'device' | 'group', id: string): boolean | undefined {
  const source = kind === 'device' ? homeInfo.devices : homeInfo.groups
  const capability = source.find((s) => s.id === id)?.capabilities.find((c) => c.type === 'devices.capabilities.on_off')
  return capability?.state && capability.state.instance === 'on' ? (capability.state.value as boolean) : undefined
}

/**
 * Список «последних действий» для контекстного меню трея (пункт: включить/
 * выключить конкретное устройство или группу). Main-процесс сам ничего не
 * знает про устройства — он только выполняет клик, показывает то, что
 * прислал renderer. Здесь же держим состояние актуальным по каждому опросу,
 * чтобы трей не показывал устаревшее «выключено», если свет включили голосом.
 */
export function useTrayMru(homeInfo: HomeInfo | null): {
  recordToggle: (kind: 'device' | 'group', id: string, name: string, isOn: boolean) => void
} {
  const [items, setItems] = useState<TrayMruItem[]>(loadStored)

  const recordToggle = useCallback((kind: 'device' | 'group', id: string, name: string, isOn: boolean) => {
    setItems((prev) => {
      const rest = prev.filter((i) => !(i.id === id && i.kind === kind))
      const next = [{ id, kind, name, isOn }, ...rest].slice(0, MAX_ITEMS)
      persist(next)
      return next
    })
  }, [])

  useEffect(() => {
    if (!homeInfo) return
    setItems((prev) => {
      let changed = false
      const next = prev.map((item) => {
        const fresh = findOnOffState(homeInfo, item.kind, item.id)
        if (fresh === undefined || fresh === item.isOn) return item
        changed = true
        return { ...item, isOn: fresh }
      })
      if (!changed) return prev
      persist(next)
      return next
    })
  }, [homeInfo])

  useEffect(() => {
    window.api.syncTrayMenu(items).catch(() => {})
  }, [items])

  return { recordToggle }
}

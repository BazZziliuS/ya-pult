import { useEffect, useRef, useState, type Key } from 'react'
import { Autocomplete, AutocompleteItem, AutocompleteSection } from '@heroui/react'
import type { Device, Scenario } from '@shared/types'
import { deviceTypeIcon, deviceTypeLabel } from '@/lib/labels'
import { useI18n } from '@/i18n/I18nContext'

interface QuickSearchProps {
  devices: Device[]
  scenarios: Scenario[]
  onSelectDevice: (id: string) => void
  onSelectScenario: (scenario: Scenario) => void
}

const DEVICE_KEY_PREFIX = 'device:'
const SCENARIO_KEY_PREFIX = 'scenario:'

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform ?? navigator.userAgent)
const SHORTCUT_HINT = isMac ? '⌘K' : 'Ctrl+K'

export function QuickSearch({ devices, scenarios, onSelectDevice, onSelectScenario }: QuickSearchProps): JSX.Element {
  const { t, dict } = useI18n()
  // Автокомплит используется как командная палитра, а не постоянный фильтр —
  // после выбора пересоздаём инпут заново, чтобы он не оставался заполненным.
  const [resetKey, setResetKey] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleGlobalShortcut = (event: KeyboardEvent): void => {
      const isShortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k'
      if (!isShortcut) return
      event.preventDefault()
      containerRef.current?.querySelector('input')?.focus()
    }
    window.addEventListener('keydown', handleGlobalShortcut)
    return () => window.removeEventListener('keydown', handleGlobalShortcut)
  }, [])

  const handleSelectionChange = (key: Key | null): void => {
    if (!key) return
    const keyStr = String(key)
    if (keyStr.startsWith(DEVICE_KEY_PREFIX)) {
      onSelectDevice(keyStr.slice(DEVICE_KEY_PREFIX.length))
    } else if (keyStr.startsWith(SCENARIO_KEY_PREFIX)) {
      const scenarioId = keyStr.slice(SCENARIO_KEY_PREFIX.length)
      const scenario = scenarios.find((s) => s.id === scenarioId)
      if (scenario) onSelectScenario(scenario)
    }
    setResetKey((prev) => prev + 1)
  }

  return (
    <div ref={containerRef} className="flex items-center">
      <Autocomplete
        key={resetKey}
        size="sm"
        variant="flat"
        radius="full"
        placeholder={t('search.placeholder')}
        aria-label={t('search.placeholder')}
        className="w-48 sm:w-72"
        startContent={
          <span aria-hidden className="text-default-400">
            🔍
          </span>
        }
        endContent={
          <span aria-hidden className="text-default-400 text-tiny hidden lg:inline whitespace-nowrap">
            {SHORTCUT_HINT}
          </span>
        }
        onSelectionChange={handleSelectionChange}
      >
        {scenarios.length > 0 ? (
          <AutocompleteSection title={t('home.scenarios')}>
            {scenarios.map((scenario) => (
              <AutocompleteItem
                key={`${SCENARIO_KEY_PREFIX}${scenario.id}`}
                textValue={scenario.name}
                startContent={
                  <span aria-hidden className="text-base">
                    {scenario.icon ?? '▶️'}
                  </span>
                }
              >
                {scenario.name}
              </AutocompleteItem>
            ))}
          </AutocompleteSection>
        ) : null}
        {devices.length > 0 ? (
          <AutocompleteSection title={t('search.devices')}>
            {devices.map((device) => (
              <AutocompleteItem
                key={`${DEVICE_KEY_PREFIX}${device.id}`}
                textValue={device.name}
                description={deviceTypeLabel(dict, device.type)}
                startContent={
                  <span aria-hidden className="text-base">
                    {deviceTypeIcon(device.type)}
                  </span>
                }
              >
                {device.name}
              </AutocompleteItem>
            ))}
          </AutocompleteSection>
        ) : null}
      </Autocomplete>
    </div>
  )
}

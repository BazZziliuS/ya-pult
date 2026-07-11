import { useEffect, useRef, useState } from 'react'
import type { CapabilityActionRequest } from '@shared/types'
import { useI18n } from '@/i18n/I18nContext'

type OnAction = (id: string, action: CapabilityActionRequest) => Promise<{ success: boolean; message?: string }>

interface UseEntityCardActionResult {
  busy: boolean
  error: string | null
  handleAction: (action: CapabilityActionRequest) => Promise<boolean>
}

/**
 * Общая логика busy/error и обёртки над onAction для DeviceCard и GroupCard —
 * вынесена, чтобы поведение карточек устройств и групп не расходилось со временем.
 */
export function useEntityCardAction(id: string, onAction: OnAction): UseEntityCardActionResult {
  const { t } = useI18n()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const errorTimer = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => () => clearTimeout(errorTimer.current), [])

  const showError = (message: string): void => {
    setError(message)
    clearTimeout(errorTimer.current)
    errorTimer.current = setTimeout(() => setError(null), 8000)
  }

  /** true — действие подтверждено сервером; false — контрол должен откатить оптимистичное значение обратно */
  const handleAction = async (action: CapabilityActionRequest): Promise<boolean> => {
    setBusy(true)
    setError(null)
    try {
      const result = await onAction(id, action)
      if (!result.success) {
        showError(result.message ?? t('device.noResponse'))
        return false
      }
      return true
    } catch (err) {
      showError((err as Error).message)
      return false
    } finally {
      setBusy(false)
    }
  }

  return { busy, error, handleAction }
}

import { useCallback, useState, type MutableRefObject } from 'react'
import { decodeError, type ActionResult, type CapabilityActionRequest, type HomeInfo, type Scenario } from '@shared/types'
import type { ToastAction, ToastKind } from './useToasts'

type Translate = (path: string, vars?: Record<string, string | number>) => string

export interface UseEntityActionsDeps {
  /** Ref, а не прямое значение — иначе handleDeviceAction/handleGroupAction пересоздавались бы на каждый опрос дома */
  homeInfoRef: MutableRefObject<HomeInfo | null>
  pushToast: (message: string, kind?: ToastKind, action?: ToastAction) => void
  notify: (title: string, body: string, urgency?: 'normal' | 'critical') => void
  onAuthError: () => void
  recordToggle: (kind: 'device' | 'group', id: string, name: string, isOn: boolean) => void
  t: Translate
}

interface ActionOutcome {
  success: boolean
  message?: string
}

export interface UseEntityActionsResult {
  handleDeviceAction: (deviceId: string, action: CapabilityActionRequest) => Promise<ActionOutcome>
  handleGroupAction: (groupId: string, action: CapabilityActionRequest) => Promise<ActionOutcome>
  handleRunScenario: (scenario: Scenario) => Promise<void>
  runningScenarioId: string | null
}

/**
 * Отправка действий устройствам/группам/сценариям: запись в MRU трея по
 * успешному on_off, обработка auth/сетевых ошибок (тост с ретраем той же
 * командой), уведомление ОС по завершении сценария.
 */
export function useEntityActions(deps: UseEntityActionsDeps): UseEntityActionsResult {
  const { homeInfoRef, pushToast, notify, onAuthError, recordToggle, t } = deps
  const [runningScenarioId, setRunningScenarioId] = useState<string | null>(null)

  /** Пополняет список «последних действий» в трее — только для включения/выключения, только по успеху */
  const recordOnOffToggle = useCallback(
    (kind: 'device' | 'group', id: string, action: CapabilityActionRequest) => {
      if (action.type !== 'devices.capabilities.on_off') return
      const source = kind === 'device' ? homeInfoRef.current?.devices : homeInfoRef.current?.groups
      const name = source?.find((s) => s.id === id)?.name
      if (name) recordToggle(kind, id, name, action.state.value as boolean)
    },
    [homeInfoRef, recordToggle]
  )

  // Общая часть handleDeviceAction/handleGroupAction: они отличаются только вызываемым
  // API-методом и меткой kind — вынесено, чтобы правка error-handling/retry не расходилась
  // между устройствами и группами
  const sendCapabilityAction = useCallback(
    async (
      kind: 'device' | 'group',
      id: string,
      action: CapabilityActionRequest,
      apiCall: (id: string, action: CapabilityActionRequest) => Promise<ActionResult>,
      retry: () => void
    ): Promise<ActionOutcome> => {
      try {
        const result = await apiCall(id, action)
        if (!result.success) return { success: false, message: result.errorMessage ?? t('device.noResponse') }
        recordOnOffToggle(kind, id, action)
        return { success: true }
      } catch (err) {
        const appError = decodeError((err as Error).message)
        if (appError.kind === 'auth') {
          onAuthError()
          return { success: false, message: appError.message }
        }
        if (appError.kind === 'network' || appError.kind === 'timeout') {
          pushToast(appError.message, 'error', { label: t('error.retryShort'), onPress: retry })
        }
        return { success: false, message: appError.message }
      }
    },
    [pushToast, t, recordOnOffToggle, onAuthError]
  )

  const handleDeviceAction = useCallback(
    (deviceId: string, action: CapabilityActionRequest) =>
      sendCapabilityAction('device', deviceId, action, window.api.setDeviceCapability, () =>
        void handleDeviceAction(deviceId, action)
      ),
    [sendCapabilityAction]
  )

  const handleGroupAction = useCallback(
    (groupId: string, action: CapabilityActionRequest) =>
      sendCapabilityAction('group', groupId, action, window.api.setGroupCapability, () =>
        void handleGroupAction(groupId, action)
      ),
    [sendCapabilityAction]
  )

  const handleRunScenario = useCallback(
    async (scenario: Scenario) => {
      setRunningScenarioId(scenario.id)
      try {
        await window.api.runScenario(scenario.id)
        pushToast(t('toast.scenarioLaunched', { name: scenario.name }), 'success')
        notify(t('notify.scenarioDoneTitle'), t('notify.scenarioDoneBody', { name: scenario.name }))
      } catch (err) {
        const appError = decodeError((err as Error).message)
        if (appError.kind === 'auth') onAuthError()
        else
          pushToast(t('toast.scenarioError', { name: scenario.name, message: appError.message }), 'error', {
            label: t('error.retryShort'),
            onPress: () => void handleRunScenario(scenario)
          })
      } finally {
        setRunningScenarioId(null)
      }
    },
    [pushToast, t, notify, onAuthError]
  )

  return { handleDeviceAction, handleGroupAction, handleRunScenario, runningScenarioId }
}

import { ipcMain, type BrowserWindow, type IpcMainInvokeEvent } from 'electron'
import {
  ApiError,
  encodeError,
  IPC_CHANNELS,
  type ActionResult,
  type CapabilityActionRequest,
  type HomeInfo,
  type Lang,
  type NotifyPayload,
  type TrayMruItem
} from '@shared/types'
import { openAuthWindow } from './auth'
import { clearToken, isTokenValid, saveToken, type StoredToken } from './tokenStore'
import { YandexIotApi, type RawActionsResponse } from './yandexApi'
import { notifyUser } from './notifications'
import type { AppTray } from './tray'

/** Строки для нативного уведомления об истёкшей сессии — инициирует сам main, а не renderer по запросу. */
// Намеренно продублировано с renderer/src/i18n/translations.ts, а не переиспользовано:
// main не может импортировать renderer-модули (другой Vite-таргет сборки), это не недосмотр.
const SESSION_EXPIRED_STRINGS: Record<Lang, { title: string; body: string }> = {
  ru: {
    title: 'ЯПульт — сессия истекла',
    body: 'Токен доступа Яндекса недействителен. Войдите заново.'
  },
  en: {
    title: 'YaPult — session expired',
    body: 'Your Yandex access token is no longer valid. Please sign in again.'
  }
}

/**
 * И одиночное, и групповое действие возвращают один и тот же формат —
 * `devices[]` с action_result на каждом устройстве (для группы устройств в
 * массиве несколько, для одиночного действия — одно). Успех — если DONE
 * получили все; иначе отдаём код/сообщение первой ошибки.
 * Реальный API отдаёт status в верхнем регистре ("DONE"/"ERROR"), а не в
 * нижнем, как в документации — сравнение регистро-независимое.
 */
function parseActionResult(response: RawActionsResponse): ActionResult {
  const results = (response.devices ?? []).flatMap((d) => d.capabilities.map((c) => c.state.action_result))
  if (results.length === 0) return { success: true }

  // response не валидируется рантаймом (unchecked `as T` в yandexApi.ts), поэтому элемент
  // results может оказаться undefined — ищем через findIndex, чтобы не путать "не нашли"
  // с "нашли, но это и есть тот самый undefined"
  const failedIndex = results.findIndex((r) => !r || r.status?.toUpperCase() !== 'DONE')
  if (failedIndex === -1) return { success: true }

  const failed = results[failedIndex]
  return { success: false, errorCode: failed?.error_code, errorMessage: failed?.error_message }
}

export interface IpcDeps {
  api: YandexIotApi
  getMainWindow: () => BrowserWindow | null
  getToken: () => StoredToken | null
  setToken: (token: StoredToken | null) => void
  getLang: () => Lang
  setLang: (lang: Lang) => void
  getTray: () => AppTray | null
}

export interface IpcController {
  registerIpcHandlers: () => void
  /** Клик по пункту меню трея: включить/выключить конкретное устройство или группу целиком. */
  performTrayToggle: (item: TrayMruItem) => Promise<ActionResult>
}

/**
 * IPC-хендлеры и связанная с ними логика авторизации/ошибок вынесены из
 * main.ts в фабрику с явными зависимостями (а не закрытие над module-level
 * `let`) — main.ts остаётся единственным владельцем изменяемого состояния
 * сессии (токен/язык/окно/трей), а этот модуль просто читает и пишет его
 * через переданные getter/setter.
 */
export function createIpcController(deps: IpcDeps): IpcController {
  /** При 401 сбрасывает токен и шлёт уведомление о потере сессии — общая часть для IPC- и внутренних вызовов (трей). */
  function handleAuthFailure(err: unknown): void {
    if (err instanceof ApiError && err.kind === 'auth') {
      const hadToken = deps.getToken() !== null
      deps.setToken(null)
      clearToken()
      if (hadToken) {
        const strings = SESSION_EXPIRED_STRINGS[deps.getLang()]
        notifyUser({ title: strings.title, body: strings.body, urgency: 'critical' })
      }
    }
  }

  /**
   * Оборачивает вызов API для IPC-хендлеров: помимо сброса токена, кодирует
   * ошибку в message — Electron не переносит через IPC произвольные поля
   * класса, только message (см. encodeError/decodeError).
   */
  async function withAuthGuard<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn()
    } catch (err) {
      handleAuthFailure(err)
      throw new Error(encodeError(err))
    }
  }

  /**
   * То же самое, но для вызовов внутри main-процесса (трей), которые не
   * пересекают границу IPC — незачем кодировать ошибку в JSON, достаточно
   * человекочитаемого message из ApiError.
   */
  async function withAuthGuardInternal<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn()
    } catch (err) {
      handleAuthFailure(err)
      throw err instanceof Error ? err : new Error(String(err))
    }
  }

  async function performTrayToggle(item: TrayMruItem): Promise<ActionResult> {
    return withAuthGuardInternal(async () => {
      const action: CapabilityActionRequest = { type: 'devices.capabilities.on_off', state: { instance: 'on', value: !item.isOn } }
      const response =
        item.kind === 'group' ? await deps.api.sendGroupAction(item.id, action) : await deps.api.sendDeviceAction(item.id, action)
      return parseActionResult(response)
    })
  }

  function registerIpcHandlers(): void {
    ipcMain.handle(IPC_CHANNELS.AUTH_STATUS, async (): Promise<boolean> => {
      return isTokenValid(deps.getToken())
    })

    ipcMain.handle(IPC_CHANNELS.LOGIN, async (): Promise<boolean> => {
      const win = deps.getMainWindow()
      if (!win) return false
      try {
        const token = await openAuthWindow(win)
        if (!token) return false
        saveToken(token)
        deps.setToken(token)
        return true
      } catch (err) {
        throw new Error(encodeError(err))
      }
    })

    ipcMain.handle(IPC_CHANNELS.LOGOUT, async (): Promise<void> => {
      deps.setToken(null)
      clearToken()
    })

    ipcMain.handle(IPC_CHANNELS.GET_PROFILE, async () => {
      return deps.api.getProfile()
    })

    ipcMain.handle(IPC_CHANNELS.NOTIFY, async (_event: IpcMainInvokeEvent, payload: NotifyPayload): Promise<void> => {
      notifyUser(payload)
    })

    ipcMain.handle(IPC_CHANNELS.SET_LANGUAGE, async (_event: IpcMainInvokeEvent, lang: Lang): Promise<void> => {
      deps.setLang(lang)
      deps.getTray()?.refreshLabels()
    })

    ipcMain.handle(IPC_CHANNELS.TRAY_SYNC, async (_event: IpcMainInvokeEvent, items: TrayMruItem[]): Promise<void> => {
      deps.getTray()?.updateItems(items)
    })

    ipcMain.handle(IPC_CHANNELS.GET_HOME_INFO, async (): Promise<HomeInfo> => {
      return withAuthGuard(() => deps.api.getUserInfo())
    })

    ipcMain.handle(
      IPC_CHANNELS.SET_DEVICE_CAPABILITY,
      async (_event: IpcMainInvokeEvent, deviceId: string, action: CapabilityActionRequest): Promise<ActionResult> => {
        return withAuthGuard(async () => parseActionResult(await deps.api.sendDeviceAction(deviceId, action)))
      }
    )

    ipcMain.handle(
      IPC_CHANNELS.SET_GROUP_CAPABILITY,
      async (_event: IpcMainInvokeEvent, groupId: string, action: CapabilityActionRequest): Promise<ActionResult> => {
        return withAuthGuard(async () => parseActionResult(await deps.api.sendGroupAction(groupId, action)))
      }
    )

    ipcMain.handle(IPC_CHANNELS.RUN_SCENARIO, async (_event: IpcMainInvokeEvent, scenarioId: string): Promise<void> => {
      return withAuthGuard(() => deps.api.runScenario(scenarioId))
    })
  }

  return { registerIpcHandlers, performTrayToggle }
}

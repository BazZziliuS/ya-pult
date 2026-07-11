/**
 * Общие типы домена и IPC-контрактов. Используются в main, preload и renderer,
 * поэтому не должны содержать импортов из Node/Electron/DOM.
 *
 * Форма Device/Capability/Property повторяет структуру ответов официального
 * REST API платформы умного дома Яндекса: https://yandex.ru/dev/dialogs/smart-home/doc/reference/
 */

// ---------------------------------------------------------------------------
// Capability (умение устройства)
// ---------------------------------------------------------------------------

export type CapabilityType =
  | 'devices.capabilities.on_off'
  | 'devices.capabilities.color_setting'
  | 'devices.capabilities.mode'
  | 'devices.capabilities.range'
  | 'devices.capabilities.toggle'

export interface OnOffCapabilityState {
  instance: 'on'
  value: boolean
}

export interface RangeCapabilityParameters {
  instance: 'brightness' | 'temperature' | 'volume' | 'channel' | 'humidity' | string
  unit?: string
  random_access?: boolean
  range?: {
    min: number
    max: number
    precision: number
  }
}

export interface RangeCapabilityState {
  instance: RangeCapabilityParameters['instance']
  value: number
  relative?: boolean
}

export interface ModeCapabilityParameters {
  instance: 'program' | 'fan_speed' | 'thermostat' | 'swing' | 'work_speed' | string
  modes: { value: string; name?: string }[]
}

export interface ModeCapabilityState {
  instance: ModeCapabilityParameters['instance']
  value: string
}

export interface ColorSettingCapabilityParameters {
  color_model?: 'rgb' | 'hsv'
  temperature_k?: { min: number; max: number }
  /** В реальном ответе API поле называется в единственном числе — `color_scene`, не `color_scenes` */
  color_scene?: { scenes: { id: string; name?: string }[] }
}

export type ColorSettingCapabilityState =
  | { instance: 'hsv'; value: { h: number; s: number; v: number } }
  | { instance: 'rgb'; value: number }
  | { instance: 'temperature_k'; value: number }
  | { instance: 'scene'; value: string }

export interface ToggleCapabilityParameters {
  instance: 'backlight' | 'controls_locked' | 'mute' | 'pause' | string
}

export interface ToggleCapabilityState {
  instance: ToggleCapabilityParameters['instance']
  value: boolean
}

export type CapabilityState =
  | OnOffCapabilityState
  | RangeCapabilityState
  | ModeCapabilityState
  | ColorSettingCapabilityState
  | ToggleCapabilityState

export type CapabilityParameters =
  | RangeCapabilityParameters
  | ModeCapabilityParameters
  | ColorSettingCapabilityParameters
  | ToggleCapabilityParameters
  | Record<string, never>

export interface Capability {
  type: CapabilityType
  retrievable: boolean
  reportable?: boolean
  parameters?: CapabilityParameters
  state?: CapabilityState | null
}

// ---------------------------------------------------------------------------
// Property (показания датчиков)
// ---------------------------------------------------------------------------

export type PropertyType = 'devices.properties.float' | 'devices.properties.event'

export interface Property {
  type: PropertyType
  retrievable: boolean
  reportable?: boolean
  parameters?: {
    instance: string
    unit?: string
  }
  state?: {
    instance: string
    value: number | string
  } | null
}

// ---------------------------------------------------------------------------
// Device / Room / Household / Group / Scenario
// ---------------------------------------------------------------------------

export type DeviceType =
  | 'devices.types.light'
  | 'devices.types.socket'
  | 'devices.types.switch'
  | 'devices.types.thermostat'
  | 'devices.types.thermostat.ac'
  | 'devices.types.vacuum_cleaner'
  | 'devices.types.humidifier'
  | 'devices.types.purifier'
  | 'devices.types.media_device'
  | 'devices.types.media_device.tv'
  | 'devices.types.sensor'
  | 'devices.types.other'
  | string

export type DeviceStatus = 'online' | 'offline' | 'unknown' | 'not_found'

export interface Device {
  id: string
  name: string
  aliases?: string[]
  type: DeviceType
  external_id?: string
  skill_id?: string
  household_id?: string
  room?: string
  groups?: string[]
  capabilities: Capability[]
  properties: Property[]
  /**
   * У большинства устройств из GET /user/info это поле отсутствует —
   * онлайн/офлайн статус отдаёт только GET /devices/{id} для конкретного
   * устройства. Поэтому в списке дома это поле почти всегда undefined,
   * и опираться на него в UI можно только как на необязательную подсказку.
   */
  state?: DeviceStatus
  device_info?: {
    manufacturer?: string
    model?: string
  }
}

export interface Room {
  id: string
  name: string
  household_id?: string
  devices: string[]
}

export interface Household {
  id: string
  name: string
}

export interface DeviceGroup {
  id: string
  name: string
  aliases?: string[]
  type?: DeviceType
  devices: string[]
  capabilities: Capability[]
  household_id?: string
}

export interface Scenario {
  id: string
  name: string
  icon?: string
  is_active?: boolean
}

export interface HomeInfo {
  households: Household[]
  rooms: Room[]
  groups: DeviceGroup[]
  devices: Device[]
  scenarios: Scenario[]
}

// ---------------------------------------------------------------------------
// Действия над устройствами
// ---------------------------------------------------------------------------

export interface CapabilityActionRequest {
  type: CapabilityType
  state: CapabilityState
}

export interface DeviceActionRequest {
  id: string
  actions: CapabilityActionRequest[]
}

export interface ActionResult {
  success: boolean
  errorCode?: string
  errorMessage?: string
}

// ---------------------------------------------------------------------------
// Ошибки, единый формат для показа в UI
// ---------------------------------------------------------------------------

export type AppErrorKind = 'auth' | 'network' | 'timeout' | 'api' | 'scenarioInactive' | 'unknown'

export interface AppError {
  kind: AppErrorKind
  message: string
  httpStatus?: number
}

export class ApiError extends Error {
  kind: AppErrorKind
  httpStatus?: number

  constructor(kind: AppErrorKind, message: string, httpStatus?: number) {
    super(message)
    this.kind = kind
    this.httpStatus = httpStatus
  }

  toAppError(): AppError {
    return { kind: this.kind, message: this.message, httpStatus: this.httpStatus }
  }
}

/**
 * Ошибки, брошенные в main-процессе IPC-хендлером, пересекают границу
 * ipcRenderer.invoke/contextBridge, где Electron гарантированно сохраняет
 * только `message` (не произвольные поля класса). Поэтому структурированную
 * ошибку кодируем прямо в message как JSON и разбираем на другой стороне.
 */
export function encodeError(err: unknown): string {
  if (err instanceof ApiError) {
    return JSON.stringify(err.toAppError())
  }
  const message = err instanceof Error ? err.message : String(err)
  return JSON.stringify({ kind: 'unknown', message } satisfies AppError)
}

/**
 * Electron сам оборачивает message брошенной ошибки в
 * `Error invoking remote method '<channel>': ${error.toString()}` (вызывает
 * .toString(), а не просто копирует .message) — на renderer-стороне до нашего
 * JSON доходит с этим префиксом спереди. Поэтому ищем первую `{` и парсим
 * начиная с неё, а не весь rawMessage целиком.
 */
export function decodeError(rawMessage: string): AppError {
  const jsonStart = rawMessage.indexOf('{')
  const candidate = jsonStart === -1 ? rawMessage : rawMessage.slice(jsonStart)
  try {
    const parsed = JSON.parse(candidate)
    if (parsed && typeof parsed.kind === 'string' && typeof parsed.message === 'string') {
      return parsed as AppError
    }
  } catch {
    // сообщение не в нашем формате — например, ошибка самого IPC-транспорта
  }
  return { kind: 'unknown', message: rawMessage }
}

// ---------------------------------------------------------------------------
// IPC-контракты
// ---------------------------------------------------------------------------

export const IPC_CHANNELS = {
  AUTH_STATUS: 'auth:status',
  LOGIN: 'auth:login',
  LOGOUT: 'auth:logout',
  GET_HOME_INFO: 'home:get-info',
  SET_DEVICE_CAPABILITY: 'device:set-capability',
  SET_GROUP_CAPABILITY: 'group:set-capability',
  RUN_SCENARIO: 'scenario:run',
  NOTIFY: 'app:notify',
  SET_LANGUAGE: 'app:set-language',
  TRAY_SYNC: 'tray:sync',
  TRAY_ACTION_PERFORMED: 'tray:action-performed',
  GET_PROFILE: 'auth:get-profile',
  UPDATE_AVAILABLE: 'app:update-available'
} as const

export interface NotifyPayload {
  title: string
  body: string
  /** 'critical' используется для событий, требующих внимания (потеря сессии, долгая недоступность) */
  urgency?: 'normal' | 'critical'
}

/** Язык интерфейса — используется и рендерером (i18n), и main-процессом (текст нативных уведомлений) */
export type Lang = 'ru' | 'en'

/**
 * Элемент списка «последних действий» в меню трея — устройство/группа,
 * у которых недавно переключали on_off, либо запущенный сценарий. Main
 * хранит и показывает их независимо от того, открыто ли главное окно.
 * У сценариев нет on/off-состояния, поэтому `isOn` присутствует только
 * для kind 'device' | 'group'.
 */
export interface TrayMruItem {
  id: string
  kind: 'device' | 'group' | 'scenario'
  name: string
  isOn?: boolean
  /** Эмодзи-иконка сценария из Yandex API (см. Scenario['icon']) — только для kind 'scenario' */
  icon?: string
}

/**
 * Базовая идентификация аккаунта Яндекса (login.yandex.ru/info). Без scope на
 * логин/аватар доступны только `login`/`id` — ни отображаемого имени, ни
 * фото тут не будет, только показать «вы вошли как …».
 */
export interface YandexProfile {
  login: string
  id: string
}

/** Есть более новый релиз на GitHub, чем текущая версия приложения */
export interface UpdateAvailableInfo {
  version: string
  url: string
}

/** Типизированный API, который preload прокидывает в renderer через window.api */
export interface RendererApi {
  authStatus(): Promise<boolean>
  login(): Promise<boolean>
  logout(): Promise<void>
  /** Кто залогинен — для профиля в шапке. null, если недоступно (нет прав/сети — не критично) */
  getProfile(): Promise<YandexProfile | null>
  getHomeInfo(): Promise<HomeInfo>
  setDeviceCapability(deviceId: string, action: CapabilityActionRequest): Promise<ActionResult>
  setGroupCapability(groupId: string, action: CapabilityActionRequest): Promise<ActionResult>
  runScenario(scenarioId: string): Promise<void>
  /** Нативное системное уведомление ОС (Electron Notification) */
  notify(payload: NotifyPayload): Promise<void>
  /** Сообщает main-процессу текущий язык UI — используется для текста нативных уведомлений, инициированных самим main (например, истечение сессии) */
  setLanguage(lang: Lang): Promise<void>
  /** Обновляет список «последних действий» в контекстном меню трея */
  syncTrayMenu(items: TrayMruItem[]): Promise<void>
  /** Срабатывает, когда пользователь переключил устройство/группу прямо из трея — сигнал обновить UI пораньше, не дожидаясь опроса */
  onTrayAction(callback: () => void): () => void
  /** Срабатывает один раз при старте, если на GitHub есть релиз новее текущей версии */
  onUpdateAvailable(callback: (info: UpdateAvailableInfo) => void): () => void
}

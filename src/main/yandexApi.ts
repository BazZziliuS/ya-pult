import { ApiError, type CapabilityActionRequest, type Device, type HomeInfo, type YandexProfile } from '@shared/types'

const API_BASE = 'https://api.iot.yandex.net/v1.0'

/**
 * Отдельный хост Яндекс ID (не api.iot.yandex.net) — базовая идентификация
 * работает с любым валидным токеном независимо от выданных прав (iot:view/
 * iot:control достаточно, отдельный scope на логин/аватар не нужен).
 * Схема авторизации у этого API — "OAuth <token>", а не "Bearer <token>".
 */
const PROFILE_URL = 'https://login.yandex.ru/info?format=json'

/**
 * Клиентский таймаут HTTP-запроса. Не путать с 3-секундным лимитом обработки
 * навыка на стороне Яндекса (см. README) — это ограничение относится к тому,
 * сколько Яндекс ждёт устройство/облако производителя, а не к тайм-ауту
 * нашего HTTP-клиента к api.iot.yandex.net.
 */
const REQUEST_TIMEOUT_MS = 10_000

interface RawActionsResponse {
  status: string
  devices?: {
    id: string
    capabilities: {
      type: string
      state: {
        instance: string
        action_result: { status: string; error_code?: string; error_message?: string }
      }
    }[]
  }[]
}

export class YandexIotApi {
  constructor(private getAccessToken: () => string | null) {}

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const token = this.getAccessToken()
    if (!token) {
      throw new ApiError('auth', 'Нет токена доступа — требуется вход через Яндекс ID')
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

    let response: Response
    try {
      response = await fetch(`${API_BASE}${path}`, {
        ...init,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...init?.headers
        },
        signal: controller.signal
      })
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        throw new ApiError('timeout', 'Превышено время ожидания ответа от api.iot.yandex.net')
      }
      throw new ApiError('network', `Не удалось соединиться с api.iot.yandex.net: ${(err as Error).message}`)
    } finally {
      clearTimeout(timeout)
    }

    if (response.status === 401) {
      throw new ApiError('auth', 'Токен недействителен или истёк', 401)
    }

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      throw new ApiError('api', `Ошибка API (${response.status}): ${text.slice(0, 300)}`, response.status)
    }

    if (response.status === 204) return undefined as T
    return (await response.json()) as T
  }

  async getUserInfo(): Promise<HomeInfo> {
    return this.request<HomeInfo>('/user/info')
  }

  async getDevice(deviceId: string): Promise<Device> {
    return this.request<Device>(`/devices/${encodeURIComponent(deviceId)}`)
  }

  async sendDeviceAction(deviceId: string, action: CapabilityActionRequest): Promise<RawActionsResponse> {
    return this.request<RawActionsResponse>('/devices/actions', {
      method: 'POST',
      body: JSON.stringify({
        devices: [{ id: deviceId, actions: [action] }]
      })
    })
  }

  async sendGroupAction(groupId: string, action: CapabilityActionRequest): Promise<RawActionsResponse> {
    // Реальный путь — /groups/{id}/actions, а не /devices/groups/{id}/actions
    // (последний возвращает 404, хотя именно так он описан в документации).
    // Проверено прямым запросом к api.iot.yandex.net.
    return this.request<RawActionsResponse>(`/groups/${encodeURIComponent(groupId)}/actions`, {
      method: 'POST',
      body: JSON.stringify({ actions: [action] })
    })
  }

  async runScenario(scenarioId: string): Promise<void> {
    try {
      await this.request<void>(`/scenarios/${encodeURIComponent(scenarioId)}/actions`, {
        method: 'POST',
        body: ''
      })
    } catch (err) {
      // Яндекс отдаёт 400 "scenario is not active", когда сценарий выключен
      // тумблером в приложении «Дом с Алисой» — это не сбой сети/авторизации,
      // отдельный kind нужен, чтобы renderer показал понятную причину, а не сырой JSON.
      if (err instanceof ApiError && err.httpStatus === 400 && /scenario is not active/i.test(err.message)) {
        throw new ApiError('scenarioInactive', err.message, 400)
      }
      throw err
    }
  }

  /**
   * Кто залогинен — показать в шапке вместо голой кнопки «Выйти». Не критичная
   * функция (просто подпись в UI), поэтому не бросает ApiError — при любой
   * проблеме тихо возвращает null, и UI просто не покажет логин.
   */
  async getProfile(): Promise<YandexProfile | null> {
    const token = this.getAccessToken()
    if (!token) return null

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
    try {
      const response = await fetch(PROFILE_URL, {
        headers: { Authorization: `OAuth ${token}` },
        signal: controller.signal
      })
      if (!response.ok) return null
      const data = (await response.json()) as { login?: string; id?: string }
      if (!data.login) return null
      return { login: data.login, id: data.id ?? '' }
    } catch {
      return null
    } finally {
      clearTimeout(timeout)
    }
  }
}

export type { RawActionsResponse }

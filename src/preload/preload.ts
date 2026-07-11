import { contextBridge, ipcRenderer } from 'electron'
import {
  IPC_CHANNELS,
  type ActionResult,
  type CapabilityActionRequest,
  type HomeInfo,
  type Lang,
  type NotifyPayload,
  type RendererApi,
  type TrayMruItem,
  type UpdateAvailableInfo,
  type YandexProfile
} from '@shared/types'

const api: RendererApi = {
  authStatus: () => ipcRenderer.invoke(IPC_CHANNELS.AUTH_STATUS),
  login: () => ipcRenderer.invoke(IPC_CHANNELS.LOGIN),
  logout: () => ipcRenderer.invoke(IPC_CHANNELS.LOGOUT),
  getProfile: (): Promise<YandexProfile | null> => ipcRenderer.invoke(IPC_CHANNELS.GET_PROFILE),
  getHomeInfo: (): Promise<HomeInfo> => ipcRenderer.invoke(IPC_CHANNELS.GET_HOME_INFO),
  setDeviceCapability: (deviceId: string, action: CapabilityActionRequest): Promise<ActionResult> =>
    ipcRenderer.invoke(IPC_CHANNELS.SET_DEVICE_CAPABILITY, deviceId, action),
  setGroupCapability: (groupId: string, action: CapabilityActionRequest): Promise<ActionResult> =>
    ipcRenderer.invoke(IPC_CHANNELS.SET_GROUP_CAPABILITY, groupId, action),
  runScenario: (scenarioId: string): Promise<void> => ipcRenderer.invoke(IPC_CHANNELS.RUN_SCENARIO, scenarioId),
  notify: (payload: NotifyPayload): Promise<void> => ipcRenderer.invoke(IPC_CHANNELS.NOTIFY, payload),
  setLanguage: (lang: Lang): Promise<void> => ipcRenderer.invoke(IPC_CHANNELS.SET_LANGUAGE, lang),
  syncTrayMenu: (items: TrayMruItem[]): Promise<void> => ipcRenderer.invoke(IPC_CHANNELS.TRAY_SYNC, items),
  onTrayAction: (callback: () => void): (() => void) => {
    const listener = (): void => callback()
    ipcRenderer.on(IPC_CHANNELS.TRAY_ACTION_PERFORMED, listener)
    return () => ipcRenderer.removeListener(IPC_CHANNELS.TRAY_ACTION_PERFORMED, listener)
  },
  onUpdateAvailable: (callback: (info: UpdateAvailableInfo) => void): (() => void) => {
    const listener = (_event: unknown, info: UpdateAvailableInfo): void => callback(info)
    ipcRenderer.on(IPC_CHANNELS.UPDATE_AVAILABLE, listener)
    return () => ipcRenderer.removeListener(IPC_CHANNELS.UPDATE_AVAILABLE, listener)
  }
}

contextBridge.exposeInMainWorld('api', api)

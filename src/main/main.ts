import { app, BrowserWindow, nativeImage, shell } from 'electron'
import { join } from 'node:path'
import { IPC_CHANNELS, type Lang, type UpdateAvailableInfo } from '@shared/types'
import { isTokenValid, loadToken, type StoredToken } from './tokenStore'
import { YandexIotApi } from './yandexApi'
import { AppTray } from './tray'
import { TRAY_ICON_DATA_URL } from './tray/icon'
import { checkForUpdate } from './updateCheck'
import { notifyUser } from './notifications'
import { createIpcController } from './ipc'

// Тот же силуэт домика, что и в трее — иначе иконка окна/таскбара молча
// остаётся дефолтной иконкой Electron: electron-builder встраивает build/icon.png
// в .exe только при упаковке (dist:win), а в dev-режиме и в самом BrowserWindow
// (таскбар, заголовок окна) без явного `icon` он не используется вовсе.
const APP_ICON = nativeImage.createFromDataURL(TRAY_ICON_DATA_URL)

let mainWindow: BrowserWindow | null = null
let currentToken: StoredToken | null = null
let currentLang: Lang = 'ru'
let isQuitting = false
let appTray: AppTray | null = null
let pendingUpdateInfo: UpdateAvailableInfo | null = null

const api = new YandexIotApi(() => (isTokenValid(currentToken) ? currentToken.accessToken : null))

const { registerIpcHandlers, performTrayToggle, performTrayScenario } = createIpcController({
  api,
  getMainWindow: () => mainWindow,
  getToken: () => currentToken,
  setToken: (token) => {
    currentToken = token
  },
  getLang: () => currentLang,
  setLang: (lang) => {
    currentLang = lang
  },
  getTray: () => appTray
})

function createMainWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#0d0d10',
    autoHideMenuBar: true,
    icon: APP_ICON,
    webPreferences: {
      preload: join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url)
    return { action: 'deny' }
  })

  // did-finish-load, а не сразу после создания окна — иначе если проверка
  // обновления на GitHub успела ответить раньше, чем renderer навесил свой
  // слушатель onUpdateAvailable, событие уйдёт в пустоту.
  mainWindow.webContents.on('did-finish-load', sendPendingUpdateInfo)

  // Закрытие окна сворачивает в трей вместо выхода из приложения — иначе
  // от трея не было бы толку (некуда «сворачиваться»). Реальный выход —
  // через пункт «Выход» в меню трея, который выставляет isQuitting.
  mainWindow.on('close', (event) => {
    if (isQuitting) return
    event.preventDefault()
    mainWindow?.hide()
  })

  const devServerUrl = process.env['ELECTRON_RENDERER_URL']
  if (devServerUrl) {
    void loadDevServerWithRetry(mainWindow, devServerUrl)
  } else {
    void mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function showMainWindow(): void {
  if (!mainWindow || mainWindow.isDestroyed()) {
    createMainWindow()
    return
  }
  mainWindow.show()
  mainWindow.focus()
}

function sendPendingUpdateInfo(): void {
  if (pendingUpdateInfo && mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(IPC_CHANNELS.UPDATE_AVAILABLE, pendingUpdateInfo)
  }
}

/**
 * На первом запуске `electron-vite dev` окно иногда успевает попытаться
 * подключиться раньше, чем dev-сервер Vite реально начал слушать порт
 * (особенно пока прогревается pre-bundling тяжёлых зависимостей вроде
 * @heroui/react/framer-motion) — тогда loadURL падает с ERR_CONNECTION_REFUSED.
 * Ретраим вместо того, чтобы просто показать пустое окно.
 */
async function loadDevServerWithRetry(win: BrowserWindow, url: string, attempt = 0): Promise<void> {
  const MAX_ATTEMPTS = 30
  const RETRY_DELAY_MS = 300
  try {
    await win.loadURL(url)
  } catch (err) {
    if (win.isDestroyed()) return
    if (attempt >= MAX_ATTEMPTS) {
      console.error(`Не удалось подключиться к dev-серверу ${url} после ${MAX_ATTEMPTS} попыток`, err)
      return
    }
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS))
    return loadDevServerWithRetry(win, url, attempt + 1)
  }
}

app.whenReady().then(() => {
  currentToken = loadToken()
  registerIpcHandlers()
  createMainWindow()

  appTray = new AppTray({
    showWindow: showMainWindow,
    quitApp: () => {
      isQuitting = true
      app.quit()
    },
    performToggle: performTrayToggle,
    performScenario: performTrayScenario,
    notifyError: (title, body) => notifyUser({ title, body, urgency: 'normal' }),
    getLang: () => currentLang,
    onActionPerformed: () => mainWindow?.webContents.send(IPC_CHANNELS.TRAY_ACTION_PERFORMED)
  })
  appTray.init()

  // Разовая проверка версии на GitHub — не блокирует старт, результат (если
  // есть) уйдёт в renderer, как только у него будет навешан слушатель.
  void checkForUpdate(app.getVersion()).then((info) => {
    pendingUpdateInfo = info
    sendPendingUpdateInfo()
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
    else showMainWindow()
  })
})

app.on('before-quit', () => {
  isQuitting = true
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

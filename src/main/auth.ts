import { BrowserWindow } from 'electron'
import type { StoredToken } from './tokenStore'

const YANDEX_OAUTH_URL = 'https://oauth.yandex.ru/authorize'
const OAUTH_SCOPE = 'iot:view iot:control'

/**
 * Redirect URI, который Яндекс подставляет по умолчанию и не даёт изменить
 * для части приложений (поле "Redirect URI для веб-сервисов" бывает
 * заблокировано). Эта страница показывает access_token пользователю текстом
 * для ручного копирования — но нам ручной ввод не нужен: наше окно
 * авторизации перехватывает токен из адреса ДО того, как страница успевает
 * отрисоваться (см. openAuthWindow).
 */
const DEFAULT_REDIRECT_URI = 'https://oauth.yandex.ru/verification_code'

interface AuthConfig {
  clientId: string
  redirectUri: string
}

function readEnvConfig(): AuthConfig {
  const clientId = import.meta.env.MAIN_VITE_YANDEX_CLIENT_ID ?? process.env.YANDEX_CLIENT_ID
  const redirectUri =
    import.meta.env.MAIN_VITE_YANDEX_REDIRECT_URI ?? process.env.YANDEX_REDIRECT_URI ?? DEFAULT_REDIRECT_URI

  if (!clientId) {
    throw new Error(
      'YANDEX_CLIENT_ID не задан. Скопируйте .env.example в .env и укажите client_id, полученный на oauth.yandex.ru (см. README).'
    )
  }
  return { clientId, redirectUri }
}

function buildAuthUrl(config: AuthConfig): string {
  const url = new URL(YANDEX_OAUTH_URL)
  url.searchParams.set('response_type', 'token')
  url.searchParams.set('client_id', config.clientId)
  url.searchParams.set('redirect_uri', config.redirectUri)
  url.searchParams.set('scope', OAUTH_SCOPE)
  url.searchParams.set('force_confirm', 'yes')
  return url.toString()
}

/**
 * Парсит access_token/expires_in из фрагмента (#...) redirect_uri.
 * Implicit flow Яндекса кладёт параметры именно во фрагмент URL, а не в query.
 */
function parseTokenFromRedirect(redirectedUrl: string): StoredToken | null {
  const url = new URL(redirectedUrl)
  const fragment = url.hash.startsWith('#') ? url.hash.slice(1) : url.search.slice(1)
  const params = new URLSearchParams(fragment)

  const accessToken = params.get('access_token')
  const expiresIn = params.get('expires_in')
  if (!accessToken) return null

  const ttlSeconds = expiresIn ? parseInt(expiresIn, 10) : 3600
  return {
    accessToken,
    expiresAt: Date.now() + ttlSeconds * 1000
  }
}

/**
 * Открывает модальное окно OAuth-авторизации Яндекса и перехватывает токен
 * из адреса, на который в итоге попадает окно. Redirect_uri бывает двух
 * принципиально разных видов, поэтому слушаем сразу все связанные события:
 *  - `http://localhost:PORT/...` — ничего физически не слушает этот порт,
 *    навигация обрывается ошибкой соединения (см. did-fail-load); токен уже
 *    есть в адресе к этому моменту (will-redirect/will-navigate).
 *  - `https://oauth.yandex.ru/verification_code` — реальная страница Яндекса,
 *    которая успешно загружается и показывает токен пользователю текстом;
 *    ловим его из адресной строки раньше, чем пользователь успеет это увидеть
 *    (will-redirect на сервер-сайд редиректе, либо did-navigate-in-page/
 *    did-finish-load, если фрагмент подставляется JS-ом уже на странице).
 */
export function openAuthWindow(parent: BrowserWindow): Promise<StoredToken | null> {
  const config = readEnvConfig()
  const authUrl = buildAuthUrl(config)

  return new Promise((resolve) => {
    const authWindow = new BrowserWindow({
      width: 480,
      height: 700,
      parent,
      modal: true,
      show: true,
      autoHideMenuBar: true,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    })

    let settled = false
    const finish = (token: StoredToken | null): void => {
      if (settled) return
      settled = true
      resolve(token)
      if (!authWindow.isDestroyed()) authWindow.close()
    }

    const tryHandleUrl = (targetUrl: string | undefined): void => {
      if (!targetUrl || !targetUrl.startsWith(config.redirectUri)) return
      finish(parseTokenFromRedirect(targetUrl))
    }

    const { webContents } = authWindow
    webContents.on('will-redirect', (_event, url) => tryHandleUrl(url))
    webContents.on('will-navigate', (_event, url) => tryHandleUrl(url))
    webContents.on('did-navigate', (_event, url) => tryHandleUrl(url))
    webContents.on('did-navigate-in-page', (_event, url) => tryHandleUrl(url))
    webContents.on('did-finish-load', () => tryHandleUrl(webContents.getURL()))
    webContents.on('did-fail-load', (_event, _code, _desc, validatedUrl) => {
      tryHandleUrl(validatedUrl)
      if (!settled) finish(null)
    })
    authWindow.on('closed', () => finish(null))

    authWindow.loadURL(authUrl)
  })
}

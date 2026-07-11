import { app, safeStorage } from 'electron'
import { existsSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Максимальная длина access/refresh токена, гарантируемая API Яндекса.
 * https://yandex.ru/dev/dialogs/smart-home/doc/reference/
 */
const MAX_TOKEN_LENGTH = 2048

const TOKEN_FILE_NAME = 'yandex-token.bin'

interface StoredToken {
  accessToken: string
  /** Implicit flow не выдаёт refresh_token — поле зарезервировано под будущий authorization-code flow */
  refreshToken?: string
  /** unix ms, когда истекает access_token */
  expiresAt: number
}

function tokenFilePath(): string {
  return join(app.getPath('userData'), TOKEN_FILE_NAME)
}

export function saveToken(token: StoredToken): void {
  if (token.accessToken.length > MAX_TOKEN_LENGTH || (token.refreshToken?.length ?? 0) > MAX_TOKEN_LENGTH) {
    throw new Error('Токен превышает допустимую длину 2048 символов')
  }
  const json = JSON.stringify(token)
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('safeStorage недоступен в этой ОС — шифрование токена невозможно')
  }
  const encrypted = safeStorage.encryptString(json)
  writeFileSync(tokenFilePath(), encrypted)
}

export function loadToken(): StoredToken | null {
  const path = tokenFilePath()
  if (!existsSync(path)) return null
  try {
    const encrypted = readFileSync(path)
    if (!safeStorage.isEncryptionAvailable()) return null
    const json = safeStorage.decryptString(encrypted)
    return JSON.parse(json) as StoredToken
  } catch {
    // Повреждённый или нерасшифровываемый файл — считаем, что токена нет
    return null
  }
}

export function clearToken(): void {
  const path = tokenFilePath()
  if (existsSync(path)) unlinkSync(path)
}

export function isTokenValid(token: StoredToken | null): token is StoredToken {
  return token !== null && token.expiresAt > Date.now()
}

export type { StoredToken }

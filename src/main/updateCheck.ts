const REPO = 'BazZziliuS/ya-pult'
const RELEASES_API_URL = `https://api.github.com/repos/${REPO}/releases/latest`
const REQUEST_TIMEOUT_MS = 8_000

export interface UpdateInfo {
  version: string
  url: string
}

/** "v1.2.3" -> [1,2,3]; мусорные/нечисловые части считаем как 0, чтобы не падать на нестандартных тегах */
export function parseVersion(raw: string): number[] {
  const cleaned = raw.trim().replace(/^v/i, '')
  return cleaned.split('.').map((part) => parseInt(part, 10) || 0)
}

/** true, если `latest` строго новее `current` (посегментное сравнение, а не строковое — иначе "v10" < "v9") */
export function isNewer(latest: string, current: string): boolean {
  const a = parseVersion(latest)
  const b = parseVersion(current)
  const len = Math.max(a.length, b.length)
  for (let i = 0; i < len; i++) {
    const x = a[i] ?? 0
    const y = b[i] ?? 0
    if (x !== y) return x > y
  }
  return false
}

/**
 * Разовая проверка при старте — не критичная функция: любая проблема (нет
 * сети, приватный/ещё пустой репозиторий, лимит GitHub API) тихо
 * игнорируется, приложение при этом работает как обычно.
 */
export async function checkForUpdate(currentVersion: string): Promise<UpdateInfo | null> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  try {
    const response = await fetch(RELEASES_API_URL, {
      headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'ya-pult-app' },
      signal: controller.signal
    })
    if (!response.ok) return null

    const data = (await response.json()) as { tag_name?: string; html_url?: string }
    if (!data.tag_name) return null

    if (!isNewer(data.tag_name, currentVersion)) return null

    return { version: data.tag_name, url: data.html_url ?? `https://github.com/${REPO}/releases/latest` }
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}

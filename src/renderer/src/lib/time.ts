import type { Lang } from '@shared/types'

/** "только что" / "23 сек назад" / "4 мин назад" — для подсказки свежести данных в шапке */
export function formatRelativeTime(timestampMs: number, lang: Lang): string {
  const diffSec = Math.max(0, Math.round((Date.now() - timestampMs) / 1000))

  if (diffSec < 5) return lang === 'ru' ? 'только что' : 'just now'
  if (diffSec < 60) return lang === 'ru' ? `${diffSec} сек назад` : `${diffSec}s ago`

  const diffMin = Math.round(diffSec / 60)
  return lang === 'ru' ? `${diffMin} мин назад` : `${diffMin}m ago`
}

/**
 * Иконка трея (32×32 силуэт домика), встроенная как data URI прямо в код.
 * main-процесс бандлится esbuild-ом через electron-vite и не копирует
 * произвольные файлы из /build автоматически — проще и надёжнее держать
 * иконку строкой, чем городить extraResources/copy-plugin ради одной картинки.
 * Специально НЕ лежит физическим файлом в /build — electron-builder
 * автоматически подхватывает build/icon.png как иконку самого приложения
 * (.exe/установщик) и требует минимум 256×256, а не 32×32.
 */
export const TRAY_ICON_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAX0lEQVR4nO3SSwqAIBhFYfcatP9WkDQV0rr/y8G54Ew4H2hrjBl2nNf9nNJ4CWKMpyLe4imIVTwM8TUcAlHjLghr3ITwiksI7/gvRFRcfo7STwgAwAyg3gMAAABj260DZPlGwv1RbDYAAAAASUVORK5CYII='

export const TRAY_ICON_DATA_URL = `data:image/png;base64,${TRAY_ICON_BASE64}`

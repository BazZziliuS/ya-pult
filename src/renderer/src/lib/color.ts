/** hex 0xRRGGBB -> {h: 0-360, s: 0-100, v: 0-100}, формат HSV, который ожидает API Яндекса */
export function hexToHsv(hex: number): { h: number; s: number; v: number } {
  const r = ((hex >> 16) & 0xff) / 255
  const g = ((hex >> 8) & 0xff) / 255
  const b = (hex & 0xff) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const delta = max - min

  let h = 0
  if (delta !== 0) {
    if (max === r) h = 60 * (((g - b) / delta) % 6)
    else if (max === g) h = 60 * ((b - r) / delta + 2)
    else h = 60 * ((r - g) / delta + 4)
  }
  if (h < 0) h += 360

  const s = max === 0 ? 0 : delta / max
  const v = max

  return { h: Math.round(h), s: Math.round(s * 100), v: Math.round(v * 100) }
}

/** {h: 0-360, s: 0-100, v: 0-100} -> hex 0xRRGGBB, для превью выбранного цвета и отправки instance=rgb */
export function hsvToHex(h: number, s: number, v: number): number {
  const c = (v / 100) * (s / 100)
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = v / 100 - c
  let r = 0
  let g = 0
  let b = 0
  if (h < 60) [r, g, b] = [c, x, 0]
  else if (h < 120) [r, g, b] = [x, c, 0]
  else if (h < 180) [r, g, b] = [0, c, x]
  else if (h < 240) [r, g, b] = [0, x, c]
  else if (h < 300) [r, g, b] = [x, 0, c]
  else [r, g, b] = [c, 0, x]

  const toByte = (n: number): number => Math.round((n + m) * 255)
  return (toByte(r) << 16) | (toByte(g) << 8) | toByte(b)
}

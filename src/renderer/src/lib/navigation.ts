/**
 * Категория в боковом меню — сквозной фильтр того, что показывать в основной
 * области (одна категория активна одновременно, как в разделе «Боковое меню»
 * референса https://github.com/onegamerstory/Desktop-Yandex.Home-App).
 */
export type Category =
  | { type: 'room'; roomId: string }
  | { type: 'groups' }
  | { type: 'sensors' }
  | { type: 'scenarios' }

export function categoryKey(category: Category): string {
  return category.type === 'room' ? `room:${category.roomId}` : category.type
}

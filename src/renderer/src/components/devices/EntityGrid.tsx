import type { ReactNode } from 'react'

/** Общая сетка для плиток устройств/групп — переиспользуется во всех категориях сайдбара. */
export function EntityGrid({ children }: { children: ReactNode }): JSX.Element {
  return <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">{children}</div>
}

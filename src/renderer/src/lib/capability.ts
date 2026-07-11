import type { Capability, Property } from '@shared/types'

/**
 * Не индекс массива — API не гарантирует стабильный порядок capabilities
 * между опросами; ключ по индексу пересоздавал контролы (в т.ч. слайдеры)
 * при каждом обновлении, из-за чего интерфейс визуально дёргался.
 */
export function capabilityKey(capability: Capability): string {
  return `${capability.type}:${capabilityInstance(capability)}`
}

/**
 * Порядок, в котором API отдаёт capabilities/properties, не гарантирован —
 * ни между разными устройствами, ни между опросами одного и того же. Без
 * сортировки по фиксированному приоритету «Яркость» у одной лампы могла
 * оказаться первым контролом, у другой — третьим, и даже у одной и той же
 * лампы — перескакивать местами после каждого опроса. Порядок ниже
 * (питание → режим → диапазоны → цвет → тумблеры) — не значимая логика,
 * просто стабильная и предсказуемая позиция для глаза.
 */
const CAPABILITY_TYPE_ORDER: Record<string, number> = {
  'devices.capabilities.on_off': 0,
  'devices.capabilities.mode': 1,
  'devices.capabilities.range': 2,
  'devices.capabilities.color_setting': 3,
  'devices.capabilities.toggle': 4
}

const RANGE_INSTANCE_ORDER: Record<string, number> = {
  brightness: 0,
  volume: 1,
  humidity: 2,
  temperature: 3,
  channel: 4
}

function capabilityInstance(capability: Capability): string {
  return (capability.parameters as { instance?: string } | undefined)?.instance ?? capability.state?.instance ?? ''
}

export function sortCapabilities(capabilities: Capability[]): Capability[] {
  return [...capabilities].sort((a, b) => {
    const typeDiff = (CAPABILITY_TYPE_ORDER[a.type] ?? 99) - (CAPABILITY_TYPE_ORDER[b.type] ?? 99)
    if (typeDiff !== 0) return typeDiff
    if (a.type === 'devices.capabilities.range' && b.type === 'devices.capabilities.range') {
      const aOrder = RANGE_INSTANCE_ORDER[capabilityInstance(a)] ?? 99
      const bOrder = RANGE_INSTANCE_ORDER[capabilityInstance(b)] ?? 99
      if (aOrder !== bOrder) return aOrder - bOrder
    }
    return capabilityInstance(a).localeCompare(capabilityInstance(b))
  })
}

function propertyInstance(property: Property): string {
  return property.parameters?.instance ?? property.state?.instance ?? ''
}

/** Показания датчиков — фиксированный алфавитный порядок по instance, та же причина, что и у sortCapabilities. */
export function sortProperties(properties: Property[]): Property[] {
  return [...properties].sort((a, b) => propertyInstance(a).localeCompare(propertyInstance(b)))
}

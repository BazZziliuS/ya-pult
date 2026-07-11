import type { translations } from '@/i18n/translations'

type Dict = (typeof translations)['ru']

export function rangeLabel(dict: Dict, instance: string): string {
  return (dict.rangeInstance as Record<string, string>)[instance] ?? instance
}

export function modeLabel(dict: Dict, instance: string): string {
  return (dict.modeInstance as Record<string, string>)[instance] ?? instance
}

export function toggleLabel(dict: Dict, instance: string): string {
  return (dict.toggleInstance as Record<string, string>)[instance] ?? instance
}

export function propertyLabel(dict: Dict, instance: string): string {
  return (dict.propertyInstance as Record<string, string>)[instance] || modeValueLabel(instance)
}

export function modeValueLabel(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, ' ')
}

export function deviceTypeLabel(dict: Dict, type: string): string {
  return (dict.deviceType as Record<string, string>)[type] ?? dict.deviceType.fallback
}

const DEVICE_TYPE_ICONS: Record<string, string> = {
  'devices.types.light': '💡',
  'devices.types.socket': '🔌',
  'devices.types.switch': '🔘',
  'devices.types.thermostat': '🌡️',
  'devices.types.thermostat.ac': '❄️',
  'devices.types.vacuum_cleaner': '🧹',
  'devices.types.humidifier': '💧',
  'devices.types.purifier': '🌬️',
  'devices.types.pump': '⛲',
  'devices.types.pump.well': '⛲',
  'devices.types.washing_machine': '🫧',
  'devices.types.dishwasher': '🍽️',
  'devices.types.kettle': '☕',
  'devices.types.multicooker': '🍲',
  'devices.types.cooking': '🍳',
  'devices.types.cooking.coffee_maker': '☕',
  'devices.types.pet_feeder': '🐾',
  'devices.types.pet_drinking_fountain': '🐾',
  'devices.types.camera': '📷',
  'devices.types.smart_lock': '🔒',
  'devices.types.media_device': '📺',
  'devices.types.media_device.tv': '📺',
  'devices.types.media_device.tv_box': '📦',
  'devices.types.media_device.receiver': '🔊',
  'devices.types.openable': '🚪',
  'devices.types.openable.curtain': '🪟',
  'devices.types.openable.valve': '🚰',
  'devices.types.sensor': '📊',
  'devices.types.sensor.button': '🔲',
  'devices.types.sensor.climate': '🌡️',
  'devices.types.sensor.gas': '⚠️',
  'devices.types.sensor.illumination': '🔆',
  'devices.types.sensor.motion': '🚶',
  'devices.types.sensor.open': '🚪',
  'devices.types.sensor.smoke': '🔥',
  'devices.types.sensor.vibration': '📳',
  'devices.types.sensor.water_leak': '💧',
  'devices.types.other': '🏠'
}

export function deviceTypeIcon(type: string): string {
  if (DEVICE_TYPE_ICONS[type]) return DEVICE_TYPE_ICONS[type]
  // devices.types.sensor.xxx без явной иконки — падаем на иконку датчика,
  // а не на генерик "дом", чтобы новые подтипы не выглядели как ошибка
  if (type.startsWith('devices.types.sensor')) return DEVICE_TYPE_ICONS['devices.types.sensor']
  return DEVICE_TYPE_ICONS['devices.types.other']
}

export type DeviceIconColor = 'warning' | 'primary' | 'secondary' | 'success' | 'danger' | 'default'

const DEVICE_TYPE_COLORS: Record<string, DeviceIconColor> = {
  'devices.types.light': 'warning',
  'devices.types.thermostat': 'primary',
  'devices.types.thermostat.ac': 'primary',
  'devices.types.humidifier': 'primary',
  'devices.types.purifier': 'primary',
  'devices.types.pump': 'primary',
  'devices.types.pump.well': 'primary',
  'devices.types.openable': 'primary',
  'devices.types.openable.curtain': 'primary',
  'devices.types.openable.valve': 'primary',
  'devices.types.vacuum_cleaner': 'secondary',
  'devices.types.media_device': 'secondary',
  'devices.types.media_device.tv': 'secondary',
  'devices.types.media_device.tv_box': 'secondary',
  'devices.types.media_device.receiver': 'secondary',
  'devices.types.washing_machine': 'warning',
  'devices.types.dishwasher': 'warning',
  'devices.types.kettle': 'warning',
  'devices.types.multicooker': 'warning',
  'devices.types.cooking': 'warning',
  'devices.types.cooking.coffee_maker': 'warning',
  'devices.types.pet_feeder': 'success',
  'devices.types.pet_drinking_fountain': 'success',
  'devices.types.camera': 'danger',
  'devices.types.smart_lock': 'danger'
}

export function deviceTypeColor(type: string): DeviceIconColor {
  if (DEVICE_TYPE_COLORS[type]) return DEVICE_TYPE_COLORS[type]
  if (type.startsWith('devices.types.sensor')) return 'default'
  return 'default'
}

/**
 * API отдаёт единицы измерения как непрозрачные коды вида "unit.percent",
 * "unit.temperature.celsius" — их нельзя показывать пользователю как есть
 * (баг, который был в range-контролах: "1 unit.percent" вместо "1 %").
 */
function formatApiUnit(dict: Dict, apiUnit: string): string | undefined {
  const known: Record<string, string> = {
    'unit.percent': '%',
    'unit.temperature.celsius': '°C',
    'unit.ppm': 'ppm',
    'unit.density.mcg_m3': 'µg/m³',
    'unit.pressure.mmhg': dict.unit.mmHg,
    'unit.illumination.lux': dict.unit.lux
  }
  return known[apiUnit]
}

export function propertyUnit(dict: Dict, instance: string, apiUnit?: string): string {
  const formatted = apiUnit ? formatApiUnit(dict, apiUnit) : undefined
  if (formatted) return formatted

  const fallback: Record<string, string> = {
    temperature: '°C',
    humidity: '%',
    co2_level: 'ppm',
    'pm2.5_density': 'µg/m³',
    pm10_density: 'µg/m³',
    water_level: '%',
    battery_level: '%',
    pressure: dict.unit.mmHg,
    illumination: dict.unit.lux
  }
  return fallback[instance] ?? ''
}

export function rangeUnit(dict: Dict, instance: string, apiUnit?: string): string {
  const formatted = apiUnit ? formatApiUnit(dict, apiUnit) : undefined
  if (formatted) return formatted

  const fallback: Record<string, string> = {
    brightness: '%',
    volume: '%',
    humidity: '%',
    temperature: '°C'
  }
  return fallback[instance] ?? ''
}

/** Русское склонение "устройство/устройства/устройств" по числу (для английского one/few/many совпадают) */
export function deviceCountWord(dict: Dict, count: number): string {
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod10 === 1 && mod100 !== 11) return dict.groups.deviceWordOne
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return dict.groups.deviceWordFew
  return dict.groups.deviceWordMany
}

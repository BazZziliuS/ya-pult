import { describe, expect, it } from 'vitest'
import { translations } from '@/i18n/translations'
import { deviceCountWord, deviceTypeColor, deviceTypeIcon, propertyUnit, rangeUnit } from '@/lib/labels'

const ru = translations.ru

describe('deviceTypeIcon', () => {
  it('возвращает иконку из явной карты для известного типа', () => {
    expect(deviceTypeIcon('devices.types.light')).toBe('💡')
  })

  it('для неизвестного подтипа sensor.* падает на иконку датчика, а не на generic', () => {
    expect(deviceTypeIcon('devices.types.sensor.unknown_new_type')).toBe(deviceTypeIcon('devices.types.sensor'))
  })

  it('для совсем неизвестного типа возвращает generic-иконку "other"', () => {
    expect(deviceTypeIcon('devices.types.something_brand_new')).toBe(deviceTypeIcon('devices.types.other'))
  })
})

describe('deviceTypeColor', () => {
  it('известный тип возвращает свой цвет', () => {
    expect(deviceTypeColor('devices.types.light')).toBe('warning')
  })

  it('неизвестный тип возвращает default', () => {
    expect(deviceTypeColor('devices.types.something_brand_new')).toBe('default')
  })
})

describe('propertyUnit / rangeUnit — коды unit.* из API переводятся в человекочитаемые единицы', () => {
  it('unit.percent -> %, а не остаётся сырым кодом (регрессия на реальный баг)', () => {
    expect(propertyUnit(ru, 'humidity', 'unit.percent')).toBe('%')
    expect(rangeUnit(ru, 'brightness', 'unit.percent')).toBe('%')
  })

  it('unit.temperature.celsius -> °C', () => {
    expect(propertyUnit(ru, 'temperature', 'unit.temperature.celsius')).toBe('°C')
  })

  it('без apiUnit — откатывается на фоллбек по instance', () => {
    expect(propertyUnit(ru, 'battery_level', undefined)).toBe('%')
    expect(rangeUnit(ru, 'volume', undefined)).toBe('%')
  })

  it('неизвестный instance без apiUnit — пустая строка, а не мусор', () => {
    expect(propertyUnit(ru, 'unknown_instance', undefined)).toBe('')
  })
})

describe('deviceCountWord — русское склонение по числу', () => {
  it('1, 21, 101 -> "устройство"', () => {
    expect(deviceCountWord(ru, 1)).toBe(ru.groups.deviceWordOne)
    expect(deviceCountWord(ru, 21)).toBe(ru.groups.deviceWordOne)
    expect(deviceCountWord(ru, 101)).toBe(ru.groups.deviceWordOne)
  })

  it('2, 3, 4, 22 -> "устройства"', () => {
    expect(deviceCountWord(ru, 2)).toBe(ru.groups.deviceWordFew)
    expect(deviceCountWord(ru, 4)).toBe(ru.groups.deviceWordFew)
    expect(deviceCountWord(ru, 22)).toBe(ru.groups.deviceWordFew)
  })

  it('0, 5, 11, 12, 14, 20 -> "устройств" (в т.ч. 11-14 — исключение из общего правила)', () => {
    expect(deviceCountWord(ru, 0)).toBe(ru.groups.deviceWordMany)
    expect(deviceCountWord(ru, 5)).toBe(ru.groups.deviceWordMany)
    expect(deviceCountWord(ru, 11)).toBe(ru.groups.deviceWordMany)
    expect(deviceCountWord(ru, 12)).toBe(ru.groups.deviceWordMany)
    expect(deviceCountWord(ru, 14)).toBe(ru.groups.deviceWordMany)
    expect(deviceCountWord(ru, 20)).toBe(ru.groups.deviceWordMany)
  })
})

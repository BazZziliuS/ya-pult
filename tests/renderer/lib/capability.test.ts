import { describe, expect, it } from 'vitest'
import type { Capability, Property } from '@shared/types'
import { capabilityKey, sortCapabilities, sortProperties } from '@/lib/capability'

function onOff(): Capability {
  return { type: 'devices.capabilities.on_off', retrievable: true, state: { instance: 'on', value: true } }
}

function range(instance: string): Capability {
  return {
    type: 'devices.capabilities.range',
    retrievable: true,
    parameters: { instance } as never,
    state: { instance, value: 50 } as never
  }
}

function colorSetting(): Capability {
  return { type: 'devices.capabilities.color_setting', retrievable: true }
}

function mode(): Capability {
  return {
    type: 'devices.capabilities.mode',
    retrievable: true,
    parameters: { instance: 'program', modes: [] },
    state: { instance: 'program', value: 'eco' }
  }
}

function toggle(instance: string): Capability {
  return { type: 'devices.capabilities.toggle', retrievable: true, parameters: { instance } }
}

describe('sortCapabilities', () => {
  it('сортирует по фиксированному приоритету типа: power -> mode -> range -> color -> toggle', () => {
    const shuffled = [toggle('mute'), colorSetting(), range('brightness'), mode(), onOff()]
    const sorted = sortCapabilities(shuffled)
    expect(sorted.map((c) => c.type)).toEqual([
      'devices.capabilities.on_off',
      'devices.capabilities.mode',
      'devices.capabilities.range',
      'devices.capabilities.color_setting',
      'devices.capabilities.toggle'
    ])
  })

  it('внутри range сортирует по приоритету instance (brightness -> volume -> humidity -> temperature)', () => {
    const shuffled = [range('temperature'), range('volume'), range('brightness'), range('humidity')]
    const sorted = sortCapabilities(shuffled)
    expect(sorted.map((c) => (c.parameters as { instance: string }).instance)).toEqual([
      'brightness',
      'volume',
      'humidity',
      'temperature'
    ])
  })

  it('не мутирует исходный массив', () => {
    const original = [toggle('mute'), onOff()]
    const copy = [...original]
    sortCapabilities(original)
    expect(original).toEqual(copy)
  })

  it('порядок стабилен между повторными вызовами на одинаковых по составу, но по-разному перемешанных данных', () => {
    const a = [toggle('mute'), range('brightness'), onOff()]
    const b = [onOff(), toggle('mute'), range('brightness')]
    expect(sortCapabilities(a).map(capabilityKey)).toEqual(sortCapabilities(b).map(capabilityKey))
  })
})

describe('capabilityKey', () => {
  it('строится из типа и instance, а не из индекса массива', () => {
    expect(capabilityKey(range('brightness'))).toBe('devices.capabilities.range:brightness')
    expect(capabilityKey(onOff())).toBe('devices.capabilities.on_off:on')
  })
})

describe('sortProperties', () => {
  it('сортирует показания датчиков по алфавиту instance', () => {
    const properties: Property[] = [
      { type: 'devices.properties.float', retrievable: true, parameters: { instance: 'temperature' } },
      { type: 'devices.properties.float', retrievable: true, parameters: { instance: 'battery_level' } },
      { type: 'devices.properties.float', retrievable: true, parameters: { instance: 'humidity' } }
    ]
    expect(sortProperties(properties).map((p) => p.parameters?.instance)).toEqual([
      'battery_level',
      'humidity',
      'temperature'
    ])
  })
})

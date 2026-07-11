import { Select, SelectItem, Slider, Switch } from '@heroui/react'
import type {
  Capability,
  CapabilityActionRequest,
  ColorSettingCapabilityParameters,
  ModeCapabilityParameters,
  RangeCapabilityParameters,
  ToggleCapabilityParameters
} from '@shared/types'
import { modeLabel, modeValueLabel, rangeLabel, rangeUnit, toggleLabel } from '@/lib/labels'
import { hexToHsv, hsvToHex } from '@/lib/color'
import { useI18n } from '@/i18n/I18nContext'
import { useOptimisticValue } from '@/hooks/useOptimisticValue'

interface CapabilityControlProps {
  capability: Capability
  /**
   * Жёсткая блокировка — только для реально недоступного устройства
   * (offline). Пока ждём ответ на конкретное действие, контролы НЕ
   * блокируются: значение уже обновилось оптимистично, а откатится само,
   * если сервер вернёт ошибку (см. useOptimisticValue) — блокировать весь
   * modal на время запроса означало бы «зависание» при каждом клике.
   */
  disabled: boolean
  /** true — сервер подтвердил; false — контрол должен откатить своё оптимистичное значение */
  onAction: (action: CapabilityActionRequest) => Promise<boolean>
}

const PRESET_COLORS: { nameKey: string; hex: number }[] = [
  { nameKey: 'warmWhite', hex: 0xffdca8 },
  { nameKey: 'coolWhite', hex: 0xf5f8ff },
  { nameKey: 'red', hex: 0xff3b30 },
  { nameKey: 'orange', hex: 0xff9500 },
  { nameKey: 'yellow', hex: 0xffcc00 },
  { nameKey: 'green', hex: 0x34c759 },
  { nameKey: 'cyan', hex: 0x32ade6 },
  { nameKey: 'blue', hex: 0x007aff },
  { nameKey: 'purple', hex: 0xaf52de },
  { nameKey: 'pink', hex: 0xff2d55 }
]

function OnOffControl({ capability, disabled, onAction }: CapabilityControlProps): JSX.Element {
  const { t } = useI18n()
  const externalValue = capability.state && capability.state.instance === 'on' ? (capability.state.value as boolean) : false
  const { value, commit, rollback } = useOptimisticValue(externalValue)

  const handleChange = async (next: boolean): Promise<void> => {
    const token = commit(next)
    const ok = await onAction({ type: 'devices.capabilities.on_off', state: { instance: 'on', value: next } })
    if (!ok) rollback(token)
  }

  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm text-default-500">{t('device.power')}</span>
      <Switch isSelected={value} isDisabled={disabled} onValueChange={(next) => void handleChange(next)} />
    </div>
  )
}

function ToggleControl({ capability, disabled, onAction }: CapabilityControlProps): JSX.Element {
  const { dict } = useI18n()
  const params = capability.parameters as ToggleCapabilityParameters | undefined
  const instance = params?.instance ?? 'backlight'
  const externalValue = capability.state && capability.state.instance === instance ? (capability.state.value as boolean) : false
  const { value, commit, rollback } = useOptimisticValue(externalValue)

  const handleChange = async (next: boolean): Promise<void> => {
    const token = commit(next)
    const ok = await onAction({ type: 'devices.capabilities.toggle', state: { instance, value: next } })
    if (!ok) rollback(token)
  }

  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm text-default-500">{toggleLabel(dict, instance)}</span>
      <Switch isSelected={value} isDisabled={disabled} onValueChange={(next) => void handleChange(next)} />
    </div>
  )
}

function RangeControl({ capability, disabled, onAction }: CapabilityControlProps): JSX.Element {
  const { dict } = useI18n()
  const params = (capability.parameters as RangeCapabilityParameters | undefined) ?? { instance: 'brightness' }
  const range = params.range ?? { min: 0, max: 100, precision: 1 }
  const externalValue =
    capability.state && capability.state.instance === params.instance ? (capability.state.value as number) : range.min
  const { value, setValue, commit, rollback } = useOptimisticValue(externalValue)

  const handleChangeEnd = async (next: number | number[]): Promise<void> => {
    const nextValue = Array.isArray(next) ? next[0] : next
    const token = commit(nextValue)
    const ok = await onAction({ type: 'devices.capabilities.range', state: { instance: params.instance, value: nextValue } })
    if (!ok) rollback(token)
  }

  return (
    <div className="py-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-default-500">{rangeLabel(dict, params.instance)}</span>
        <span className="text-sm text-default-400 tabular-nums">
          {value}
          {rangeUnit(dict, params.instance, params.unit) && ` ${rangeUnit(dict, params.instance, params.unit)}`}
        </span>
      </div>
      <Slider
        size="sm"
        minValue={range.min}
        maxValue={range.max}
        step={range.precision || 1}
        value={value}
        isDisabled={disabled}
        onChange={(next) => setValue(Array.isArray(next) ? next[0] : next)}
        onChangeEnd={(next) => void handleChangeEnd(next)}
      />
    </div>
  )
}

function ModeControl({ capability, disabled, onAction }: CapabilityControlProps): JSX.Element | null {
  const { dict } = useI18n()
  const params = capability.parameters as ModeCapabilityParameters | undefined
  const externalValue =
    params && capability.state && capability.state.instance === params.instance ? (capability.state.value as string) : undefined
  // Хук вызываем безусловно (до return null) — иначе порядок хуков между
  // рендерами ломается, если params вдруг пропадёт.
  const { value, commit, rollback } = useOptimisticValue(externalValue)
  if (!params) return null

  const handleChange = async (next: string): Promise<void> => {
    const token = commit(next)
    const ok = await onAction({ type: 'devices.capabilities.mode', state: { instance: params.instance, value: next } })
    if (!ok) rollback(token)
  }

  return (
    <div className="py-2">
      <Select
        size="sm"
        label={modeLabel(dict, params.instance)}
        selectedKeys={value ? [value] : []}
        isDisabled={disabled}
        onSelectionChange={(keys) => {
          const next = Array.from(keys)[0]
          if (typeof next === 'string') void handleChange(next)
        }}
      >
        {params.modes.map((mode) => (
          <SelectItem key={mode.value}>{mode.name ?? modeValueLabel(mode.value)}</SelectItem>
        ))}
      </Select>
    </div>
  )
}

function ColorTemperatureSlider({
  min,
  max,
  capability,
  disabled,
  onAction
}: {
  min: number
  max: number
  capability: Capability
  disabled: boolean
  onAction: (action: CapabilityActionRequest) => Promise<boolean>
}): JSX.Element {
  const { t } = useI18n()
  const externalValue =
    capability.state && capability.state.instance === 'temperature_k'
      ? (capability.state.value as number)
      : Math.round((min + max) / 2)
  const { value, setValue, commit, rollback } = useOptimisticValue(externalValue)

  const sendTemperature = async (k: number): Promise<void> => {
    const token = commit(k)
    const ok = await onAction({ type: 'devices.capabilities.color_setting', state: { instance: 'temperature_k', value: k } })
    if (!ok) rollback(token)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-default-500">{t('device.lightTemperature')}</span>
        <span className="text-sm text-default-400 tabular-nums">{value}K</span>
      </div>
      {/* После выбора яркого цвета (Hue-слайдер/пресеты) единственный явный
          способ вернуться к белому свету — эти кнопки: шлют реальный
          instance=temperature_k, который на устройстве переключает режим
          с цветного обратно на нативный тёплый/холодный белый. */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          title={t('device.warm')}
          aria-label={t('device.warm')}
          disabled={disabled}
          className="shrink-0 text-base leading-none disabled:opacity-40"
          onClick={() => void sendTemperature(min)}
        >
          🕯️
        </button>
        <Slider
          size="sm"
          className="flex-1"
          minValue={min}
          maxValue={max}
          step={100}
          value={value}
          isDisabled={disabled}
          onChange={(next) => setValue(Array.isArray(next) ? next[0] : next)}
          onChangeEnd={(next) => void sendTemperature(Array.isArray(next) ? next[0] : next)}
        />
        <button
          type="button"
          title={t('device.cool')}
          aria-label={t('device.cool')}
          disabled={disabled}
          className="shrink-0 text-base leading-none disabled:opacity-40"
          onClick={() => void sendTemperature(max)}
        >
          ❄️
        </button>
      </div>
    </div>
  )
}

/**
 * Пресеты покрывают только 10 фиксированных цветов — по просьбе добавляем
 * слайдер оттенка (0–360°) на полной насыщенности, чтобы можно было выбрать
 * произвольный цвет. HeroUI не даёт готового цветового пикера, поэтому это
 * обычный <input type="range"> с CSS-радугой (см. index.css/.hue-slider).
 */
function HueSlider({
  capability,
  colorModel,
  disabled,
  onAction
}: {
  capability: Capability
  colorModel: 'rgb' | 'hsv'
  disabled: boolean
  onAction: (action: CapabilityActionRequest) => Promise<boolean>
}): JSX.Element {
  const { t } = useI18n()

  const externalHue = (() => {
    if (capability.state?.instance === 'hsv') return (capability.state.value as { h: number }).h
    if (capability.state?.instance === 'rgb') return hexToHsv(capability.state.value as number).h
    return 0
  })()

  const { value: hue, setValue: setHue, commit, rollback } = useOptimisticValue(externalHue)
  const previewHex = hsvToHex(hue, 100, 100).toString(16).padStart(6, '0')

  const sendHue = async (h: number, token: number): Promise<void> => {
    const action: CapabilityActionRequest =
      colorModel === 'hsv'
        ? { type: 'devices.capabilities.color_setting', state: { instance: 'hsv', value: { h, s: 100, v: 100 } } }
        : { type: 'devices.capabilities.color_setting', state: { instance: 'rgb', value: hsvToHex(h, 100, 100) } }
    const ok = await onAction(action)
    if (!ok) rollback(token)
  }

  const commitFromEvent = (e: { target: EventTarget | null }): void => {
    const input = e.target as HTMLInputElement
    const h = Number(input.value)
    void sendHue(h, commit(h))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-default-500">{t('device.color')}</span>
        <span
          className="w-4 h-4 rounded-full border border-default-300"
          style={{ backgroundColor: `#${previewHex}` }}
          aria-hidden
        />
      </div>
      <input
        type="range"
        className="hue-slider"
        min={0}
        max={360}
        step={1}
        value={hue}
        disabled={disabled}
        aria-label={t('device.color')}
        onChange={(e) => setHue(Number(e.target.value))}
        onMouseUp={commitFromEvent}
        onTouchEnd={commitFromEvent}
        onKeyUp={(e) => {
          if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown'].includes(e.key)) {
            commitFromEvent(e)
          }
        }}
      />
    </div>
  )
}

function ColorSettingControl({ capability, disabled, onAction }: CapabilityControlProps): JSX.Element | null {
  const { dict } = useI18n()
  const params = capability.parameters as ColorSettingCapabilityParameters | undefined
  if (!params) return null

  // Устройство объявляет конкретную модель цвета — какой instance слать,
  // зависит именно от неё (hsv-only лампы отклоняют action с instance=rgb).
  // Пресеты и сцены — одномоментные команды без своего локального состояния
  // (сама плашка/кнопка не «залипает» в выбранном виде), поэтому откатывать
  // тут нечего — ошибка просто всплывёт в EntityControlModal.
  const sendColor = (hex: number): void => {
    void onAction(
      params.color_model === 'hsv'
        ? { type: 'devices.capabilities.color_setting', state: { instance: 'hsv', value: hexToHsv(hex) } }
        : { type: 'devices.capabilities.color_setting', state: { instance: 'rgb', value: hex } }
    )
  }

  // Тёплый/холодный белый теперь отдельные кнопки у слайдера температуры
  // (см. ColorTemperatureSlider) — они шлют нативный instance=temperature_k
  // вместо приближения через HSV/RGB, так дальше в разы точнее. В свотчах
  // оставляем их только для устройств без temperature_k вообще.
  const swatchColors = params.temperature_k
    ? PRESET_COLORS.filter((c) => c.nameKey !== 'warmWhite' && c.nameKey !== 'coolWhite')
    : PRESET_COLORS

  return (
    <div className="py-2 flex flex-col gap-3">
      {params.color_model && (
        <HueSlider capability={capability} colorModel={params.color_model} disabled={disabled} onAction={onAction} />
      )}
      {params.color_model && (
        <div className="flex flex-wrap gap-2">
          {swatchColors.map((color) => {
            const label = dict.colorName[color.nameKey as keyof typeof dict.colorName]
            return (
              <button
                key={color.hex}
                type="button"
                title={label}
                aria-label={label}
                disabled={disabled}
                className="w-6 h-6 rounded-full border border-default-300 disabled:opacity-40"
                style={{ backgroundColor: `#${color.hex.toString(16).padStart(6, '0')}` }}
                onClick={() => sendColor(color.hex)}
              />
            )
          })}
        </div>
      )}
      {params.color_scene && params.color_scene.scenes.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {params.color_scene.scenes.map((scene) => (
            <button
              key={scene.id}
              type="button"
              disabled={disabled}
              className="text-xs px-2 py-1 rounded-full border border-default-300 text-default-500 hover:text-default-700 disabled:opacity-40"
              onClick={() =>
                void onAction({ type: 'devices.capabilities.color_setting', state: { instance: 'scene', value: scene.id } })
              }
            >
              {scene.name ?? scene.id}
            </button>
          ))}
        </div>
      )}
      {params.temperature_k && (
        <ColorTemperatureSlider
          min={params.temperature_k.min}
          max={params.temperature_k.max}
          capability={capability}
          disabled={disabled}
          onAction={onAction}
        />
      )}
    </div>
  )
}

export function CapabilityControl(props: CapabilityControlProps): JSX.Element | null {
  switch (props.capability.type) {
    case 'devices.capabilities.on_off':
      return <OnOffControl {...props} />
    case 'devices.capabilities.toggle':
      return <ToggleControl {...props} />
    case 'devices.capabilities.range':
      return <RangeControl {...props} />
    case 'devices.capabilities.mode':
      return <ModeControl {...props} />
    case 'devices.capabilities.color_setting':
      return <ColorSettingControl {...props} />
    default:
      return null
  }
}

import { Menu, Tray, nativeImage, type MenuItemConstructorOptions } from 'electron'
import { TRAY_ICON_DATA_URL } from './icon'
import type { ActionResult, Lang, TrayMruItem } from '@shared/types'

// Электрон-меню трея не показывает произвольные растровые иконки пунктов
// стабильно на всех платформах, поэтому статус/тип пункта — эмодзи в label,
// а не MenuItemConstructorOptions.icon.
const ON_ICON = '🟢'
const OFF_ICON = '⚪'
const SCENARIO_FALLBACK_ICON = '▶️'

const TRAY_STRINGS: Record<
  Lang,
  {
    show: string
    quit: string
    noRecent: string
    turnOn: string
    turnOff: string
    run: string
    tooltip: string
    actionFailedTitle: string
  }
> = {
  ru: {
    show: 'Показать ЯПульт',
    quit: 'Выход',
    noRecent: 'Нет недавних действий',
    turnOn: 'Включить',
    turnOff: 'Выключить',
    run: 'Запустить',
    tooltip: 'ЯПульт — умный дом',
    actionFailedTitle: 'ЯПульт — не удалось выполнить действие'
  },
  en: {
    show: 'Show YaPult',
    quit: 'Quit',
    noRecent: 'No recent actions',
    turnOn: 'Turn on',
    turnOff: 'Turn off',
    run: 'Run',
    tooltip: 'YaPult — smart home',
    actionFailedTitle: 'YaPult — action failed'
  }
}

export interface TrayDeps {
  showWindow: () => void
  quitApp: () => void
  performToggle: (item: TrayMruItem) => Promise<ActionResult>
  performScenario: (item: TrayMruItem) => Promise<void>
  notifyError: (title: string, body: string) => void
  getLang: () => Lang
  onActionPerformed: () => void
}

/**
 * Иконка в системном трее + меню «последних действий». Список формирует
 * renderer (см. hooks/useTrayMru.ts) и присылает через IPC — main сам не
 * знает про устройства/группы, кроме уже открытого HTTP-клиента к API,
 * которым и выполняет клик по пункту меню.
 */
export class AppTray {
  private tray: Tray | null = null
  private items: TrayMruItem[] = []
  private busyIds = new Set<string>()

  constructor(private deps: TrayDeps) {}

  init(): void {
    // Исходник 32×32 — трей Windows традиционно ждёт 16×16, иначе иконка
    // может выглядеть непропорционально крупной/обрезанной в панели задач.
    const icon = nativeImage.createFromDataURL(TRAY_ICON_DATA_URL).resize({ width: 16, height: 16 })
    this.tray = new Tray(icon)
    this.tray.on('click', () => this.deps.showWindow())
    this.rebuild()
  }

  updateItems(items: TrayMruItem[]): void {
    this.items = items
    this.rebuild()
  }

  refreshLabels(): void {
    this.rebuild()
  }

  private rebuild(): void {
    if (!this.tray) return
    const strings = TRAY_STRINGS[this.deps.getLang()]
    const template: MenuItemConstructorOptions[] = [
      { label: `🏠 ${strings.show}`, click: () => this.deps.showWindow() },
      { type: 'separator' }
    ]

    if (this.items.length === 0) {
      template.push({ label: strings.noRecent, enabled: false })
    } else {
      for (const item of this.items) {
        if (item.kind === 'scenario') {
          const scenarioIcon = item.icon || SCENARIO_FALLBACK_ICON
          template.push({
            label: `${scenarioIcon} ${strings.run}: ${item.name}`,
            enabled: !this.busyIds.has(this.busyKey(item)),
            click: () => void this.handleScenarioRun(item)
          })
          continue
        }
        const stateIcon = item.isOn ? ON_ICON : OFF_ICON
        const actionLabel = item.isOn ? strings.turnOff : strings.turnOn
        template.push({
          label: `${stateIcon} ${actionLabel}: ${item.name}`,
          enabled: !this.busyIds.has(this.busyKey(item)),
          click: () => void this.handleToggle(item)
        })
      }
    }

    template.push({ type: 'separator' }, { label: `🚪 ${strings.quit}`, click: () => this.deps.quitApp() })

    this.tray.setContextMenu(Menu.buildFromTemplate(template))
    this.tray.setToolTip(strings.tooltip)
  }

  private setItemOn(id: string, kind: TrayMruItem['kind'], isOn: boolean): void {
    this.items = this.items.map((i) => (i.id === id && i.kind === kind ? { ...i, isOn } : i))
  }

  // id уникален только в пределах своего kind — устройство и группа теоретически
  // могут получить одинаковый id, поэтому busyIds ключуем составным ключом.
  private busyKey(item: TrayMruItem): string {
    return `${item.kind}:${item.id}`
  }

  private async handleToggle(item: TrayMruItem): Promise<void> {
    // Optimistic UI: переключаем пункт меню сразу по клику, не дожидаясь
    // ответа Яндекса (тот же паттерн, что и слайдеры/тумблеры в окне) —
    // и откатываем обратно, если запрос вернул ошибку.
    this.setItemOn(item.id, item.kind, !item.isOn)
    this.busyIds.add(this.busyKey(item))
    this.rebuild()
    try {
      const result = await this.deps.performToggle(item)
      if (result.success) {
        this.deps.onActionPerformed()
      } else {
        this.setItemOn(item.id, item.kind, !!item.isOn)
        const strings = TRAY_STRINGS[this.deps.getLang()]
        this.deps.notifyError(strings.actionFailedTitle, result.errorMessage ?? item.name)
      }
    } catch (err) {
      this.setItemOn(item.id, item.kind, !!item.isOn)
      const strings = TRAY_STRINGS[this.deps.getLang()]
      this.deps.notifyError(strings.actionFailedTitle, (err as Error).message)
    } finally {
      this.busyIds.delete(this.busyKey(item))
      this.rebuild()
    }
  }

  private async handleScenarioRun(item: TrayMruItem): Promise<void> {
    this.busyIds.add(this.busyKey(item))
    this.rebuild()
    try {
      await this.deps.performScenario(item)
      this.deps.onActionPerformed()
    } catch (err) {
      const strings = TRAY_STRINGS[this.deps.getLang()]
      this.deps.notifyError(strings.actionFailedTitle, (err as Error).message)
    } finally {
      this.busyIds.delete(this.busyKey(item))
      this.rebuild()
    }
  }

  destroy(): void {
    this.tray?.destroy()
    this.tray = null
  }
}

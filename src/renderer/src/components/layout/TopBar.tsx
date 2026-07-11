import { useEffect, useReducer } from 'react'
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Button,
  Chip,
  Tooltip,
  Avatar,
  Divider,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  useDisclosure
} from '@heroui/react'
import type { Device, Scenario, YandexProfile } from '@shared/types'
import { useI18n } from '@/i18n/I18nContext'
import { formatRelativeTime } from '@/lib/time'
import { QuickSearch } from '@/components/search/QuickSearch'
import { SettingsModal } from '@/settings/SettingsModal'

interface TopBarProps {
  authed: boolean
  refreshing: boolean
  hasConnectionIssue: boolean
  householdName?: string
  lastUpdatedAt: number | null
  profile: YandexProfile | null
  onLogin: () => void
  onLogout: () => void
  onRefresh: () => void
  search?: {
    devices: Device[]
    scenarios: Scenario[]
    onSelectDevice: (id: string) => void
    onSelectScenario: (scenario: Scenario) => void
  }
}

export function TopBar({
  authed,
  refreshing,
  hasConnectionIssue,
  householdName,
  lastUpdatedAt,
  profile,
  onLogin,
  onLogout,
  onRefresh,
  search
}: TopBarProps): JSX.Element {
  const { t, lang } = useI18n()
  const { isOpen, onOpen, onOpenChange } = useDisclosure()

  // "23 сек назад" протухает молча между опросами — тикаем раз в секунду,
  // пока подсказка вообще имеет смысл показывать (после логина).
  const [, forceTick] = useReducer((x: number) => x + 1, 0)
  useEffect(() => {
    if (!authed) return
    const id = setInterval(forceTick, 1000)
    return () => clearInterval(id)
  }, [authed])

  const freshnessLabel = lastUpdatedAt ? t('topbar.updatedAt', { time: formatRelativeTime(lastUpdatedAt, lang) }) : undefined
  const statusTooltip = refreshing
    ? t('topbar.refreshing')
    : [hasConnectionIssue ? t('topbar.connectionIssueTooltip') : t('topbar.connectionOkTooltip'), freshnessLabel]
        .filter(Boolean)
        .join(' · ')

  return (
    <Navbar isBordered maxWidth="full" className="bg-content1/80 backdrop-blur">
      <NavbarBrand className="gap-2">
        <span aria-hidden className="text-xl">
          🏠
        </span>
        <div className="flex flex-col leading-tight">
          <span className="font-semibold text-lg tracking-tight leading-none">{t('app.title')}</span>
          <span className="text-default-400 text-xs hidden sm:inline">{householdName ?? t('app.subtitle')}</span>
        </div>
      </NavbarBrand>
      <NavbarContent justify="end" className="gap-3">
        {search && (
          <NavbarItem>
            <QuickSearch
              devices={search.devices}
              scenarios={search.scenarios}
              onSelectDevice={search.onSelectDevice}
              onSelectScenario={search.onSelectScenario}
            />
          </NavbarItem>
        )}

        <NavbarItem>
          {authed ? (
            <Tooltip content={statusTooltip}>
              <button
                type="button"
                onClick={onRefresh}
                disabled={refreshing}
                aria-label={`${hasConnectionIssue ? t('topbar.connectionIssue') : t('topbar.connected')} — ${t('topbar.refresh')}`}
                className="flex items-center gap-1.5 rounded-full bg-default-100/70 hover:bg-default-200/70 transition-colors pl-2.5 pr-1.5 py-1 disabled:cursor-not-allowed"
              >
                <Chip color={hasConnectionIssue ? 'warning' : 'success'} variant="flat" size="sm" className="border-none">
                  {hasConnectionIssue ? t('topbar.connectionIssue') : t('topbar.connected')}
                </Chip>
                <span
                  aria-hidden
                  className={`inline-flex w-5 h-5 items-center justify-center text-default-500 ${refreshing ? 'animate-spin' : ''}`}
                >
                  ⟳
                </span>
              </button>
            </Tooltip>
          ) : (
            <Chip color="default" variant="flat" size="sm">
              {t('topbar.notAuthed')}
            </Chip>
          )}
        </NavbarItem>

        {!authed && (
          <NavbarItem>
            <Tooltip content={t('topbar.settings')}>
              <Button isIconOnly size="sm" variant="light" aria-label={t('topbar.settings')} onPress={onOpen}>
                <span aria-hidden className="text-base">
                  ⚙️
                </span>
              </Button>
            </Tooltip>
          </NavbarItem>
        )}

        <SettingsModal isOpen={isOpen} onOpenChange={onOpenChange} />

        {authed && (
          <NavbarItem className="hidden sm:flex">
            <Divider orientation="vertical" className="h-6" />
          </NavbarItem>
        )}

        <NavbarItem>
          {authed ? (
            <Dropdown placement="bottom-end">
              <DropdownTrigger>
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-full pl-1 pr-2.5 py-1 outline-none hover:bg-default-100/70 transition-colors"
                  aria-label={t('topbar.account')}
                >
                  <Avatar name={profile?.login ?? '?'} size="sm" className="shrink-0" />
                  <span className="text-foreground text-sm font-medium hidden sm:inline max-w-[9rem] truncate">
                    {profile?.login ?? t('topbar.account')}
                  </span>
                  <span aria-hidden className="text-default-400 text-xs hidden sm:inline">
                    ▾
                  </span>
                </button>
              </DropdownTrigger>
              <DropdownMenu aria-label={t('topbar.account')}>
                <DropdownItem key="settings" startContent={<span aria-hidden>⚙️</span>} onPress={onOpen}>
                  {t('topbar.settings')}
                </DropdownItem>
                <DropdownItem
                  key="logout"
                  color="danger"
                  className="text-danger"
                  startContent={<span aria-hidden>🚪</span>}
                  onPress={onLogout}
                >
                  {t('topbar.logout')}
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          ) : (
            <Button size="sm" color="primary" onPress={onLogin}>
              {t('topbar.login')}
            </Button>
          )}
        </NavbarItem>
      </NavbarContent>
    </Navbar>
  )
}

import { useCallback, useEffect, useRef, useState } from 'react'
import { type AppError, type HomeInfo } from '@shared/types'
import { TopBar } from './components/layout/TopBar'
import { Sidebar } from './components/layout/Sidebar'
import { LoginScreen } from './components/feedback/LoginScreen'
import { ToastStack } from './components/feedback/ToastStack'
import { ErrorBoundary } from './components/feedback/ErrorBoundary'
import { FullPageError } from './components/feedback/FullPageError'
import { HomeSkeleton } from './components/feedback/HomeSkeleton'
import { EntityGrid } from './components/devices/EntityGrid'
import { DeviceCard } from './components/devices/DeviceCard'
import { GroupCard } from './components/devices/GroupCard'
import { ScenariosPanel } from './components/scenarios/ScenariosPanel'
import { useAuth } from './hooks/useAuth'
import { useHomeInfo } from './hooks/useHomeInfo'
import { useHomeView, UNASSIGNED_ROOM_ID } from './hooks/useHomeView'
import { useEntityActions } from './hooks/useEntityActions'
import { useToasts } from './hooks/useToasts'
import { useTrayMru } from './hooks/useTrayMru'
import { useI18n } from './i18n/I18nContext'
import { useSettings } from './settings/SettingsContext'
import type { Category } from './lib/navigation'

export default function App(): JSX.Element {
  const { t, dict } = useI18n()
  const { notificationsEnabled, pollIntervalMs } = useSettings()
  const auth = useAuth(t('login.notCompleted'))
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [activeEntity, setActiveEntity] = useState<{ kind: 'device' | 'group'; id: string } | null>(null)
  const { toasts, pushToast, dismissToast } = useToasts()

  // ref, а не прямая ссылка на `refresh` — иначе цикл: колбэки для useHomeInfo
  // нужно передать ДО того, как хук вернёт саму функцию refresh
  const refreshRef = useRef<() => Promise<void>>(() => Promise.resolve())
  const homeInfoRef = useRef<HomeInfo | null>(null)

  /** Нативное уведомление ОС; уважает переключатель в настройках и тихо игнорирует сбой отправки */
  const notify = useCallback(
    (title: string, body: string, urgency?: 'normal' | 'critical') => {
      if (!notificationsEnabled) return
      window.api.notify({ title, body, urgency }).catch(() => {})
    },
    [notificationsEnabled]
  )

  const handleHomeError = useCallback(
    (appError: AppError, failureCount: number) => {
      if (appError.kind === 'network' || appError.kind === 'timeout') {
        const retry = { label: t('error.retryShort'), onPress: () => void refreshRef.current() }
        if (failureCount === 1) {
          pushToast(appError.message, 'error', retry)
        } else {
          pushToast(t('toast.longNoConnection'), 'error', retry)
          notify(t('notify.connectionLostTitle'), appError.message, 'critical')
        }
      } else if (appError.kind === 'api' || appError.kind === 'unknown') {
        pushToast(appError.message, 'error')
      }
    },
    [pushToast, t, notify]
  )

  const handleHomeRecovered = useCallback(() => {
    pushToast(t('toast.connectionRestored'), 'success')
  }, [pushToast, t])

  const { homeInfo, loading, error, refresh, lastUpdatedAt } = useHomeInfo(
    auth.authState === 'authed',
    {
      onAuthError: auth.handleAuthError,
      onError: handleHomeError,
      onRecovered: handleHomeRecovered
    },
    pollIntervalMs
  )
  refreshRef.current = refresh
  homeInfoRef.current = homeInfo

  const { recordToggle } = useTrayMru(homeInfo)

  const {
    households,
    selectedHouseholdId,
    setSelectedHouseholdId,
    selectedHouseholdName,
    householdDevices,
    sortedDevices,
    sortedScenarios,
    sortedGroups,
    sidebarRooms,
    deviceCountByRoom,
    sensorDevices,
    devicesForRoom,
    isEmptyHome
  } = useHomeView(homeInfo, dict.home.unassignedRoom)

  const { handleDeviceAction, handleGroupAction, handleRunScenario, runningScenarioId } = useEntityActions({
    homeInfoRef,
    pushToast,
    notify,
    onAuthError: auth.handleAuthError,
    recordToggle,
    t
  })

  // Действие из трея выполняется целиком в main — здесь только пораньше
  // подтягиваем свежее состояние, не дожидаясь обычного опроса.
  useEffect(() => window.api.onTrayAction(() => void refreshRef.current()), [])

  // Разовая проверка версии на GitHub делается в main при старте (см.
  // src/main/updateCheck.ts) — здесь только показываем тост, если она нашла
  // релиз новее текущего.
  useEffect(
    () =>
      window.api.onUpdateAvailable((info) => {
        pushToast(t('update.available', { version: info.version }), 'info', {
          label: t('update.open'),
          onPress: () => window.open(info.url, '_blank')
        })
      }),
    [pushToast, t]
  )

  const handleLogout = useCallback(async () => {
    await auth.logout()
    setSelectedCategory(null)
    setActiveEntity(null)
    setSelectedHouseholdId(null)
  }, [auth.logout, setSelectedHouseholdId])

  const handleSelectHousehold = useCallback(
    (householdId: string) => {
      setSelectedHouseholdId(householdId)
      setSelectedCategory(null)
      setActiveEntity(null)
    },
    [setSelectedHouseholdId]
  )

  // Категория по умолчанию — первая непустая комната, иначе группы/датчики/сценарии.
  useEffect(() => {
    if (!homeInfo || selectedCategory) return
    const firstNonEmptyRoom = sidebarRooms.find((room) => devicesForRoom(room.id).length > 0)
    if (firstNonEmptyRoom) setSelectedCategory({ type: 'room', roomId: firstNonEmptyRoom.id })
    else if (sortedGroups.length > 0) setSelectedCategory({ type: 'groups' })
    else if (sensorDevices.length > 0) setSelectedCategory({ type: 'sensors' })
    else if (sortedScenarios.length > 0) setSelectedCategory({ type: 'scenarios' })
  }, [homeInfo, selectedCategory, sidebarRooms, devicesForRoom, sortedGroups, sensorDevices, sortedScenarios])

  useEffect(() => {
    if (!homeInfo) setSelectedCategory(null)
  }, [homeInfo])

  const handleSelectCategory = useCallback((category: Category) => {
    setSelectedCategory(category)
    setActiveEntity(null)
  }, [])

  // Выбор устройства в поиске переключает сайдбар на его комнату и сразу
  // открывает модалку с настройками — незачем сначала скроллить к плитке,
  // раз всё равно тут же откроется модалка со всеми контролами.
  const handleSelectDevice = useCallback((deviceId: string) => {
    const info = homeInfoRef.current
    if (!info) return
    const room = info.rooms.find((r) => r.devices.includes(deviceId))
    setSelectedCategory({ type: 'room', roomId: room?.id ?? UNASSIGNED_ROOM_ID })
    setActiveEntity({ kind: 'device', id: deviceId })
  }, [])

  const hasConnectionIssue = !!error && !!homeInfo && (error.kind === 'network' || error.kind === 'timeout')
  const activeRoom = selectedCategory?.type === 'room' ? sidebarRooms.find((r) => r.id === selectedCategory.roomId) : undefined

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col">
        <TopBar
          authed={auth.authState === 'authed'}
          refreshing={loading}
          hasConnectionIssue={hasConnectionIssue}
          householdName={selectedHouseholdName}
          lastUpdatedAt={lastUpdatedAt}
          profile={auth.profile}
          onLogin={() => void auth.login()}
          onLogout={() => void handleLogout()}
          onRefresh={() => void refresh()}
          search={
            householdDevices.length > 0 || sortedScenarios.length > 0
              ? {
                  devices: sortedDevices,
                  scenarios: sortedScenarios,
                  onSelectDevice: handleSelectDevice,
                  onSelectScenario: (scenario) => void handleRunScenario(scenario)
                }
              : undefined
          }
        />

        {auth.authState === 'checking' && (
          <div className="flex-1 flex items-center justify-center px-4">
            <div className="w-full max-w-6xl mx-auto pt-6">
              <HomeSkeleton />
            </div>
          </div>
        )}

        {auth.authState === 'guest' && (
          <LoginScreen onLogin={() => void auth.login()} loggingIn={auth.loggingIn} error={auth.loginError} />
        )}

        {auth.authState === 'authed' && (
          <div className="flex-1 flex overflow-hidden">
            {!homeInfo && loading && (
              <div className="flex-1 px-6 py-6 max-w-6xl w-full mx-auto overflow-y-auto">
                <HomeSkeleton />
              </div>
            )}

            {!homeInfo && !loading && error && (
              <div className="flex-1">
                <FullPageError error={error} onRetry={() => void refresh()} />
              </div>
            )}

            {homeInfo && isEmptyHome && (
              <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 py-24 text-default-400">
                <span className="text-4xl" aria-hidden>
                  🕳️
                </span>
                <p>{t('home.emptyTitle')}</p>
              </div>
            )}

            {homeInfo && !isEmptyHome && selectedCategory && (
              <>
                <Sidebar
                  rooms={sidebarRooms}
                  deviceCountByRoom={deviceCountByRoom}
                  groupsCount={sortedGroups.length}
                  sensorsCount={sensorDevices.length}
                  scenariosCount={sortedScenarios.length}
                  selected={selectedCategory}
                  onSelect={handleSelectCategory}
                  households={households}
                  selectedHouseholdId={selectedHouseholdId}
                  onSelectHousehold={handleSelectHousehold}
                />

                <main className="flex-1 overflow-y-auto px-6 py-6">
                  {selectedCategory.type === 'room' && activeRoom && (
                    <>
                      <h1 className="text-lg font-semibold mb-4">{activeRoom.name}</h1>
                      {devicesForRoom(activeRoom.id).length === 0 ? (
                        <p className="text-default-400 text-sm">{t('sidebar.emptyRoom')}</p>
                      ) : (
                        <EntityGrid>
                          {devicesForRoom(activeRoom.id).map((device) => (
                            <DeviceCard
                              key={device.id}
                              device={device}
                              onAction={handleDeviceAction}
                              isOpen={activeEntity?.kind === 'device' && activeEntity.id === device.id}
                              onOpenChange={(open) => setActiveEntity(open ? { kind: 'device', id: device.id } : null)}
                            />
                          ))}
                        </EntityGrid>
                      )}
                    </>
                  )}

                  {selectedCategory.type === 'groups' && (
                    <>
                      <h1 className="text-lg font-semibold mb-4">{t('sidebar.groups')}</h1>
                      <EntityGrid>
                        {sortedGroups.map((group) => (
                          <GroupCard
                            key={group.id}
                            group={group}
                            onAction={handleGroupAction}
                            isOpen={activeEntity?.kind === 'group' && activeEntity.id === group.id}
                            onOpenChange={(open) => setActiveEntity(open ? { kind: 'group', id: group.id } : null)}
                          />
                        ))}
                      </EntityGrid>
                    </>
                  )}

                  {selectedCategory.type === 'sensors' && (
                    <>
                      <h1 className="text-lg font-semibold mb-4">{t('sidebar.sensors')}</h1>
                      <EntityGrid>
                        {sensorDevices.map((device) => (
                          <DeviceCard
                            key={device.id}
                            device={device}
                            onAction={handleDeviceAction}
                            isOpen={activeEntity?.kind === 'device' && activeEntity.id === device.id}
                            onOpenChange={(open) => setActiveEntity(open ? { kind: 'device', id: device.id } : null)}
                          />
                        ))}
                      </EntityGrid>
                    </>
                  )}

                  {selectedCategory.type === 'scenarios' && (
                    <>
                      <h1 className="text-lg font-semibold mb-4">{t('sidebar.scenarios')}</h1>
                      <ScenariosPanel scenarios={sortedScenarios} runningId={runningScenarioId} onRun={handleRunScenario} />
                    </>
                  )}
                </main>
              </>
            )}
          </div>
        )}

        <ToastStack toasts={toasts} onDismiss={dismissToast} />
      </div>
    </ErrorBoundary>
  )
}

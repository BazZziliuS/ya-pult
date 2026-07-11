import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Device, DeviceGroup, Household, HomeInfo, Room, Scenario } from '@shared/types'

/** Синтетическая "комната" в сайдбаре для устройств, у которых нет реальной комнаты в API */
export const UNASSIGNED_ROOM_ID = 'unassigned'

interface UseHomeViewResult {
  households: Household[]
  selectedHouseholdId: string | null
  setSelectedHouseholdId: (id: string | null) => void
  /** Имя текущего дома для шапки — выбранное, либо первое (пока переключатель не понадобился) */
  selectedHouseholdName: string | undefined
  byName: (a: { name: string; id: string }, b: { name: string; id: string }) => number
  householdDevices: Device[]
  sortedDevices: Device[]
  sortedScenarios: Scenario[]
  sortedGroups: DeviceGroup[]
  sidebarRooms: Room[]
  deviceCountByRoom: Map<string, number>
  sensorDevices: Device[]
  devicesForRoom: (roomId: string) => Device[]
  isEmptyHome: boolean
}

/**
 * Всё «формирование» данных дома для отображения: сортировка по стабильному
 * ключу (API не гарантирует порядок между опросами), фильтрация по
 * выбранному household_id (если домов больше одного), комнаты сайдбара
 * (включая синтетическую «Без комнаты»), сквозная категория «Датчики».
 * Вынесено из App.tsx как самостоятельный кусок бизнес-логики, не зависящий
 * от авторизации или отправки действий устройствам.
 */
export function useHomeView(homeInfo: HomeInfo | null, unassignedRoomLabel: string): UseHomeViewResult {
  const [selectedHouseholdId, setSelectedHouseholdId] = useState<string | null>(null)

  // API не гарантирует стабильный порядок комнат/устройств/сценариев между
  // опросами — без сортировки по стабильному ключу карточки визуально
  // «плавали», переставляясь местами каждые несколько секунд.
  const byName = useCallback(
    (a: { name: string; id: string }, b: { name: string; id: string }) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }) || a.id.localeCompare(b.id),
    []
  )

  // Дома пользователя — переключатель показывается только если их больше
  // одного (иначе это лишний элемент интерфейса для подавляющего большинства
  // с одним домом). Сценарии не привязаны к household_id в ответе API —
  // фильтровать их по дому нечем, показываем всегда все.
  const households = homeInfo?.households ?? []

  useEffect(() => {
    if (households.length === 0) return
    if (selectedHouseholdId && households.some((h) => h.id === selectedHouseholdId)) return
    setSelectedHouseholdId(households[0].id)
    // households пересоздаётся на каждый опрос — сравниваем по id, а не по ссылке
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [households.map((h) => h.id).join(','), selectedHouseholdId])

  const householdScoped = households.length > 1 && !!selectedHouseholdId

  const householdDevices = useMemo(
    () => (homeInfo ? (householdScoped ? homeInfo.devices.filter((d) => d.household_id === selectedHouseholdId) : homeInfo.devices) : []),
    [homeInfo, householdScoped, selectedHouseholdId]
  )
  const householdRooms = useMemo(
    () => (homeInfo ? (householdScoped ? homeInfo.rooms.filter((r) => r.household_id === selectedHouseholdId) : homeInfo.rooms) : []),
    [homeInfo, householdScoped, selectedHouseholdId]
  )
  const householdGroups = useMemo(
    () => (homeInfo ? (householdScoped ? homeInfo.groups.filter((g) => g.household_id === selectedHouseholdId) : homeInfo.groups) : []),
    [homeInfo, householdScoped, selectedHouseholdId]
  )

  const sortedScenarios = useMemo(() => (homeInfo ? [...homeInfo.scenarios].sort(byName) : []), [homeInfo, byName])
  const sortedGroups = useMemo(() => [...householdGroups].sort(byName), [householdGroups, byName])
  const sortedDevices = useMemo(() => [...householdDevices].sort(byName), [householdDevices, byName])

  const devicesByRoom = useMemo(() => {
    const map = new Map<string, Device[]>()
    for (const room of householdRooms) {
      const devices = room.devices
        .map((id) => householdDevices.find((d) => d.id === id))
        .filter((d): d is Device => !!d)
        .sort(byName)
      map.set(room.id, devices)
    }
    return map
  }, [householdRooms, householdDevices, byName])

  const unassignedDevices = useMemo(() => {
    const assignedIds = new Set(householdRooms.flatMap((r) => r.devices))
    return householdDevices.filter((d) => !assignedIds.has(d.id)).sort(byName)
  }, [householdRooms, householdDevices, byName])

  // Комнаты для сайдбара — реальные + синтетическая «Без комнаты», если есть куда её девать.
  const sidebarRooms = useMemo<Room[]>(() => {
    const rooms = [...householdRooms].sort(byName)
    if (unassignedDevices.length > 0) {
      rooms.push({ id: UNASSIGNED_ROOM_ID, name: unassignedRoomLabel, devices: unassignedDevices.map((d) => d.id) })
    }
    return rooms
  }, [householdRooms, byName, unassignedDevices, unassignedRoomLabel])

  const deviceCountByRoom = useMemo(() => {
    const map = new Map<string, number>()
    for (const room of sidebarRooms) {
      map.set(room.id, room.id === UNASSIGNED_ROOM_ID ? unassignedDevices.length : (devicesByRoom.get(room.id)?.length ?? 0))
    }
    return map
  }, [sidebarRooms, devicesByRoom, unassignedDevices])

  // «Датчики» — сквозная категория поверх комнат: устройства с показаниями
  // (properties), независимо от того, в какой они комнате.
  const sensorDevices = useMemo(() => householdDevices.filter((d) => d.properties.length > 0).sort(byName), [householdDevices, byName])

  const devicesForRoom = useCallback(
    (roomId: string): Device[] => (roomId === UNASSIGNED_ROOM_ID ? unassignedDevices : (devicesByRoom.get(roomId) ?? [])),
    [unassignedDevices, devicesByRoom]
  )

  const isEmptyHome =
    !!homeInfo &&
    sidebarRooms.length === 0 &&
    sortedGroups.length === 0 &&
    sensorDevices.length === 0 &&
    sortedScenarios.length === 0

  const selectedHouseholdName = households.find((h) => h.id === selectedHouseholdId)?.name ?? households[0]?.name

  return {
    households,
    selectedHouseholdId,
    setSelectedHouseholdId,
    selectedHouseholdName,
    byName,
    householdDevices,
    sortedDevices,
    sortedScenarios,
    sortedGroups,
    sidebarRooms,
    deviceCountByRoom,
    sensorDevices,
    devicesForRoom,
    isEmptyHome
  }
}

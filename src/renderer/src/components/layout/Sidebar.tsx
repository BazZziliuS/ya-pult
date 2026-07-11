import { Listbox, ListboxItem, ListboxSection, ScrollShadow, Chip, Select, SelectItem } from '@heroui/react'
import type { Household, Room } from '@shared/types'
import { useI18n } from '@/i18n/I18nContext'
import { type Category, categoryKey } from '@/lib/navigation'

interface SidebarProps {
  rooms: Room[]
  deviceCountByRoom: Map<string, number>
  groupsCount: number
  sensorsCount: number
  scenariosCount: number
  selected: Category
  onSelect: (category: Category) => void
  households?: Household[]
  selectedHouseholdId?: string | null
  onSelectHousehold?: (householdId: string) => void
}

const GROUPS_KEY = 'groups'
const SENSORS_KEY = 'sensors'
const SCENARIOS_KEY = 'scenarios'
const ROOM_KEY_PREFIX = 'room:'

export function Sidebar({
  rooms,
  deviceCountByRoom,
  groupsCount,
  sensorsCount,
  scenariosCount,
  selected,
  onSelect,
  households,
  selectedHouseholdId,
  onSelectHousehold
}: SidebarProps): JSX.Element {
  const { t } = useI18n()
  const selectedKey = categoryKey(selected)
  const showHouseholdSwitcher = !!households && households.length > 1

  return (
    <aside className="w-60 shrink-0 border-r border-default-100 h-full">
      <ScrollShadow className="h-full py-3">
        {showHouseholdSwitcher ? (
          <div className="px-2 pb-3">
            <Select
              aria-label={t('sidebar.household')}
              size="sm"
              selectedKeys={selectedHouseholdId ? [selectedHouseholdId] : []}
              onSelectionChange={(keys) => {
                const key = Array.from(keys)[0]
                if (typeof key === 'string') onSelectHousehold?.(key)
              }}
              startContent={
                <span aria-hidden className="text-base">
                  🏠
                </span>
              }
            >
              {households!.map((household) => (
                <SelectItem key={household.id}>{household.name}</SelectItem>
              ))}
            </Select>
          </div>
        ) : null}
        <Listbox
          aria-label={t('sidebar.rooms')}
          selectionMode="single"
          selectedKeys={[selectedKey]}
          onSelectionChange={(keys) => {
            const key = Array.from(keys)[0]
            if (typeof key !== 'string') return
            if (key === GROUPS_KEY) onSelect({ type: 'groups' })
            else if (key === SENSORS_KEY) onSelect({ type: 'sensors' })
            else if (key === SCENARIOS_KEY) onSelect({ type: 'scenarios' })
            else if (key.startsWith(ROOM_KEY_PREFIX)) onSelect({ type: 'room', roomId: key.slice(ROOM_KEY_PREFIX.length) })
          }}
        >
          <ListboxSection title={t('sidebar.rooms')}>
            {rooms.map((room) => (
              <ListboxItem
                key={`${ROOM_KEY_PREFIX}${room.id}`}
                startContent={
                  <span aria-hidden className="text-base">
                    🚪
                  </span>
                }
                endContent={
                  <Chip size="sm" variant="flat" className="shrink-0">
                    {deviceCountByRoom.get(room.id) ?? 0}
                  </Chip>
                }
              >
                {room.name}
              </ListboxItem>
            ))}
          </ListboxSection>
          {groupsCount > 0 || sensorsCount > 0 || scenariosCount > 0 ? (
            <ListboxSection showDivider>
              {groupsCount > 0 ? (
                <ListboxItem
                  key={GROUPS_KEY}
                  startContent={
                    <span aria-hidden className="text-base">
                      🔗
                    </span>
                  }
                  endContent={
                    <Chip size="sm" variant="flat" className="shrink-0">
                      {groupsCount}
                    </Chip>
                  }
                >
                  {t('sidebar.groups')}
                </ListboxItem>
              ) : null}
              {sensorsCount > 0 ? (
                <ListboxItem
                  key={SENSORS_KEY}
                  startContent={
                    <span aria-hidden className="text-base">
                      📊
                    </span>
                  }
                  endContent={
                    <Chip size="sm" variant="flat" className="shrink-0">
                      {sensorsCount}
                    </Chip>
                  }
                >
                  {t('sidebar.sensors')}
                </ListboxItem>
              ) : null}
              {scenariosCount > 0 ? (
                <ListboxItem
                  key={SCENARIOS_KEY}
                  startContent={
                    <span aria-hidden className="text-base">
                      ⚡
                    </span>
                  }
                  endContent={
                    <Chip size="sm" variant="flat" className="shrink-0">
                      {scenariosCount}
                    </Chip>
                  }
                >
                  {t('sidebar.scenarios')}
                </ListboxItem>
              ) : null}
            </ListboxSection>
          ) : null}
        </Listbox>
      </ScrollShadow>
    </aside>
  )
}

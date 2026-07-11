import type { CapabilityActionRequest, DeviceGroup } from '@shared/types'
import { EntityTile } from './EntityTile'
import { EntityControlModal } from './EntityControlModal'
import { deviceCountWord, deviceTypeColor, deviceTypeIcon } from '@/lib/labels'
import { useI18n } from '@/i18n/I18nContext'
import { useEntityCardAction } from '@/hooks/useEntityCardAction'

interface GroupCardProps {
  group: DeviceGroup
  onAction: (groupId: string, action: CapabilityActionRequest) => Promise<{ success: boolean; message?: string }>
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function GroupCard({ group, onAction, isOpen, onOpenChange }: GroupCardProps): JSX.Element {
  const { t, dict } = useI18n()
  const { busy, error, handleAction } = useEntityCardAction(group.id, onAction)

  const color = group.type ? deviceTypeColor(group.type) : 'default'
  const icon = group.type ? deviceTypeIcon(group.type) : '🏠'
  const subtitle = t('groups.deviceCount', { count: group.devices.length, word: deviceCountWord(dict, group.devices.length) })

  return (
    <>
      <EntityTile
        id={group.id}
        name={group.name}
        subtitle={subtitle}
        icon={icon}
        iconColor={color}
        busy={busy}
        hasError={!!error}
        highlighted={isOpen}
        onOpen={() => onOpenChange(true)}
      />
      <EntityControlModal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        name={group.name}
        subtitle={subtitle}
        icon={icon}
        iconColor={color}
        capabilities={group.capabilities}
        busy={busy}
        error={error}
        onAction={handleAction}
      />
    </>
  )
}

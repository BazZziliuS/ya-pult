import type { CapabilityActionRequest, Device } from '@shared/types'
import { EntityTile } from './EntityTile'
import { EntityControlModal } from './EntityControlModal'
import { deviceTypeColor, deviceTypeIcon, deviceTypeLabel } from '@/lib/labels'
import { useI18n } from '@/i18n/I18nContext'
import { useEntityCardAction } from '@/hooks/useEntityCardAction'

interface DeviceCardProps {
  device: Device
  onAction: (deviceId: string, action: CapabilityActionRequest) => Promise<{ success: boolean; message?: string }>
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function DeviceCard({ device, onAction, isOpen, onOpenChange }: DeviceCardProps): JSX.Element {
  const { dict, t } = useI18n()
  const { busy, error, handleAction } = useEntityCardAction(device.id, onAction)

  const isOffline = device.state === 'offline' || device.state === 'not_found'
  const deviceInfo = device.device_info
  const modalSubtitle = [deviceTypeLabel(dict, device.type), deviceInfo?.manufacturer, deviceInfo?.model]
    .filter(Boolean)
    .join(' · ')

  return (
    <>
      <EntityTile
        id={device.id}
        name={device.name}
        subtitle={deviceTypeLabel(dict, device.type)}
        icon={deviceTypeIcon(device.type)}
        iconColor={deviceTypeColor(device.type)}
        isOffline={isOffline}
        offlineLabel={t('device.offline')}
        busy={busy}
        hasError={!!error}
        highlighted={isOpen}
        onOpen={() => onOpenChange(true)}
      />
      <EntityControlModal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        name={device.name}
        subtitle={modalSubtitle}
        icon={deviceTypeIcon(device.type)}
        iconColor={deviceTypeColor(device.type)}
        isOffline={isOffline}
        capabilities={device.capabilities}
        properties={device.properties}
        busy={busy}
        error={error}
        onAction={handleAction}
      />
    </>
  )
}

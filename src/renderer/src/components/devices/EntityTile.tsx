import { Card, CardBody, Chip, Spinner } from '@heroui/react'
import type { DeviceIconColor } from '@/lib/labels'

interface EntityTileProps {
  id: string
  name: string
  subtitle: string
  icon: string
  iconColor: DeviceIconColor
  isOffline?: boolean
  offlineLabel?: string
  busy?: boolean
  hasError?: boolean
  highlighted?: boolean
  onOpen: () => void
}

const BADGE_CLASSES: Record<DeviceIconColor, string> = {
  warning: 'bg-warning/15 text-warning',
  primary: 'bg-primary/15 text-primary',
  secondary: 'bg-secondary/15 text-secondary',
  success: 'bg-success/15 text-success',
  danger: 'bg-danger/15 text-danger',
  default: 'bg-default/50 text-default-600'
}

/**
 * Компактная плитка вместо развёрнутой карточки с контролами — клик по всей
 * плитке открывает модалку с настройками (EntityControlModal). Так main-view
 * не захламляется десятком слайдеров сразу, а сканировать список устройств
 * глазами проще: см. https://github.com/onegamerstory/Desktop-Yandex.Home-App
 */
export function EntityTile({
  id,
  name,
  subtitle,
  icon,
  iconColor,
  isOffline,
  offlineLabel,
  busy,
  hasError,
  highlighted,
  onOpen
}: EntityTileProps): JSX.Element {
  return (
    <Card
      id={`entity-${id}`}
      isPressable
      radius="lg"
      shadow="sm"
      onPress={onOpen}
      className={[
        'border border-default-100/80 transition-shadow w-full',
        isOffline ? 'opacity-60' : '',
        hasError ? 'ring-1 ring-danger' : '',
        highlighted ? 'ring-2 ring-primary shadow-lg shadow-primary/30' : ''
      ].join(' ')}
    >
      <CardBody className="flex flex-row items-center gap-3 py-3">
        <span
          className={`flex items-center justify-center w-9 h-9 rounded-full text-base leading-none shrink-0 ${BADGE_CLASSES[iconColor]}`}
          aria-hidden
        >
          {icon}
        </span>
        <div className="flex flex-col min-w-0 flex-1 text-left">
          <span className="font-medium text-sm truncate">{name}</span>
          <span className="text-xs text-default-400 truncate">{subtitle}</span>
        </div>
        {busy && <Spinner size="sm" />}
        {isOffline && offlineLabel && (
          <Chip size="sm" color="default" variant="flat" className="shrink-0">
            {offlineLabel}
          </Chip>
        )}
      </CardBody>
    </Card>
  )
}

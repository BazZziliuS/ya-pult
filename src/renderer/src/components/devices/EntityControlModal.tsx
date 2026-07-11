import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Spinner } from '@heroui/react'
import type { Capability, CapabilityActionRequest, Property } from '@shared/types'
import { CapabilityControl } from './CapabilityControl'
import { propertyLabel, propertyUnit, type DeviceIconColor } from '@/lib/labels'
import { capabilityKey, sortCapabilities, sortProperties } from '@/lib/capability'
import { useI18n } from '@/i18n/I18nContext'

interface EntityControlModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  name: string
  subtitle: string
  icon: string
  iconColor: DeviceIconColor
  isOffline?: boolean
  capabilities: Capability[]
  properties?: Property[]
  busy: boolean
  error: string | null
  /** true — сервер подтвердил; false — контрол должен откатить своё оптимистичное значение */
  onAction: (action: CapabilityActionRequest) => Promise<boolean>
}

const BADGE_CLASSES: Record<DeviceIconColor, string> = {
  warning: 'bg-warning/15 text-warning',
  primary: 'bg-primary/15 text-primary',
  secondary: 'bg-secondary/15 text-secondary',
  success: 'bg-success/15 text-success',
  danger: 'bg-danger/15 text-danger',
  default: 'bg-default/50 text-default-600'
}

export function EntityControlModal({
  isOpen,
  onOpenChange,
  name,
  subtitle,
  icon,
  iconColor,
  isOffline,
  capabilities,
  properties = [],
  busy,
  error,
  onAction
}: EntityControlModalProps): JSX.Element {
  const { t, dict } = useI18n()
  const sortedCapabilities = sortCapabilities(capabilities)
  const sortedProperties = sortProperties(properties)
  const hasNothingToShow = sortedCapabilities.length === 0 && sortedProperties.length === 0

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} scrollBehavior="inside">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex items-center gap-3">
              <span
                className={`flex items-center justify-center w-9 h-9 rounded-full text-base leading-none shrink-0 ${BADGE_CLASSES[iconColor]}`}
                aria-hidden
              >
                {icon}
              </span>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="truncate">{name}</span>
                <span className="text-xs text-default-400 font-normal truncate">{subtitle}</span>
              </div>
              {/* Лёгкий индикатор «что-то в процессе» — не блокирует контролы,
                  в отличие от старого поведения с disabled на всё время запроса. */}
              {busy && <Spinner size="sm" />}
            </ModalHeader>
            <ModalBody className="pb-2">
              {hasNothingToShow ? (
                <p className="text-default-400 text-sm py-4">{t('device.unsupported')}</p>
              ) : (
                <>
                  {sortedCapabilities.map((capability) => (
                    <CapabilityControl
                      key={capabilityKey(capability)}
                      capability={capability}
                      disabled={!!isOffline}
                      onAction={onAction}
                    />
                  ))}
                  {sortedProperties.map((property) => {
                    const instance = property.parameters?.instance ?? property.state?.instance
                    if (!instance || property.state == null) return null
                    return (
                      <div key={`prop-${instance}`} className="flex items-center justify-between py-1 text-sm">
                        <span className="text-default-500">{propertyLabel(dict, instance)}</span>
                        <span className="text-default-300">
                          {property.state.value}
                          {propertyUnit(dict, instance, property.parameters?.unit) && (
                            <span className="ml-0.5">{propertyUnit(dict, instance, property.parameters?.unit)}</span>
                          )}
                        </span>
                      </div>
                    )
                  })}
                </>
              )}
              {error && (
                <p className="text-danger text-xs mt-1 flex items-start gap-1">
                  <span aria-hidden>⚠️</span>
                  <span>{error}</span>
                </p>
              )}
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onClose}>
                {t('settings.close')}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  )
}

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Switch,
  Select,
  SelectItem
} from '@heroui/react'
import { useI18n } from '@/i18n/I18nContext'
import { LANGUAGES, type Lang } from '@/i18n/translations'
import { POLL_INTERVAL_OPTIONS_MS, useSettings } from '@/settings/SettingsContext'

interface SettingsModalProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}

export function SettingsModal({ isOpen, onOpenChange }: SettingsModalProps): JSX.Element {
  const { t, lang, setLang } = useI18n()
  const { notificationsEnabled, setNotificationsEnabled, pollIntervalMs, setPollIntervalMs } = useSettings()

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader>{t('settings.title')}</ModalHeader>
            <ModalBody className="gap-5 pb-2">
              <div>
                <p className="text-sm font-medium mb-2">{t('settings.language')}</p>
                <div className="flex gap-2">
                  {LANGUAGES.map((l) => (
                    <Button
                      key={l.code}
                      size="sm"
                      variant={lang === l.code ? 'solid' : 'flat'}
                      color={lang === l.code ? 'primary' : 'default'}
                      onPress={() => setLang(l.code as Lang)}
                    >
                      {l.flag} {l.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{t('settings.notifications')}</p>
                  <p className="text-xs text-default-400">{t('settings.notificationsHint')}</p>
                </div>
                <Switch isSelected={notificationsEnabled} onValueChange={setNotificationsEnabled} />
              </div>

              <div>
                <p className="text-sm font-medium mb-2">{t('settings.pollInterval')}</p>
                <Select
                  size="sm"
                  aria-label={t('settings.pollInterval')}
                  selectedKeys={[String(pollIntervalMs)]}
                  onSelectionChange={(keys) => {
                    const value = Array.from(keys)[0]
                    if (typeof value === 'string') setPollIntervalMs(Number(value))
                  }}
                >
                  {POLL_INTERVAL_OPTIONS_MS.map((ms) => (
                    <SelectItem key={String(ms)}>{`${ms / 1000} ${t('settings.seconds')}`}</SelectItem>
                  ))}
                </Select>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button color="primary" onPress={onClose}>
                {t('settings.close')}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  )
}

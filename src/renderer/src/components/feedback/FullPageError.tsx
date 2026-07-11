import { Button, Card, CardBody } from '@heroui/react'
import type { AppError } from '@shared/types'
import { useI18n } from '@/i18n/I18nContext'

interface FullPageErrorProps {
  error: AppError
  onRetry: () => void
}

const ICON_BY_KIND: Record<AppError['kind'], string> = {
  auth: '🔒',
  network: '📡',
  timeout: '⏱️',
  api: '⚠️',
  scenarioInactive: '⏸',
  unknown: '❓'
}

export function FullPageError({ error, onRetry }: FullPageErrorProps): JSX.Element {
  const { t, dict } = useI18n()
  return (
    <div className="flex h-[calc(100vh-64px)] items-center justify-center px-4">
      <Card radius="lg" shadow="sm" className="max-w-md w-full border border-default-100/80">
        <CardBody className="flex flex-col items-center gap-4 py-10 px-8 text-center">
          <div className="text-4xl">{ICON_BY_KIND[error.kind]}</div>
          <h1 className="text-lg font-semibold">{dict.error.kindTitle[error.kind]}</h1>
          <p className="text-default-500 text-sm break-words">{error.message}</p>
          <Button color="primary" onPress={onRetry}>
            {t('error.retry')}
          </Button>
        </CardBody>
      </Card>
    </div>
  )
}

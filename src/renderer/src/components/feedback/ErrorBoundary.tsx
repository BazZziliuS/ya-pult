import { Component, type ContextType, type ErrorInfo, type ReactNode } from 'react'
import { Button, Card, CardBody } from '@heroui/react'
import { I18nContext } from '@/i18n/I18nContext'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  static contextType = I18nContext
  declare context: ContextType<typeof I18nContext>

  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Необработанная ошибка рендера:', error, info.componentStack)
  }

  render(): ReactNode {
    if (!this.state.error) return this.props.children
    const t = this.context?.t ?? ((key: string) => key)

    return (
      <div className="flex h-screen items-center justify-center px-4">
        <Card radius="lg" shadow="sm" className="max-w-md w-full border border-default-100/80">
          <CardBody className="flex flex-col items-center gap-4 py-10 px-8 text-center">
            <div className="text-4xl">⚠️</div>
            <h1 className="text-lg font-semibold">{t('error.somethingWrong')}</h1>
            <p className="text-default-500 text-sm break-words">{this.state.error.message}</p>
            <Button color="primary" onPress={() => window.location.reload()}>
              {t('error.reload')}
            </Button>
          </CardBody>
        </Card>
      </div>
    )
  }
}

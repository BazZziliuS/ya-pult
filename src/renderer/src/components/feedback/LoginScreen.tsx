import { motion } from 'framer-motion'
import { Button, Card, CardBody, Spinner } from '@heroui/react'
import { useI18n } from '@/i18n/I18nContext'

interface LoginScreenProps {
  onLogin: () => void
  loggingIn: boolean
  error?: string
}

export function LoginScreen({ onLogin, loggingIn, error }: LoginScreenProps): JSX.Element {
  const { t } = useI18n()
  return (
    <div className="relative flex h-[calc(100vh-64px)] items-center justify-center px-4 overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            'radial-gradient(600px circle at 50% 30%, rgba(99,102,241,0.25), transparent 60%)'
        }}
        aria-hidden
      />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md"
      >
        <Card radius="lg" shadow="sm" className="w-full border border-default-100/80">
          <CardBody className="flex flex-col items-center gap-4 py-10 px-8 text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              className="text-5xl"
              aria-hidden
            >
              🏠
            </motion.div>
            <h1 className="text-xl font-semibold">{t('login.title')}</h1>
            <p className="text-default-500 text-sm">{t('login.subtitle')}</p>
            <Button color="primary" size="lg" className="w-full" onPress={onLogin} isDisabled={loggingIn}>
              {loggingIn ? <Spinner size="sm" color="white" /> : t('login.cta')}
            </Button>
            {error && (
              <p className="text-danger text-xs flex items-center gap-1">
                <span aria-hidden>⚠️</span> {error}
              </p>
            )}
          </CardBody>
        </Card>
      </motion.div>
    </div>
  )
}

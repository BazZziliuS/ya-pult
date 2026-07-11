import { AnimatePresence, motion } from 'framer-motion'
import { Alert, Button } from '@heroui/react'
import type { ToastItem } from '@/hooks/useToasts'

interface ToastStackProps {
  toasts: ToastItem[]
  onDismiss: (id: string) => void
}

const COLOR_BY_KIND = {
  error: 'danger',
  info: 'default',
  success: 'success'
} as const

const ICON_BY_KIND = {
  error: '⚠️',
  info: 'ℹ️',
  success: '✅'
} as const

export function ToastStack({ toasts, onDismiss }: ToastStackProps): JSX.Element | null {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-80 max-w-[90vw]">
      <AnimatePresence initial={false}>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, transition: { duration: 0.15 } }}
            transition={{ duration: 0.2 }}
          >
            <Alert
              color={COLOR_BY_KIND[toast.kind]}
              variant="flat"
              icon={<span aria-hidden>{ICON_BY_KIND[toast.kind]}</span>}
              title={toast.message}
              isClosable
              onClose={() => onDismiss(toast.id)}
              endContent={
                toast.action ? (
                  <Button
                    size="sm"
                    variant="flat"
                    onPress={() => {
                      toast.action?.onPress()
                      onDismiss(toast.id)
                    }}
                  >
                    {toast.action.label}
                  </Button>
                ) : undefined
              }
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

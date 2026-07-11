import { Notification } from 'electron'
import type { NotifyPayload } from '@shared/types'

/** Нативное системное уведомление ОС. Молча игнорирует платформы без поддержки трея/уведомлений. */
export function notifyUser(payload: NotifyPayload): void {
  if (!Notification.isSupported()) return
  new Notification({
    title: payload.title,
    body: payload.body,
    urgency: payload.urgency === 'critical' ? 'critical' : 'normal',
    silent: payload.urgency !== 'critical'
  }).show()
}

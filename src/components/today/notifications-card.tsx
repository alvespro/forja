import { useNavigate } from 'react-router-dom'

import { AlertItem } from '@/components/ds/alert-item'
import { useMarkNotificationRead, useNotifications } from '@/hooks/use-notifications'

/**
 * Lembretes não lidos, um alerta por notificação — assim cada um conta
 * individualmente no limite de 2 alertas visíveis do cockpit.
 */
export function NotificationsCard() {
  const notifications = useNotifications()
  const markRead = useMarkNotificationRead()
  const navigate = useNavigate()

  const items = notifications.data ?? []
  if (items.length === 0) return null

  return (
    <>
      {items.map((n) => (
        <AlertItem
          key={n.id}
          tone="info"
          icon="notifications"
          title={n.titulo}
          body={n.corpo}
          action={n.link ? { label: 'Abrir', onClick: () => navigate(n.link!) } : undefined}
          onDismiss={() => markRead.mutate(n.id)}
        />
      ))}
    </>
  )
}

import { useNavigate } from 'react-router-dom'
import { Bell, X } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { useMarkNotificationRead, useNotifications } from '@/hooks/use-notifications'

export function NotificationsCard() {
  const notifications = useNotifications()
  const markRead = useMarkNotificationRead()
  const navigate = useNavigate()

  const items = notifications.data ?? []
  if (items.length === 0) return null

  return (
    <Card className="border-amber-700/30 bg-amber-950/10">
      <CardContent className="flex flex-col gap-2.5">
        <div className="flex items-center gap-2">
          <Bell className="size-4 text-amber-400" />
          <span className="text-sm font-semibold text-foreground">Lembretes</span>
          <span className="rounded-full bg-amber-900/50 px-1.5 py-0.5 text-[10px] font-medium text-amber-300">
            {items.length}
          </span>
        </div>
        <div className="flex flex-col gap-1.5">
          {items.map((n) => (
            <div
              key={n.id}
              className="flex items-start gap-2 rounded-md border border-border/30 bg-card/40 p-2.5"
            >
              <button
                type="button"
                onClick={() => n.link && navigate(n.link)}
                className="flex-1 min-w-0 text-left"
              >
                <p className="text-sm font-medium text-foreground">{n.titulo}</p>
                {n.corpo && <p className="mt-0.5 text-xs text-aco-texto">{n.corpo}</p>}
              </button>
              <button
                type="button"
                onClick={() => markRead.mutate(n.id)}
                title="Marcar como lida"
                className="text-aco-texto/50 hover:text-foreground shrink-0"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Icon } from '@/components/Icon'

import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { CardioDistanceChart } from '@/components/workout/cardio-distance-chart'
import { CardioForm } from '@/components/workout/cardio-form'
import { CardioGoalCard } from '@/components/workout/cardio-goal-card'
import { HeartZonesCard } from '@/components/workout/heart-zones-card'
import { useCardioSessions, useCreateCardioSession, useDeleteCardioSession } from '@/hooks/use-cardio-sessions'
import { useConfirm } from '@/hooks/use-confirm'
import { useEnsureKarvonenZones } from '@/hooks/use-heart-zones'

const TIPO_LABEL: Record<string, string> = {
  longo: 'Longo',
  intervalado: 'Intervalado',
  recuperacao: 'Recuperação',
}

export function CardioTab() {
  const sessions = useCardioSessions()
  const createSession = useCreateCardioSession()
  const deleteSession = useDeleteCardioSession()
  const [isAdding, setIsAdding] = useState(false)
  const { confirm, dialog } = useConfirm()
  const ensureKarvonenZones = useEnsureKarvonenZones()

  async function handleDelete(id: string) {
    const ok = await confirm({ title: 'Excluir este registro de cardio?' })
    if (!ok) return
    deleteSession.mutate(id)
  }

  return (
    <div className="flex flex-col gap-3">
      {dialog}
      <div className="flex items-center justify-between">
        <p className="text-sm text-aco-texto">Registre corridas e sessões de cardio.</p>
        {!isAdding && (
          <Button type="button" variant="outline" size="sm" onClick={() => setIsAdding(true)}>
            <Icon name="add" size={14} />
            Cardio
          </Button>
        )}
      </div>

      {isAdding && (
        <CardioForm
          isSubmitting={createSession.isPending}
          onCancel={() => setIsAdding(false)}
          onSubmit={(values) =>
            createSession.mutate(values, {
              onSuccess: () => {
                setIsAdding(false)
                void ensureKarvonenZones()
              },
            })
          }
        />
      )}

      <HeartZonesCard />

      {!sessions.isLoading && !sessions.isError && sessions.data && sessions.data.length > 0 && (
        <>
          <CardioGoalCard sessions={sessions.data} />
          <Card size="sm">
            <CardContent>
              <CardioDistanceChart sessions={sessions.data} />
            </CardContent>
          </Card>
        </>
      )}

      {sessions.isLoading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : sessions.isError ? (
        <ErrorState message="Não foi possível carregar o cardio." onRetry={() => sessions.refetch()} />
      ) : !sessions.data || sessions.data.length === 0 ? (
        !isAdding && <EmptyState message="Nenhuma sessão de cardio registrada ainda." />
      ) : (
        <div className="flex flex-col gap-2">
          {sessions.data.map((session) => (
            <Card key={session.id} size="sm">
              <CardContent className="flex items-center justify-between gap-2">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground">
                    {format(new Date(session.performed_at), "d 'de' MMMM", { locale: ptBR })} ·{' '}
                    {TIPO_LABEL[session.tipo ?? ''] ?? session.tipo}
                  </span>
                  <span className="font-mono text-xs text-aco-texto">
                    {session.distancia_km ?? '—'}km
                    {session.duracao_seg ? ` · ${Math.round(session.duracao_seg / 60)}min` : ''}
                    {session.zona ? ` · ${session.zona}` : ''}
                    {session.fc_media ? ` · FC ${session.fc_media}` : ''}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Excluir registro"
                  onClick={() => handleDelete(session.id)}
                >
                  <Icon name="delete" size={14} />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

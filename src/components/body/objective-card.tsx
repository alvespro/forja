import { useState } from 'react'
import { Icon } from '@/components/Icon'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { GoalEditModal } from '@/components/body/goal-edit-modal'
import { MetasModal } from '@/components/body/metas-modal'
import { useActiveBodyGoal } from '@/hooks/use-body-goals'
import { cycleDaysElapsed } from '@/lib/body-goals'
import { OBJETIVO_DESCRICAO, OBJETIVO_ICONS, OBJETIVO_LABELS } from '@/lib/body-goals'
import { diffInDays, parseDateOnly } from '@/lib/date'

export function ObjectiveCard() {
  const activeGoal = useActiveBodyGoal()
  const [isEditing, setIsEditing] = useState(false)
  const [editandoMetas, setEditandoMetas] = useState(false)

  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        {activeGoal.isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : activeGoal.isError ? (
          <ErrorState message="Não foi possível carregar o objetivo do ciclo." onRetry={() => activeGoal.refetch()} />
        ) : !activeGoal.data ? (
          <div className="flex flex-col gap-3">
            <EmptyState message="Nenhum objetivo de ciclo definido ainda." />
            <Button type="button" variant="outline" size="sm" className="self-start" onClick={() => setIsEditing(true)}>
              <Icon name="edit" size={14} />
              Definir objetivo
            </Button>
          </div>
        ) : (
          <ObjectiveContent goal={activeGoal.data} onEdit={() => setIsEditing(true)} onEditMetas={() => setEditandoMetas(true)} />
        )}
      </CardContent>

      {isEditing && (
        <GoalEditModal open={isEditing} onOpenChange={setIsEditing} currentGoal={activeGoal.data ?? null} />
      )}
      {activeGoal.data && <MetasModal open={editandoMetas} meta={activeGoal.data} onClose={() => setEditandoMetas(false)} />}
    </Card>
  )
}

function ObjectiveContent({
  goal,
  onEdit,
  onEditMetas,
}: {
  goal: NonNullable<ReturnType<typeof useActiveBodyGoal>['data']>
  onEdit: () => void
  onEditMetas: () => void
}) {
  const { objetivo, cycle } = goal
  const prazoDias = diffInDays(cycle.data_fim, cycle.data_inicio)
  const diasDecorridos = cycleDaysElapsed(cycle.data_inicio, prazoDias)
  const progresso = prazoDias > 0 ? Math.round((diasDecorridos / prazoDias) * 100) : 0

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-brasa/10 px-3 py-1 text-sm font-bold text-brasa">
            {OBJETIVO_ICONS[objetivo]} {OBJETIVO_LABELS[objetivo].toUpperCase()}
          </span>
          <span className="text-xs text-aco-texto">{cycle.nome}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" className="min-h-11" onClick={onEditMetas}>
            <Icon name="flag" size={16} />
            Editar metas
          </Button>
          <Button type="button" variant="outline" size="sm" className="min-h-11" onClick={onEdit}>
            <Icon name="edit" size={14} />
            Editar objetivo
          </Button>
        </div>
      </div>

      <p className="text-sm text-foreground">{OBJETIVO_DESCRICAO[objetivo]}</p>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between">
          <span className="text-xs text-aco-texto">Progresso do ciclo</span>
          <span className="font-mono text-xs text-aco-texto">
            dia {diasDecorridos}/{prazoDias}
          </span>
        </div>
        <Progress value={progresso} />
        <div className="flex items-baseline justify-between font-mono text-xs text-aco-texto">
          <span>{format(parseDateOnly(cycle.data_inicio), 'd MMM', { locale: ptBR })}</span>
          <span>{format(parseDateOnly(cycle.data_fim), 'd MMM', { locale: ptBR })}</span>
        </div>
      </div>
    </div>
  )
}

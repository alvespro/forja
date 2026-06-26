import { useState } from 'react'
import { ChevronDown, Pencil, Plus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { GoalForm } from '@/components/goals/goal-form'
import { KeyResultAddForm } from '@/components/goals/key-result-add-form'
import { KeyResultRow } from '@/components/goals/key-result-row'
import {
  useCreateKeyResult,
  useDeleteKeyResult,
  useUpdateKeyResult,
} from '@/hooks/use-key-results'
import { useDeleteGoal, useUpdateGoal, type GoalInput } from '@/hooks/use-goals'
import { calculateGoalProgress } from '@/lib/goal-progress'
import { cn } from '@/lib/utils'
import type { Cycle, Goal, KeyResult } from '@/types/database'

type GoalCardProps = {
  goal: Goal
  keyResults: KeyResult[]
  cycles: Cycle[]
}

export function GoalCard({ goal, keyResults, cycles }: GoalCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isAddingKeyResult, setIsAddingKeyResult] = useState(false)

  const updateGoal = useUpdateGoal()
  const deleteGoal = useDeleteGoal()
  const createKeyResult = useCreateKeyResult()
  const updateKeyResult = useUpdateKeyResult()
  const deleteKeyResult = useDeleteKeyResult()

  const progresso = calculateGoalProgress(goal, keyResults)
  const temKeyResults = keyResults.length > 0

  function handleUpdateGoal(values: GoalInput) {
    updateGoal.mutate({ id: goal.id, values }, { onSuccess: () => setIsEditing(false) })
  }

  function handleDeleteGoal() {
    if (!window.confirm(`Excluir a meta "${goal.titulo}"? Essa ação não pode ser desfeita.`)) return
    deleteGoal.mutate(goal.id)
  }

  if (isEditing) {
    return (
      <GoalForm
        goal={goal}
        defaultArea={goal.area}
        defaultCycleId={goal.cycle_id}
        cycles={cycles}
        onSubmit={handleUpdateGoal}
        onCancel={() => setIsEditing(false)}
        isSubmitting={updateGoal.isPending}
      />
    )
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex flex-1 items-start gap-2 text-left"
            aria-expanded={expanded}
          >
            <ChevronDown
              className={cn('mt-0.5 size-4 shrink-0 text-aco-texto transition-transform', expanded && 'rotate-180')}
              aria-hidden="true"
            />
            <span className="font-medium text-foreground">{goal.titulo}</span>
          </button>

          <div className="flex shrink-0 gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Editar meta ${goal.titulo}`}
              onClick={() => setIsEditing(true)}
            >
              <Pencil className="size-3.5" aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Excluir meta ${goal.titulo}`}
              onClick={handleDeleteGoal}
            >
              <Trash2 className="size-3.5" aria-hidden="true" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Progress value={progresso} className="flex-1" />
          <span className="w-10 shrink-0 text-right font-mono text-xs text-aco-texto">{progresso}%</span>
        </div>

        {expanded && (
          <div className="flex flex-col gap-3 border-t border-border pt-3">
            {(goal.resultado_rpm || goal.proposito_rpm || goal.plano_rpm) && (
              <div className="flex flex-col gap-2 text-sm">
                {goal.resultado_rpm && (
                  <p>
                    <span className="font-medium text-aco-texto">Resultado: </span>
                    {goal.resultado_rpm}
                  </p>
                )}
                {goal.proposito_rpm && (
                  <p>
                    <span className="font-medium text-aco-texto">Propósito: </span>
                    {goal.proposito_rpm}
                  </p>
                )}
                {goal.plano_rpm && (
                  <p>
                    <span className="font-medium text-aco-texto">Plano: </span>
                    {goal.plano_rpm}
                  </p>
                )}
              </div>
            )}

            <div className="flex flex-col gap-2">
              {temKeyResults && (
                <p className="text-xs font-medium text-aco-texto">Resultados-chave</p>
              )}
              {keyResults.map((kr) => (
                <KeyResultRow
                  key={kr.id}
                  keyResult={kr}
                  onUpdate={(valorAtual) =>
                    updateKeyResult.mutate({ id: kr.id, valor_atual: valorAtual })
                  }
                  onDelete={() => deleteKeyResult.mutate(kr.id)}
                />
              ))}

              {isAddingKeyResult ? (
                <KeyResultAddForm
                  isSubmitting={createKeyResult.isPending}
                  onCancel={() => setIsAddingKeyResult(false)}
                  onAdd={(values) =>
                    createKeyResult.mutate(
                      { ...values, goal_id: goal.id, valor_atual: 0 },
                      { onSuccess: () => setIsAddingKeyResult(false) },
                    )
                  }
                />
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="self-start"
                  onClick={() => setIsAddingKeyResult(true)}
                >
                  <Plus className="size-3.5" aria-hidden="true" />
                  Resultado-chave
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

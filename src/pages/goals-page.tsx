import { useMemo, useState } from 'react'
import { Icon } from '@/components/Icon'

import { ErrorState } from '@/components/feedback/error-state'
import { GoalCard } from '@/components/goals/goal-card'
import { GoalForm } from '@/components/goals/goal-form'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useCycles } from '@/hooks/use-cycles'
import { ALL_CYCLES, useCreateGoal, useGoals, type GoalInput } from '@/hooks/use-goals'
import { groupKeyResultsByGoal, useKeyResults } from '@/hooks/use-key-results'
import { AREA_OPTIONS } from '@/lib/areas'
import type { Goal, GoalArea } from '@/types/database'

export function GoalsPage() {
  const cycles = useCycles()
  const [cycleFilter, setCycleFilter] = useState<string>(ALL_CYCLES)
  const goals = useGoals(cycleFilter)
  const keyResults = useKeyResults()
  const createGoal = useCreateGoal()
  const [addingToArea, setAddingToArea] = useState<GoalArea | null>(null)

  const isLoading = goals.isLoading || keyResults.isLoading || cycles.isLoading
  const isError = goals.isError || keyResults.isError || cycles.isError
  const keyResultsByGoal = useMemo(() => groupKeyResultsByGoal(keyResults.data), [keyResults.data])

  const goalsByArea = useMemo(() => {
    const map = new Map<GoalArea, Goal[]>()
    for (const option of AREA_OPTIONS) {
      map.set(option.value, [])
    }
    for (const goal of goals.data ?? []) {
      map.get(goal.area)?.push(goal)
    }
    return map
  }, [goals.data])

  const defaultCycleId =
    cycleFilter !== ALL_CYCLES ? cycleFilter : cycles.data?.find((c) => c.ativo)?.id ?? null

  function handleCreateGoal(values: GoalInput) {
    createGoal.mutate(values, { onSuccess: () => setAddingToArea(null) })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Metas</h1>
          <p className="text-sm text-aco-texto">RPM por área, com progresso automático.</p>
        </div>

        {!cycles.isLoading && !cycles.isError && (
          <Select
            aria-label="Filtrar por ciclo"
            value={cycleFilter}
            onChange={(event) => setCycleFilter(event.target.value)}
            className="w-48"
          >
            <option value={ALL_CYCLES}>Todos os ciclos</option>
            {cycles.data?.map((cycle) => (
              <option key={cycle.id} value={cycle.id}>
                {cycle.nome}
              </option>
            ))}
          </Select>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : isError ? (
        <ErrorState
          message="Não foi possível carregar as metas."
          onRetry={() => {
            goals.refetch()
            keyResults.refetch()
            cycles.refetch()
          }}
        />
      ) : (
        <div className="flex flex-col gap-6">
          {AREA_OPTIONS.map((option) => {
            const areaGoals = goalsByArea.get(option.value) ?? []

            return (
              <section key={option.value} className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-aco-texto">
                    {option.label}
                  </h2>
                  {addingToArea !== option.value && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setAddingToArea(option.value)}
                    >
                      <Icon name="add" size={14} />
                      Nova meta
                    </Button>
                  )}
                </div>

                {addingToArea === option.value && (
                  <GoalForm
                    defaultArea={option.value}
                    defaultCycleId={defaultCycleId}
                    cycles={cycles.data ?? []}
                    onSubmit={handleCreateGoal}
                    onCancel={() => setAddingToArea(null)}
                    isSubmitting={createGoal.isPending}
                  />
                )}

                {areaGoals.length === 0 && addingToArea !== option.value ? (
                  <div className="flex min-h-14 items-center justify-between gap-3 rounded-[var(--r-md)] border border-dashed border-linha bg-aco/45 px-3">
                    <p className="text-sm text-cinza">Nenhuma meta em {option.label.toLowerCase()}.</p>
                    <Button type="button" variant="ghost" size="sm" className="min-h-11 shrink-0" onClick={() => setAddingToArea(option.value)}>
                      <Icon name="add" size={15} /> Adicionar
                    </Button>
                  </div>
                ) : (
                  areaGoals.map((goal) => (
                    <GoalCard
                      key={goal.id}
                      goal={goal}
                      keyResults={keyResultsByGoal.get(goal.id) ?? []}
                      cycles={cycles.data ?? []}
                    />
                  ))
                )}
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}

import { useMemo } from 'react'
import { Icon } from '@/components/Icon'

import { BodyMap, type MuscleState } from '@/components/BodyMap'
import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'
import { Skeleton } from '@/components/ui/skeleton'
import { useWorkoutSessions } from '@/hooks/use-workout-sessions'
import { useWorkouts } from '@/hooks/use-workouts'
import { resolveGroupKeys, type MuscleKey } from '@/lib/muscle-groups'
import { cn } from '@/lib/utils'
import { computeMuscleGroupFreshness, muscleStatesFromFreshness } from '@/lib/workout-frequency'

const LEGENDA: { estado: MuscleState; label: string; cor: string }[] = [
  { estado: 'ativo', label: 'Hoje', cor: 'var(--brasa)' },
  { estado: 'recente', label: '< 3 dias', cor: 'var(--ok)' },
  { estado: 'descansado', label: '> 7 dias', cor: 'var(--alerta)' },
]

/** Aba "Corpo": quais músculos foram estimulados e quais precisam de atenção. */
export function FrequencyPanel() {
  const workouts = useWorkouts()
  const sessions = useWorkoutSessions()

  const isLoading = workouts.isLoading || sessions.isLoading
  const isError = workouts.isError || sessions.isError

  const freshness = useMemo(
    () => computeMuscleGroupFreshness(workouts.data ?? [], sessions.data ?? []),
    [workouts.data, sessions.data],
  )
  const estados = useMemo(
    () => muscleStatesFromFreshness(freshness, resolveGroupKeys) as Partial<Record<MuscleKey, MuscleState>>,
    [freshness],
  )

  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-4">
        <Skeleton className="h-64 w-32 rounded-[var(--radius-xl)]" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  if (isError) {
    return (
      <ErrorState
        message="Não foi possível carregar a frequência."
        onRetry={() => {
          workouts.refetch()
          sessions.refetch()
        }}
      />
    )
  }

  if (freshness.length === 0) {
    return (
      <EmptyState
        message="Nenhum treino com foco definido"
        description="Defina o foco de cada treino (ex.: Costas e Bíceps) para ver o mapa de estímulo."
      />
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col items-center gap-4 rounded-[var(--radius-lg)] bg-card px-4 py-6">
        <BodyMap size="lg" interativo estados={estados} />
        <div className="flex flex-wrap justify-center gap-3">
          {LEGENDA.map((l) => (
            <span key={l.estado} className="flex items-center gap-1.5 ds-body-sm text-aco-texto">
              <span className="size-2.5 rounded-full" style={{ backgroundColor: l.cor }} aria-hidden="true" />
              {l.label}
            </span>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <span className="ds-label">Estímulo por treino</span>
        <ul className="flex flex-col divide-y divide-linha rounded-[var(--radius-lg)] bg-card">
          {freshness.map((group) => (
            <li key={group.foco} className="flex min-h-12 items-center justify-between gap-3 px-4 py-2">
              <span className="ds-body-md truncate text-foreground">{group.foco}</span>
              <span
                className={cn(
                  'flex shrink-0 items-center gap-1 ds-data-md',
                  group.alerta ? 'text-alerta-texto' : 'text-aco-texto',
                )}
              >
                {group.alerta && <Icon name="warning" size={14} />}
                {group.diasSemEstimulo === null
                  ? 'sem registro'
                  : group.diasSemEstimulo === 0
                    ? 'hoje'
                    : `há ${group.diasSemEstimulo} dia${group.diasSemEstimulo === 1 ? '' : 's'}`}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

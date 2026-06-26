import { TriangleAlert } from 'lucide-react'

import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { useCardioSessions } from '@/hooks/use-cardio-sessions'
import { useWorkoutSessions } from '@/hooks/use-workout-sessions'
import { useWorkouts } from '@/hooks/use-workouts'
import { cn } from '@/lib/utils'
import {
  computeMuscleGroupFreshness,
  CORRIDA_WEEKLY_GOAL,
  countCardioThisWeek,
  countSessionsThisWeek,
  FORCA_WEEKLY_GOAL,
} from '@/lib/workout-frequency'

export function FrequencyPanel() {
  const workouts = useWorkouts()
  const sessions = useWorkoutSessions()
  const cardioSessions = useCardioSessions()

  const isLoading = workouts.isLoading || sessions.isLoading || cardioSessions.isLoading
  const isError = workouts.isError || sessions.isError || cardioSessions.isError

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
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
          cardioSessions.refetch()
        }}
      />
    )
  }

  const sessionsThisWeek = countSessionsThisWeek(sessions.data ?? [])
  const cardioThisWeek = countCardioThisWeek(cardioSessions.data ?? [])
  const freshness = computeMuscleGroupFreshness(workouts.data ?? [], sessions.data ?? [])

  return (
    <div className="flex flex-col gap-3">
      <Card>
        <CardContent className="flex flex-col gap-3">
          <p className="text-xs font-medium uppercase tracking-wide text-aco-texto">Frequência semanal</p>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-foreground">Força</span>
              <span className="font-mono text-aco-texto">
                {sessionsThisWeek}/{FORCA_WEEKLY_GOAL}
              </span>
            </div>
            <Progress value={Math.min(100, (sessionsThisWeek / FORCA_WEEKLY_GOAL) * 100)} />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-foreground">Corrida / cardio</span>
              <span className="font-mono text-aco-texto">
                {cardioThisWeek}/{CORRIDA_WEEKLY_GOAL}
              </span>
            </div>
            <Progress value={Math.min(100, (cardioThisWeek / CORRIDA_WEEKLY_GOAL) * 100)} />
          </div>
        </CardContent>
      </Card>

      {freshness.length === 0 ? (
        <EmptyState message="Cadastre treinos com um foco para acompanhar a frequência por grupo." />
      ) : (
        <Card>
          <CardContent className="flex flex-col gap-2">
            <p className="text-xs font-medium uppercase tracking-wide text-aco-texto">Estímulo por grupo</p>
            {freshness.map((group) => (
              <div key={group.foco} className="flex items-center justify-between gap-2 text-sm">
                <span className="text-foreground">{group.foco}</span>
                <span
                  className={cn(
                    'flex items-center gap-1 font-mono text-xs',
                    group.alerta ? 'text-alerta' : 'text-aco-texto',
                  )}
                >
                  {group.alerta && <TriangleAlert className="size-3.5" aria-hidden="true" />}
                  {group.diasSemEstimulo === null
                    ? 'sem registro'
                    : `${group.diasSemEstimulo} dia(s) sem estímulo`}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

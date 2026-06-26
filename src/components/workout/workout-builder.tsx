import { useState } from 'react'
import { Plus } from 'lucide-react'

import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { WorkoutCard } from '@/components/workout/workout-card'
import { WorkoutForm } from '@/components/workout/workout-form'
import { useExercises } from '@/hooks/use-exercises'
import { useCreateWorkout, useWorkouts } from '@/hooks/use-workouts'

export function WorkoutBuilder() {
  const workouts = useWorkouts()
  const exercises = useExercises()
  const createWorkout = useCreateWorkout()
  const [isAdding, setIsAdding] = useState(false)

  const isLoading = workouts.isLoading || exercises.isLoading
  const isError = workouts.isError || exercises.isError

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-aco-texto">Monte seus treinos e prescreva os exercícios de cada um.</p>
        {!isAdding && (
          <Button type="button" variant="outline" size="sm" onClick={() => setIsAdding(true)}>
            <Plus className="size-3.5" aria-hidden="true" />
            Treino
          </Button>
        )}
      </div>

      {isAdding && (
        <WorkoutForm
          defaultOrdem={(workouts.data?.length ?? 0) + 1}
          isSubmitting={createWorkout.isPending}
          onCancel={() => setIsAdding(false)}
          onSubmit={(values) => createWorkout.mutate(values, { onSuccess: () => setIsAdding(false) })}
        />
      )}

      {isLoading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : isError ? (
        <ErrorState
          message="Não foi possível carregar os treinos."
          onRetry={() => {
            workouts.refetch()
            exercises.refetch()
          }}
        />
      ) : !workouts.data || workouts.data.length === 0 ? (
        !isAdding && <EmptyState message="Nenhum treino cadastrado ainda." />
      ) : (
        <div className="flex flex-col gap-3">
          {workouts.data.map((workout) => (
            <WorkoutCard key={workout.id} workout={workout} exercises={exercises.data ?? []} />
          ))}
        </div>
      )}
    </div>
  )
}

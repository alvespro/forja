import { useState } from 'react'
import { Plus } from 'lucide-react'

import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ExerciseCard } from '@/components/workout/exercise-card'
import { ExerciseForm } from '@/components/workout/exercise-form'
import { useCreateExercise, useExercises } from '@/hooks/use-exercises'

export function ExerciseLibrary() {
  const exercises = useExercises()
  const createExercise = useCreateExercise()
  const [isAdding, setIsAdding] = useState(false)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-aco-texto">Cadastre exercícios com vídeo de execução.</p>
        {!isAdding && (
          <Button type="button" variant="outline" size="sm" onClick={() => setIsAdding(true)}>
            <Plus className="size-3.5" aria-hidden="true" />
            Exercício
          </Button>
        )}
      </div>

      {isAdding && (
        <ExerciseForm
          isSubmitting={createExercise.isPending}
          onCancel={() => setIsAdding(false)}
          onSubmit={(values) => createExercise.mutate(values, { onSuccess: () => setIsAdding(false) })}
        />
      )}

      {exercises.isLoading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : exercises.isError ? (
        <ErrorState
          message="Não foi possível carregar os exercícios."
          onRetry={() => exercises.refetch()}
        />
      ) : !exercises.data || exercises.data.length === 0 ? (
        !isAdding && <EmptyState message="Nenhum exercício cadastrado ainda." />
      ) : (
        <div className="flex flex-col gap-3">
          {exercises.data.map((exercise) => (
            <ExerciseCard key={exercise.id} exercise={exercise} />
          ))}
        </div>
      )}
    </div>
  )
}

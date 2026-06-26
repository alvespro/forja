import { useState } from 'react'
import { ChevronDown, Pencil, Plus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/feedback/empty-state'
import { WorkoutExerciseForm } from '@/components/workout/workout-exercise-form'
import { WorkoutExerciseRow } from '@/components/workout/workout-exercise-row'
import { WorkoutForm } from '@/components/workout/workout-form'
import { useCreateWorkoutExercise, useWorkoutExercises } from '@/hooks/use-workout-exercises'
import { useDeleteWorkout, useUpdateWorkout } from '@/hooks/use-workouts'
import { useConfirm } from '@/hooks/use-confirm'
import { cn } from '@/lib/utils'
import type { Exercise, Workout } from '@/types/database'

type WorkoutCardProps = {
  workout: Workout
  exercises: Exercise[]
}

export function WorkoutCard({ workout, exercises }: WorkoutCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isAddingExercise, setIsAddingExercise] = useState(false)

  const prescriptions = useWorkoutExercises(workout.id)
  const updateWorkout = useUpdateWorkout()
  const deleteWorkout = useDeleteWorkout()
  const createPrescription = useCreateWorkoutExercise()
  const { confirm, dialog } = useConfirm()

  const exercisesById = new Map(exercises.map((exercise) => [exercise.id, exercise]))

  async function handleDelete() {
    const ok = await confirm({
      title: `Excluir o treino "${workout.nome}"?`,
      description: 'Essa ação não pode ser desfeita.',
    })
    if (!ok) return
    deleteWorkout.mutate(workout.id)
  }

  if (isEditing) {
    return (
      <WorkoutForm
        workout={workout}
        defaultOrdem={workout.ordem}
        isSubmitting={updateWorkout.isPending}
        onCancel={() => setIsEditing(false)}
        onSubmit={(values) =>
          updateWorkout.mutate({ id: workout.id, values }, { onSuccess: () => setIsEditing(false) })
        }
      />
    )
  }

  return (
    <>
      {dialog}
      <Card>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex min-w-0 flex-1 items-start gap-2 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            aria-expanded={expanded}
          >
            <ChevronDown
              className={cn('mt-0.5 size-4 shrink-0 text-aco-texto transition-transform', expanded && 'rotate-180')}
              aria-hidden="true"
            />
            <div className="flex min-w-0 flex-col">
              <span className="truncate font-medium text-foreground">{workout.nome}</span>
              {workout.foco && <span className="truncate text-xs text-aco-texto">{workout.foco}</span>}
            </div>
          </button>

          <div className="flex shrink-0 items-center gap-3">
            {!workout.ativo && <span className="text-xs text-aco-texto">inativo</span>}
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Editar treino ${workout.nome}`}
              onClick={() => setIsEditing(true)}
            >
              <Pencil className="size-3.5" aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Excluir treino ${workout.nome}`}
              onClick={handleDelete}
            >
              <Trash2 className="size-3.5" aria-hidden="true" />
            </Button>
          </div>
        </div>

        {expanded && (
          <div className="flex flex-col gap-2 border-t border-border pt-3">
            {prescriptions.isLoading ? (
              <p className="text-xs text-aco-texto">Carregando prescrição...</p>
            ) : prescriptions.isError ? (
              <p className="text-xs text-alerta">Não foi possível carregar a prescrição.</p>
            ) : prescriptions.data && prescriptions.data.length > 0 ? (
              prescriptions.data.map((prescription) => (
                <WorkoutExerciseRow
                  key={prescription.id}
                  prescription={prescription}
                  exercise={exercisesById.get(prescription.exercise_id)}
                  exercises={exercises}
                />
              ))
            ) : (
              !isAddingExercise && <EmptyState message="Nenhum exercício prescrito ainda." />
            )}

            {isAddingExercise ? (
              <WorkoutExerciseForm
                workoutId={workout.id}
                exercises={exercises}
                defaultOrdem={(prescriptions.data?.length ?? 0) + 1}
                isSubmitting={createPrescription.isPending}
                onCancel={() => setIsAddingExercise(false)}
                onSubmit={(values) =>
                  createPrescription.mutate(values, { onSuccess: () => setIsAddingExercise(false) })
                }
              />
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="self-start"
                onClick={() => setIsAddingExercise(true)}
              >
                <Plus className="size-3.5" aria-hidden="true" />
                Exercício
              </Button>
            )}
          </div>
        )}
      </CardContent>
      </Card>
    </>
  )
}

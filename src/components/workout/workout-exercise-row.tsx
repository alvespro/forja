import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { WorkoutExerciseForm } from '@/components/workout/workout-exercise-form'
import {
  useDeleteWorkoutExercise,
  useUpdateWorkoutExercise,
} from '@/hooks/use-workout-exercises'
import type { Exercise, WorkoutExercise } from '@/types/database'

type WorkoutExerciseRowProps = {
  prescription: WorkoutExercise
  exercise: Exercise | undefined
  exercises: Exercise[]
}

export function WorkoutExerciseRow({ prescription, exercise, exercises }: WorkoutExerciseRowProps) {
  const [isEditing, setIsEditing] = useState(false)
  const updatePrescription = useUpdateWorkoutExercise()
  const deletePrescription = useDeleteWorkoutExercise()

  function handleDelete() {
    if (!window.confirm(`Remover ${exercise?.nome ?? 'exercício'} deste treino?`)) return
    deletePrescription.mutate({ id: prescription.id, workoutId: prescription.workout_id })
  }

  if (isEditing) {
    return (
      <WorkoutExerciseForm
        workoutId={prescription.workout_id}
        exercises={exercises}
        defaultOrdem={prescription.ordem}
        prescription={prescription}
        isSubmitting={updatePrescription.isPending}
        onCancel={() => setIsEditing(false)}
        onSubmit={(values) =>
          updatePrescription.mutate(
            { id: prescription.id, values },
            { onSuccess: () => setIsEditing(false) },
          )
        }
      />
    )
  }

  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card/40 px-3 py-2">
      <div className="flex flex-col">
        <span className="text-sm font-medium text-foreground">{exercise?.nome ?? 'Exercício removido'}</span>
        <span className="font-mono text-xs text-aco-texto">
          {prescription.series_alvo ?? '—'}x{prescription.reps_alvo ?? '—'} · pausa{' '}
          {prescription.pausa_alvo_seg ?? '—'}s
          {prescription.cadencia_alvo ? ` · cadência ${prescription.cadencia_alvo}` : ''}
        </span>
      </div>
      <div className="flex shrink-0 gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Editar prescrição"
          onClick={() => setIsEditing(true)}
        >
          <Pencil className="size-3.5" aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Remover prescrição"
          onClick={handleDelete}
        >
          <Trash2 className="size-3.5" aria-hidden="true" />
        </Button>
      </div>
    </div>
  )
}

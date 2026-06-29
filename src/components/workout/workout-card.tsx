import { useState } from 'react'
import { ChevronDown, Pencil, Play, Plus, Trash2, TriangleAlert } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/feedback/empty-state'
import { WorkoutExerciseForm } from '@/components/workout/workout-exercise-form'
import { WorkoutExerciseRow } from '@/components/workout/workout-exercise-row'
import { WorkoutForm } from '@/components/workout/workout-form'
import { useActiveSession } from '@/hooks/use-active-session'
import { useConfirm } from '@/hooks/use-confirm'
import {
  useCreateWorkoutExercise,
  useUpdateWorkoutExercise,
  useWorkoutExercises,
} from '@/hooks/use-workout-exercises'
import { useCreateWorkoutSession, useWorkoutSessions } from '@/hooks/use-workout-sessions'
import { useDeleteWorkout, useUpdateWorkout } from '@/hooks/use-workouts'
import { cn } from '@/lib/utils'
import { daysSince } from '@/lib/nutrition'
import type { Exercise, Workout } from '@/types/database'

const DIAS_ALERTA = 7

type WorkoutCardProps = {
  workout: Workout
  exercises: Exercise[]
  onStartSession?: () => void
}

export function WorkoutCard({ workout, exercises, onStartSession }: WorkoutCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isAddingExercise, setIsAddingExercise] = useState(false)

  const prescriptions = useWorkoutExercises(workout.id)
  const allSessions = useWorkoutSessions()
  const updateWorkout = useUpdateWorkout()
  const deleteWorkout = useDeleteWorkout()
  const createPrescription = useCreateWorkoutExercise()
  const updatePrescriptionOrder = useUpdateWorkoutExercise()
  const createSession = useCreateWorkoutSession()
  const { setSessionId } = useActiveSession()
  const { confirm, dialog } = useConfirm()

  const exercisesById = new Map(exercises.map((exercise) => [exercise.id, exercise]))

  const lastSession = allSessions.data?.find((session) => session.workout_id === workout.id)
  const diasSemRealizar = lastSession ? daysSince(lastSession.performed_at.slice(0, 10)) : null
  const alerta = diasSemRealizar !== null && diasSemRealizar > DIAS_ALERTA

  function handleMove(fromIndex: number, toIndex: number) {
    const list = prescriptions.data
    if (!list || toIndex < 0 || toIndex >= list.length) return
    const a = list[fromIndex]
    const b = list[toIndex]
    updatePrescriptionOrder.mutate({
      id: a.id,
      values: {
        workout_id: a.workout_id,
        exercise_id: a.exercise_id,
        ordem: b.ordem,
        series_alvo: a.series_alvo,
        reps_alvo: a.reps_alvo,
        pausa_alvo_seg: a.pausa_alvo_seg,
        cadencia_alvo: a.cadencia_alvo,
        notas: a.notas,
      },
    })
    updatePrescriptionOrder.mutate({
      id: b.id,
      values: {
        workout_id: b.workout_id,
        exercise_id: b.exercise_id,
        ordem: a.ordem,
        series_alvo: b.series_alvo,
        reps_alvo: b.reps_alvo,
        pausa_alvo_seg: b.pausa_alvo_seg,
        cadencia_alvo: b.cadencia_alvo,
        notas: b.notas,
      },
    })
  }

  function handleIniciar() {
    createSession.mutate(workout.id, {
      onSuccess: (session) => {
        setSessionId(session.id)
        onStartSession?.()
      },
    })
  }

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
              {workout.foco && (
                <span className="truncate text-xs text-aco-texto">
                  {workout.foco} · {prescriptions.data?.length ?? 0} exercício
                  {(prescriptions.data?.length ?? 0) === 1 ? '' : 's'}
                </span>
              )}
              <span className={cn('flex items-center gap-1 font-mono text-xs', alerta ? 'text-alerta' : 'text-aco-texto')}>
                {alerta && <TriangleAlert className="size-3 shrink-0" aria-hidden="true" />}
                {diasSemRealizar === null
                  ? 'Nunca realizado'
                  : diasSemRealizar === 0
                    ? 'Último treino: hoje'
                    : `Último treino: ${diasSemRealizar} dia${diasSemRealizar === 1 ? '' : 's'} atrás`}
              </span>
            </div>
          </button>

          <div className="flex shrink-0 items-center gap-2">
            {!workout.ativo && <span className="text-xs text-aco-texto">inativo</span>}
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={createSession.isPending}
              onClick={handleIniciar}
            >
              <Play className="size-3.5" aria-hidden="true" />
              Iniciar
            </Button>
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
              prescriptions.data.map((prescription, index) => (
                <WorkoutExerciseRow
                  key={prescription.id}
                  prescription={prescription}
                  exercise={exercisesById.get(prescription.exercise_id)}
                  exercises={exercises}
                  isFirst={index === 0}
                  isLast={index === prescriptions.data!.length - 1}
                  onMoveUp={() => handleMove(index, index - 1)}
                  onMoveDown={() => handleMove(index, index + 1)}
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

import { useState } from 'react'
import { ChevronDown, Pencil, Play, Plus, Trash2, TriangleAlert } from 'lucide-react'

import { Button } from '@/components/ui/button'
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
import { toSaoPauloDateString } from '@/lib/date'
import { gradientForGroup } from '@/lib/muscle-groups'
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
  // Data da sessão no fuso de São Paulo (slice do timestamp daria a data em UTC).
  const diasSemRealizar = lastSession ? daysSince(toSaoPauloDateString(lastSession.performed_at)) : null
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
      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-linha bg-card">
        {/* Capa: gradiente de identidade do foco, nome grande, badges e play */}
        <div
          className="relative isolate flex min-h-36 flex-col justify-end gap-3 p-4"
          style={{ background: gradientForGroup(workout.foco) }}
        >
          <div
            className="absolute inset-0 -z-10"
            style={{ background: 'linear-gradient(180deg, transparent 20%, rgba(11,18,32,0.85) 100%)' }}
            aria-hidden="true"
          />

          <div className="absolute right-2 top-2 flex items-center gap-1">
            {!workout.ativo && <span className="rounded-full bg-black/35 px-2 py-0.5 ds-data-sm text-aco-texto">inativo</span>}
            <button
              type="button"
              aria-label={`Editar treino ${workout.nome}`}
              onClick={() => setIsEditing(true)}
              className="flex size-10 items-center justify-center rounded-full text-nevoa/70 outline-none hover:bg-black/30 hover:text-nevoa focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Pencil className="size-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label={`Excluir treino ${workout.nome}`}
              onClick={handleDelete}
              className="flex size-10 items-center justify-center rounded-full text-nevoa/70 outline-none hover:bg-black/30 hover:text-nevoa focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Trash2 className="size-4" aria-hidden="true" />
            </button>
          </div>

          <div className="flex items-end justify-between gap-3">
            <div className="flex min-w-0 flex-col gap-2">
              <h3 className="ds-h3 line-clamp-2 text-foreground">{workout.nome}</h3>
              <div className="flex flex-wrap gap-1.5">
                {workout.foco && (
                  <span className="rounded-full bg-black/35 px-2.5 py-1 ds-data-sm text-nevoa">{workout.foco}</span>
                )}
                <span
                  className={cn(
                    'flex items-center gap-1 rounded-full px-2.5 py-1 ds-data-sm',
                    alerta ? 'bg-atencao/25 text-atencao' : 'bg-black/35 text-nevoa',
                  )}
                >
                  {alerta && <TriangleAlert className="size-3" aria-hidden="true" />}
                  {diasSemRealizar === null
                    ? 'nunca feito'
                    : diasSemRealizar === 0
                      ? 'hoje'
                      : `há ${diasSemRealizar} dia${diasSemRealizar === 1 ? '' : 's'}`}
                </span>
                <span className="rounded-full bg-black/35 px-2.5 py-1 ds-data-sm text-nevoa">
                  {prescriptions.data?.length ?? 0} exercício{(prescriptions.data?.length ?? 0) === 1 ? '' : 's'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleIniciar}
              disabled={createSession.isPending}
              aria-label={`Iniciar ${workout.nome}`}
              className="ds-pressable flex size-12 shrink-0 items-center justify-center rounded-full bg-brasa text-meia-noite shadow-[var(--shadow-brasa)] outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
            >
              <Play className="size-5 fill-current" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Prescrição (expansível) */}
        <div className="flex flex-col gap-3 px-4 py-2">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="flex min-h-11 items-center justify-between gap-2 ds-body-sm font-semibold text-aco-texto outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            {expanded ? 'Ocultar exercícios' : 'Ver exercícios'}
            <ChevronDown className={cn('size-4 transition-transform', expanded && 'rotate-180')} aria-hidden="true" />
          </button>

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
        </div>
      </div>
    </>
  )
}

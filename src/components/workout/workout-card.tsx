import { useState } from 'react'
import { Icon } from '@/components/Icon'

import { StatusDot } from '@/components/ds/status-dot'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/feedback/empty-state'
import { WorkoutExerciseForm } from '@/components/workout/workout-exercise-form'
import { WorkoutExerciseRow } from '@/components/workout/workout-exercise-row'
import { WorkoutForm } from '@/components/workout/workout-form'
import { useActiveSession } from '@/hooks/use-active-session'
import { useConfirm } from '@/hooks/use-confirm'
import {
  inputDaPrescricao,
  useCreateWorkoutExercise,
  useUpdateWorkoutExercise,
  useWorkoutExercises,
} from '@/hooks/use-workout-exercises'
import { useCreateWorkoutSession, useWorkoutSessions } from '@/hooks/use-workout-sessions'
import { useDeleteWorkout, useUpdateWorkout } from '@/hooks/use-workouts'
import { MobilidadeBadge } from '@/components/workout/session/phase-views'
import { minutosMobilidade } from '@/lib/workout-phases'
import { cn } from '@/lib/utils'
import { toSaoPauloDateString } from '@/lib/date'
import { daysSince } from '@/lib/nutrition'
import type { Exercise, Workout } from '@/types/database'

const DIAS_ALERTA = 7

type WorkoutCardProps = {
  workout: Workout
  /** Posição na lista, para o label numerado ("01"). */
  numero?: number
  exercises: Exercise[]
  onStartSession?: () => void
}

export function WorkoutCard({ workout, numero, exercises, onStartSession }: WorkoutCardProps) {
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
      values: { ...inputDaPrescricao(a), ordem: b.ordem },
    })
    updatePrescriptionOrder.mutate({
      id: b.id,
      values: { ...inputDaPrescricao(b), ordem: a.ordem },
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
      <div className="overflow-hidden rounded-[var(--r-md)] border border-linha bg-aco">
        {/* Cabeçalho: label numerado, nome, "há X dias" e play */}
        <div className="relative flex flex-col gap-3 p-4">
          <div className="flex min-h-10 items-center justify-between gap-2">
            <span className="ds-terminal-sm flex min-w-0 items-center gap-2 text-cinza">
              {numero != null && <span className="text-cinza2-texto">{String(numero).padStart(2, '0')}</span>}
              <span className="truncate">{workout.foco ?? 'Treino'}</span>
              {!workout.ativo && <span className="text-cinza2-texto">· inativo</span>}
            </span>
            <span className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              aria-label={`Editar treino ${workout.nome}`}
              onClick={() => setIsEditing(true)}
              className="flex size-11 items-center justify-center rounded-full text-cinza outline-none hover:bg-aco2 hover:text-nevoa focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Icon name="edit" size={16} />
            </button>
            <button
              type="button"
              aria-label={`Excluir treino ${workout.nome}`}
              onClick={handleDelete}
              className="flex size-11 items-center justify-center rounded-full text-cinza outline-none hover:bg-aco2 hover:text-nevoa focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Icon name="delete" size={16} />
            </button>
            </span>
          </div>

          <div className="flex items-end justify-between gap-3">
            <div className="flex min-w-0 flex-col gap-2">
              <h3 className="line-clamp-2 text-[18px] font-bold leading-tight text-nevoa">{workout.nome}</h3>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                <span className="text-[12px] tabular-nums text-cinza [font-family:var(--font-display)]">
                  {diasSemRealizar === null
                    ? 'nunca feito'
                    : diasSemRealizar === 0
                      ? 'hoje'
                      : `há ${diasSemRealizar} dia${diasSemRealizar === 1 ? '' : 's'}`}
                </span>
                <span className="text-[12px] tabular-nums text-cinza [font-family:var(--font-display)]">
                  {prescriptions.data?.length ?? 0} exercício{(prescriptions.data?.length ?? 0) === 1 ? '' : 's'}
                </span>
                <MobilidadeBadge minutos={minutosMobilidade(prescriptions.data ?? [])} />
                {alerta && <StatusDot color="alerta" pulse label="Atrasado" colorLabel />}
              </div>
            </div>

            <button
              type="button"
              onClick={handleIniciar}
              disabled={createSession.isPending}
              aria-label={`Iniciar ${workout.nome}`}
              className="ds-pressable flex size-11 shrink-0 items-center justify-center rounded-full bg-brasa text-fundo shadow-[var(--shadow-brasa)] outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
            >
              <Icon name="play_arrow" size={20} filled />
            </button>
          </div>
        </div>

        {/* Prescrição (expansível) */}
        <div className="flex flex-col gap-3 border-t border-linha px-4 py-2">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="flex min-h-11 items-center justify-between gap-2 ds-body-sm font-semibold text-aco-texto outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            {expanded ? 'Ocultar exercícios' : 'Ver exercícios'}
            <Icon name="expand_more" size={16} className={cn('size-4 transition-transform', expanded && 'rotate-180')} />
          </button>

        {expanded && (
          <div className="flex flex-col gap-2 border-t border-border pt-3">
            {prescriptions.isLoading ? (
              <p className="text-xs text-aco-texto">Carregando prescrição...</p>
            ) : prescriptions.isError ? (
              <p className="text-xs text-alerta-texto">Não foi possível carregar a prescrição.</p>
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
                <Icon name="add" size={14} />
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

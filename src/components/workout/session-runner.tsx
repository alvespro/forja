import { useMemo, useState } from 'react'

import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { FreeTimer } from '@/components/workout/free-timer'
import { RestTimer } from '@/components/workout/rest-timer'
import { SessionExerciseBlock } from '@/components/workout/session-exercise-block'
import { useActiveSession } from '@/hooks/use-active-session'
import { useExercises } from '@/hooks/use-exercises'
import { useLastSetLogByExercise, useSetLogsForSession, useUpdateSetLogPausa } from '@/hooks/use-set-logs'
import { useWakeLock } from '@/hooks/use-wake-lock'
import { useWorkoutExercises } from '@/hooks/use-workout-exercises'
import {
  useCreateWorkoutSession,
  useFinishWorkoutSession,
  useWorkoutSession,
} from '@/hooks/use-workout-sessions'
import { useWorkouts } from '@/hooks/use-workouts'
import type { Exercise, SetLog } from '@/types/database'

export function SessionRunner() {
  const { sessionId, setSessionId } = useActiveSession()
  const workouts = useWorkouts()
  const exercises = useExercises()
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string>('')
  const [showFreeTimer, setShowFreeTimer] = useState(false)

  const createSession = useCreateWorkoutSession()

  if (!sessionId) {
    const activeWorkouts = workouts.data?.filter((w) => w.ativo) ?? []

    return (
      <div className="flex flex-col gap-3">
        {showFreeTimer ? (
          <FreeTimer />
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="self-start"
            onClick={() => setShowFreeTimer(true)}
          >
            Cronômetro livre
          </Button>
        )}

        {workouts.isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : workouts.isError ? (
          <ErrorState message="Não foi possível carregar os treinos." onRetry={() => workouts.refetch()} />
        ) : activeWorkouts.length === 0 ? (
          <EmptyState message="Cadastre um treino na aba 'Treinos' antes de iniciar uma sessão." />
        ) : (
          <div className="flex flex-wrap items-end gap-2 rounded-lg border border-border bg-card/40 p-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="sr-workout" className="text-xs text-aco-texto">
                Escolha o treino
              </label>
              <Select
                id="sr-workout"
                className="w-56"
                value={selectedWorkoutId}
                onChange={(event) => setSelectedWorkoutId(event.target.value)}
              >
                <option value="">Selecione...</option>
                {activeWorkouts.map((workout) => (
                  <option key={workout.id} value={workout.id}>
                    {workout.nome}
                  </option>
                ))}
              </Select>
            </div>
            <Button
              type="button"
              disabled={!selectedWorkoutId || createSession.isPending}
              onClick={() =>
                createSession.mutate(selectedWorkoutId, {
                  onSuccess: (session) => setSessionId(session.id),
                })
              }
            >
              {createSession.isPending ? 'Iniciando…' : 'Iniciar sessão'}
            </Button>
          </div>
        )}
      </div>
    )
  }

  return (
    <ActiveSession
      sessionId={sessionId}
      exercises={exercises.data ?? []}
      onEndSession={() => setSessionId(null)}
    />
  )
}

type ActiveSessionProps = {
  sessionId: string
  exercises: Exercise[]
  onEndSession: () => void
}

function ActiveSession({ sessionId, exercises, onEndSession }: ActiveSessionProps) {
  const session = useWorkoutSession(sessionId)
  const prescriptions = useWorkoutExercises(session.data?.workout_id ?? '')
  const logs = useSetLogsForSession(sessionId)
  const exerciseIds = useMemo(() => prescriptions.data?.map((p) => p.exercise_id) ?? [], [prescriptions.data])
  const lastLogs = useLastSetLogByExercise(exerciseIds)
  const finishSession = useFinishWorkoutSession()
  const updateSetLogPausa = useUpdateSetLogPausa()

  useWakeLock(true)

  const [isFinishing, setIsFinishing] = useState(false)
  const [esforco, setEsforco] = useState('')
  const [notas, setNotas] = useState('')
  const [activeRest, setActiveRest] = useState<{ logId: string; targetSeconds: number } | null>(null)

  function handleSetCompleted(log: SetLog, pausaAlvoSeg: number | null) {
    if (pausaAlvoSeg && pausaAlvoSeg > 0) {
      setActiveRest({ logId: log.id, targetSeconds: pausaAlvoSeg })
    }
  }

  function handleRestFinish(elapsedSeconds: number) {
    if (!activeRest) return
    updateSetLogPausa.mutate({ id: activeRest.logId, sessionId, pausaSeg: elapsedSeconds })
    setActiveRest(null)
  }

  const exercisesById = useMemo(() => new Map(exercises.map((exercise) => [exercise.id, exercise])), [exercises])
  const logsByExercise = useMemo(() => {
    const map = new Map<string, SetLog[]>()
    for (const log of logs.data ?? []) {
      const list = map.get(log.exercise_id) ?? []
      list.push(log)
      map.set(log.exercise_id, list)
    }
    return map
  }, [logs.data])

  function handleFinish() {
    if (!session.data) return
    const startedAt = new Date(session.data.performed_at).getTime()
    const duracaoSeg = Math.max(0, Math.round((Date.now() - startedAt) / 1000))

    finishSession.mutate(
      {
        id: sessionId,
        duracao_seg: duracaoSeg,
        esforco_percebido: esforco ? Number(esforco) : null,
        notas: notas.trim() || null,
      },
      { onSuccess: () => onEndSession() },
    )
  }

  if (session.isLoading || prescriptions.isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    )
  }

  if (session.isError || prescriptions.isError) {
    return (
      <ErrorState
        message="Não foi possível carregar a sessão."
        onRetry={() => {
          session.refetch()
          prescriptions.refetch()
        }}
      />
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {activeRest && (
        <RestTimer
          key={activeRest.logId}
          targetSeconds={activeRest.targetSeconds}
          onFinish={handleRestFinish}
        />
      )}

      <div className="flex items-center justify-between rounded-lg border border-brasa/40 bg-brasa/10 px-3 py-2">
        <span className="text-sm font-medium text-foreground">Sessão em andamento</span>
        {!isFinishing && (
          <Button type="button" size="sm" onClick={() => setIsFinishing(true)}>
            Finalizar treino
          </Button>
        )}
      </div>

      {isFinishing && (
        <div className="flex flex-col gap-3 rounded-lg border border-border bg-card/60 p-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="sr-esforco" className="text-xs text-aco-texto">
              Esforço percebido (1-10)
            </label>
            <Input
              id="sr-esforco"
              type="number"
              min={1}
              max={10}
              className="w-24"
              value={esforco}
              onChange={(event) => setEsforco(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="sr-notas" className="text-xs text-aco-texto">
              Notas
            </label>
            <Textarea id="sr-notas" rows={2} value={notas} onChange={(event) => setNotas(event.target.value)} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsFinishing(false)}>
              Cancelar
            </Button>
            <Button type="button" size="sm" disabled={finishSession.isPending} onClick={handleFinish}>
              {finishSession.isPending ? 'Salvando…' : 'Confirmar'}
            </Button>
          </div>
        </div>
      )}

      {!prescriptions.data || prescriptions.data.length === 0 ? (
        <EmptyState message="Este treino não tem exercícios prescritos." />
      ) : (
        prescriptions.data.map((prescription) => (
          <SessionExerciseBlock
            key={prescription.id}
            sessionId={sessionId}
            exercise={exercisesById.get(prescription.exercise_id)}
            prescription={prescription}
            logs={logsByExercise.get(prescription.exercise_id) ?? []}
            lastLog={lastLogs.data?.get(prescription.exercise_id)}
            onSetCompleted={handleSetCompleted}
          />
        ))
      )}
    </div>
  )
}

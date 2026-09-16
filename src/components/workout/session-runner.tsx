import { useMemo, useState } from 'react'
import { Icon } from '@/components/Icon'

import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Select } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { FreeTimer } from '@/components/workout/free-timer'
import { RestTimer } from '@/components/workout/rest-timer'
import { SessionExerciseBlock } from '@/components/workout/session-exercise-block'
import { CardioBlock, TimedPhaseBlock } from '@/components/workout/session/phase-blocks'
import { formatClock, ImmersiveHeader, PostWorkoutSummary, type PostWorkoutSummaryProps } from '@/components/workout/session/session-views'
import { useActiveSession } from '@/hooks/use-active-session'
import { useElapsedSince } from '@/hooks/use-elapsed-since'
import { useEnsureKarvonenZones } from '@/hooks/use-heart-zones'
import { useExercises } from '@/hooks/use-exercises'
import { useImmersiveMode } from '@/hooks/use-immersive-mode'
import { useLastSetLogByExercise, useSetLogsForSession, useUpdateSetLogPausa } from '@/hooks/use-set-logs'
import { useWakeLock } from '@/hooks/use-wake-lock'
import { useWorkoutExercises } from '@/hooks/use-workout-exercises'
import { useCreateWorkoutSession, useFinishWorkoutSession, useWorkoutSession } from '@/hooks/use-workout-sessions'
import { useWorkouts } from '@/hooks/use-workouts'
import { launchForjaChat } from '@/lib/forja-chat-store'
import { haptic } from '@/lib/haptics'
import { faseCronometrada, faseDe, ordenarPorFase } from '@/lib/workout-phases'
import type { Exercise, SetLog } from '@/types/database'

const PAUSA_PADRAO_STORAGE_KEY = 'forja:pausa-padrao-seg'

function readPausaPadraoSeg(): number {
  try {
    const stored = window.localStorage.getItem(PAUSA_PADRAO_STORAGE_KEY)
    const parsed = stored ? Number(stored) : NaN
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 60
  } catch {
    return 60
  }
}

export function SessionRunner() {
  const { sessionId, setSessionId } = useActiveSession()
  const workouts = useWorkouts()
  const exercises = useExercises()
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string>('')
  const [showFreeTimer, setShowFreeTimer] = useState(false)
  const [minimizado, setMinimizado] = useState(false)
  const createSession = useCreateWorkoutSession()

  if (sessionId) {
    return minimizado ? (
      <MinimizedSession sessionId={sessionId} onResume={() => setMinimizado(false)} />
    ) : (
      <ActiveSession
        sessionId={sessionId}
        exercises={exercises.data ?? []}
        onMinimize={() => setMinimizado(true)}
        onEndSession={() => {
          setMinimizado(false)
          setSessionId(null)
        }}
      />
    )
  }

  const activeWorkouts = workouts.data?.filter((w) => w.ativo) ?? []

  return (
    <div className="flex flex-col gap-4">
      {workouts.isLoading ? (
        <Skeleton className="h-32 w-full" />
      ) : workouts.isError ? (
        <ErrorState message="Não foi possível carregar os treinos." onRetry={() => workouts.refetch()} />
      ) : activeWorkouts.length === 0 ? (
        <EmptyState message="Nenhum treino ativo" description="Cadastre um treino na aba Treinos antes de iniciar uma sessão." />
      ) : (
        <section className="flex flex-col gap-3 rounded-[var(--radius-lg)] bg-card p-4">
          <label htmlFor="sr-workout" className="ds-label">
            Iniciar sessão
          </label>
          <Select id="sr-workout" value={selectedWorkoutId} onChange={(event) => setSelectedWorkoutId(event.target.value)}>
            <option value="">Escolha o treino…</option>
            {activeWorkouts.map((workout) => (
              <option key={workout.id} value={workout.id}>
                {workout.nome}
              </option>
            ))}
          </Select>
          <Button
            type="button"
            className="min-h-12"
            disabled={!selectedWorkoutId || createSession.isPending}
            onClick={() => createSession.mutate(selectedWorkoutId, { onSuccess: (session) => setSessionId(session.id) })}
          >
            <Icon name="play_arrow" size={16} filled />
            {createSession.isPending ? 'Iniciando…' : 'Iniciar sessão'}
          </Button>
        </section>
      )}

      {showFreeTimer ? (
        <FreeTimer />
      ) : (
        <Button type="button" variant="ghost" className="min-h-11 self-start" onClick={() => setShowFreeTimer(true)}>
          Cronômetro livre
        </Button>
      )}
    </div>
  )
}

/** Sessão minimizada: volta para as abas com um cartão para retomar. */
function MinimizedSession({ sessionId, onResume }: { sessionId: string; onResume: () => void }) {
  const session = useWorkoutSession(sessionId)
  const startedAtMs = session.data ? new Date(session.data.performed_at).getTime() : Date.now()
  const elapsed = useElapsedSince(startedAtMs)

  return (
    <button
      type="button"
      onClick={onResume}
      className="ds-pressable-card ds-card-brasa flex min-h-16 w-full items-center justify-between gap-3 rounded-[var(--radius-lg)] border border-brasa bg-card px-5 py-4 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex flex-col">
        <span className="ds-label text-brasa">● Sessão em andamento</span>
        <span className="text-[28px] font-bold leading-tight tabular-nums text-foreground [font-family:var(--font-display)]">
          {formatClock(elapsed)}
        </span>
      </div>
      <span className="flex items-center gap-2 ds-body-md font-semibold text-foreground">
        Retomar
        <Icon name="open_in_full" size={16} />
      </span>
    </button>
  )
}

type ActiveSessionProps = {
  sessionId: string
  exercises: Exercise[]
  onMinimize: () => void
  onEndSession: () => void
}

/** Modo imersivo: tela cheia sobre a navegação (z-30), abaixo do cronômetro (z-40) e do chat (z-50). */
function ActiveSession({ sessionId, exercises, onMinimize, onEndSession }: ActiveSessionProps) {
  const session = useWorkoutSession(sessionId)
  const workouts = useWorkouts()
  const prescriptions = useWorkoutExercises(session.data?.workout_id ?? '')
  const logs = useSetLogsForSession(sessionId)
  const exerciseIds = useMemo(() => prescriptions.data?.map((p) => p.exercise_id) ?? [], [prescriptions.data])
  const lastLogs = useLastSetLogByExercise(exerciseIds)
  const finishSession = useFinishWorkoutSession()
  const ensureKarvonenZones = useEnsureKarvonenZones()
  const updateSetLogPausa = useUpdateSetLogPausa()
  const [currentIndex, setCurrentIndex] = useState(0)

  useWakeLock(true)
  useImmersiveMode(true)

  const startedAtMs = session.data ? new Date(session.data.performed_at).getTime() : Date.now()
  const elapsedSeconds = useElapsedSince(startedAtMs)

  const [isFinishing, setIsFinishing] = useState(false)
  const [resumo, setResumo] = useState<Omit<PostWorkoutSummaryProps, 'onClose'> | null>(null)
  const [esforco, setEsforco] = useState('')
  const [notas, setNotas] = useState('')
  const [activeRest, setActiveRest] = useState<{ logId: string; targetSeconds: number } | null>(null)
  const [pausaPadraoSeg, setPausaPadraoSeg] = useState(readPausaPadraoSeg)

  function handlePausaPadraoChange(value: string) {
    const seconds = Math.max(1, Number(value) || 60)
    setPausaPadraoSeg(seconds)
    try {
      window.localStorage.setItem(PAUSA_PADRAO_STORAGE_KEY, String(seconds))
    } catch {
      // armazenamento bloqueado: a preferência vale só nesta sessão
    }
  }

  function handleSetCompleted(log: SetLog, pausaAlvoSeg: number | null) {
    // Sem pausa alvo cadastrada, usa a pausa padrão — antes o cronômetro não
    // aparecia e a pausa real nunca era registrada.
    const alvo = pausaAlvoSeg && pausaAlvoSeg > 0 ? pausaAlvoSeg : pausaPadraoSeg
    setActiveRest({ logId: log.id, targetSeconds: alvo })
  }

  function handleRestFinish(elapsed: number) {
    if (!activeRest) return
    updateSetLogPausa.mutate({ id: activeRest.logId, sessionId, pausaSeg: elapsed })
    setActiveRest(null)
  }

  const exercisesById = useMemo(() => new Map(exercises.map((e) => [e.id, e])), [exercises])
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
    finishSession.mutate(
      {
        id: sessionId,
        duracao_seg: Math.round(elapsedSeconds),
        esforco_percebido: esforco ? Number(esforco) : null,
        notas: notas.trim() || null,
      },
      {
        onSuccess: () => {
          // Resumo com o que foi feito de fato: só séries concluídas contam.
          const concluidas = (logs.data ?? []).filter((l) => l.concluida)
          const exerciciosFeitos = new Set(concluidas.map((l) => l.exercise_id))
          const musculos = [...exerciciosFeitos]
            .map((id) => exercisesById.get(id)?.grupo_muscular)
            .filter((g): g is string => !!g)
          haptic('double')
          void ensureKarvonenZones()
          setIsFinishing(false)
          setResumo({
            duracaoSeg: Math.round(elapsedSeconds),
            series: concluidas.length,
            volumeKg: concluidas.reduce((acc, l) => acc + (l.carga_kg ?? 0) * (l.reps ?? 0), 0),
            exercicios: exerciciosFeitos.size,
            musculos,
          })
        },
      },
    )
  }

  // aquecimento → mobilidade → treino → cardio (→ volta à calma), cada fase na sua ordem.
  const lista = useMemo(() => ordenarPorFase(prescriptions.data ?? []), [prescriptions.data])
  const total = lista.length
  const indice = Math.min(currentIndex, Math.max(0, total - 1))
  const currentPrescription = lista[indice]
  const currentExercise = currentPrescription ? exercisesById.get(currentPrescription.exercise_id) : undefined
  const treinoNome = workouts.data?.find((w) => w.id === session.data?.workout_id)?.nome ?? null
  const faseAtual = currentPrescription ? faseDe(currentPrescription.fase) : 'treino'
  const daFase = lista.filter((p) => faseDe(p.fase) === faseAtual)
  const posicaoNaFase = currentPrescription ? daFase.findIndex((p) => p.id === currentPrescription.id) + 1 : 0
  const proximo = lista[indice + 1]
  const proximoNome = proximo ? (exercisesById.get(proximo.exercise_id)?.nome ?? null) : null
  const avancar = () => setCurrentIndex((i) => Math.min(total - 1, i + 1))

  function handleAskCoach() {
    const contexto = currentExercise ? ` Estou no exercício "${currentExercise.nome}".` : ''
    launchForjaChat({ agente: 'treino', pergunta: `Me dê uma dica para o treino de hoje.${contexto}` })
  }

  return (
    <div className="fixed inset-0 z-30 overflow-y-auto bg-meia-noite ds-scroll">
      <div
        className="mx-auto flex max-w-lg flex-col gap-6 px-5"
        style={{
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)',
          paddingBottom: activeRest ? '11rem' : 'calc(env(safe-area-inset-bottom, 0px) + 2rem)',
        }}
      >
        <ImmersiveHeader
          atual={total > 0 ? indice + 1 : 0}
          total={total}
          elapsedSeconds={elapsedSeconds}
          treinoNome={treinoNome}
          onPrev={() => setCurrentIndex((i) => Math.max(0, i - 1))}
          onNext={avancar}
          onMinimize={onMinimize}
          onAskCoach={handleAskCoach}
          onFinish={() => setIsFinishing(true)}
        />

        {session.isLoading || prescriptions.isLoading ? (
          <div className="flex flex-col gap-4">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="aspect-video w-full rounded-[var(--radius-lg)]" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : session.isError || prescriptions.isError ? (
          <ErrorState
            message="Não foi possível carregar a sessão."
            onRetry={() => {
              session.refetch()
              prescriptions.refetch()
            }}
          />
        ) : !currentPrescription ? (
          <EmptyState message="Treino sem exercícios" description="Prescreva exercícios na aba Treinos." />
        ) : faseCronometrada(faseAtual) ? (
          <TimedPhaseBlock
            key={currentPrescription.id}
            exercise={currentExercise}
            prescription={currentPrescription}
            posicao={posicaoNaFase}
            totalFase={daFase.length}
            proximoNome={proximoNome}
            // No último exercício do treino não há para onde avançar: abre o fechamento.
            onNext={() => (indice < total - 1 ? avancar() : setIsFinishing(true))}
          />
        ) : faseAtual === 'cardio' ? (
          <CardioBlock
            key={currentPrescription.id}
            exercise={currentExercise}
            prescription={currentPrescription}
            onFinish={() => (indice < total - 1 ? avancar() : setIsFinishing(true))}
          />
        ) : (
          <SessionExerciseBlock
            key={currentPrescription.id}
            sessionId={sessionId}
            exercise={currentExercise}
            prescription={currentPrescription}
            logs={logsByExercise.get(currentPrescription.exercise_id) ?? []}
            lastLog={lastLogs.data?.get(currentPrescription.exercise_id)}
            onSetCompleted={handleSetCompleted}
          />
        )}

        {faseAtual === 'treino' && (
        <label className="flex min-h-11 items-center justify-center gap-2 ds-body-sm text-aco-texto">
          Pausa padrão
          <Input
            type="number"
            inputMode="numeric"
            min={1}
            className="h-11 w-20 text-center"
            value={pausaPadraoSeg}
            onChange={(event) => handlePausaPadraoChange(event.target.value)}
          />
          s
        </label>
        )}
      </div>

      {activeRest && (
        <RestTimer key={activeRest.logId} targetSeconds={activeRest.targetSeconds} onFinish={handleRestFinish} />
      )}

      <Modal open={resumo !== null} onClose={onEndSession} title="Bom treino">
        {resumo && <PostWorkoutSummary {...resumo} onClose={onEndSession} />}
      </Modal>

      <Modal open={isFinishing} onClose={() => setIsFinishing(false)} title="Finalizar treino" description={`Duração: ${formatClock(elapsedSeconds)}`}>
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="ds-body-sm text-aco-texto">Esforço percebido (1–10)</span>
            <Input type="number" inputMode="numeric" min={1} max={10} className="h-12" value={esforco} onChange={(e) => setEsforco(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="ds-body-sm text-aco-texto">Notas</span>
            <Textarea rows={3} value={notas} onChange={(e) => setNotas(e.target.value)} />
          </label>
          <div className="flex gap-2">
            <Button type="button" variant="outline" className="min-h-12 flex-1" onClick={() => setIsFinishing(false)}>
              Continuar treinando
            </Button>
            <Button type="button" className="min-h-12 flex-1" disabled={finishSession.isPending} onClick={handleFinish}>
              {finishSession.isPending ? 'Salvando…' : 'Concluir'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import { Icon } from '@/components/Icon'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useCountdownTimer } from '@/hooks/use-countdown-timer'
import { useCreateFocusSession } from '@/hooks/use-focus-sessions'
import { useUpdateTask } from '@/hooks/use-tasks'
import { useWakeLock } from '@/hooks/use-wake-lock'
import { playBeep, vibrate } from '@/lib/audio-beep'

type Phase = 'foco' | 'pausa_curta' | 'pausa_longa'

const PHASE_SECONDS: Record<Phase, number> = {
  foco: 25 * 60,
  pausa_curta: 5 * 60,
  pausa_longa: 15 * 60,
}

const PHASE_LABEL: Record<Phase, string> = {
  foco: 'Foco',
  pausa_curta: 'Pausa curta',
  pausa_longa: 'Pausa longa',
}

const CICLOS_PARA_PAUSA_LONGA = 4

function formatSeconds(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function PomodoroPhaseRunner({
  phase,
  onComplete,
}: {
  phase: Phase
  onComplete: (elapsedSeconds: number) => void
}) {
  const timer = useCountdownTimer(PHASE_SECONDS[phase])
  const completedRef = useRef(false)

  useEffect(() => {
    if (timer.isComplete && !completedRef.current) {
      completedRef.current = true
      playBeep()
      vibrate([200, 100, 200])
      onComplete(Math.round(timer.elapsedMs / 1000))
    }
  }, [timer.isComplete, timer.elapsedMs, onComplete])

  function handleEncerrarAgora() {
    if (completedRef.current) return
    completedRef.current = true
    timer.pause()
    onComplete(Math.round(timer.elapsedMs / 1000))
  }

  const remainingSeconds = Math.ceil(timer.remainingMs / 1000)

  return (
    <div className="flex flex-col items-center gap-4 py-2">
      <span className="text-xs font-medium uppercase tracking-wide text-aco-texto">
        {PHASE_LABEL[phase]}
      </span>
      <span className="font-mono text-5xl tabular-nums text-foreground">
        {formatSeconds(remainingSeconds)}
      </span>
      <div className="flex flex-wrap justify-center gap-2">
        {timer.isRunning ? (
          <Button type="button" variant="outline" onClick={timer.pause}>
            <Icon name="pause" size={16} />
            Pausar
          </Button>
        ) : (
          <Button type="button" onClick={timer.start}>
            <Icon name="play_arrow" size={16} />
            {timer.elapsedMs > 0 ? 'Retomar' : 'Começar'}
          </Button>
        )}
        <Button type="button" variant="ghost" onClick={timer.reset}>
          <Icon name="restart_alt" size={16} />
          Zerar
        </Button>
        {phase === 'foco' && (
          <Button
            type="button"
            variant="outline"
            onClick={handleEncerrarAgora}
            disabled={timer.elapsedMs < 1000}
          >
            <Icon name="skip_next" size={16} />
            Encerrar agora
          </Button>
        )}
      </div>
    </div>
  )
}

type PomodoroTimerProps = {
  tarefa: string
  /** Tarefa real vinculada — habilita o 'concluir' pós-pomodoro. */
  taskId?: string | null
  onExit: () => void
}

/** Seção 6.4: pomodoro por timestamp, com ciclos foco/pausa e registro automático em focus_sessions. */
export function PomodoroTimer({ tarefa, taskId, onExit }: PomodoroTimerProps) {
  const [phase, setPhase] = useState<Phase>('foco')
  const [phaseInstance, setPhaseInstance] = useState(0)
  const [ciclosConcluidos, setCiclosConcluidos] = useState(0)
  const [perguntarConclusao, setPerguntarConclusao] = useState(false)
  const createSession = useCreateFocusSession()
  const updateTask = useUpdateTask()
  useWakeLock(true)

  function handlePhaseComplete(elapsedSeconds: number) {
    if (phase === 'foco') {
      const duracaoMin = Math.max(1, Math.round(elapsedSeconds / 60))
      createSession.mutate({
        tarefa: tarefa.trim() || null,
        task_id: taskId ?? null,
        tecnica: 'pomodoro',
        duracao_min: duracaoMin,
      })
      if (taskId) setPerguntarConclusao(true)
      const novosCiclos = ciclosConcluidos + 1
      setCiclosConcluidos(novosCiclos)
      setPhase(novosCiclos % CICLOS_PARA_PAUSA_LONGA === 0 ? 'pausa_longa' : 'pausa_curta')
    } else {
      setPhase('foco')
    }
    setPhaseInstance((key) => key + 1)
  }

  function handleConcluirTarefa() {
    if (!taskId) return
    updateTask.mutate({ id: taskId, values: { status: 'feito' } }, { onSuccess: () => setPerguntarConclusao(false) })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pomodoro</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {tarefa && <p className="text-center text-sm text-aco-texto">Foco: {tarefa}</p>}

        {/* Fecha o ciclo tarefa→foco→feito num gesto, na pausa */}
        {perguntarConclusao && taskId && (
          <div className="flex items-center justify-between gap-2 rounded-lg border border-ok/40 bg-ok/10 px-3 py-2">
            <span className="text-sm text-foreground">Terminou "{tarefa}"?</span>
            <div className="flex gap-1.5">
              <Button
                type="button"
                size="sm"
                className="h-7 text-xs"
                onClick={handleConcluirTarefa}
                disabled={updateTask.isPending}
              >
                <Icon name="check" size={18} className="mr-1.5 inline-block align-middle" />Concluir
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 text-xs"
                onClick={() => setPerguntarConclusao(false)}
              >
                Ainda não
              </Button>
            </div>
          </div>
        )}
        <PomodoroPhaseRunner
          key={`${phase}-${phaseInstance}`}
          phase={phase}
          onComplete={handlePhaseComplete}
        />
        <div className="flex items-center justify-between text-xs text-aco-texto">
          <span>🍅 {ciclosConcluidos} pomodoro(s) concluído(s)</span>
          <button
            type="button"
            onClick={onExit}
            className="rounded outline-none hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Encerrar sessão
          </button>
        </div>
      </CardContent>
    </Card>
  )
}

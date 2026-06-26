import { useEffect, useRef, useState } from 'react'
import { Pause, Play, RotateCcw, SkipForward } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useCountdownTimer } from '@/hooks/use-countdown-timer'
import { useCreateFocusSession } from '@/hooks/use-focus-sessions'
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
            <Pause className="size-4" aria-hidden="true" />
            Pausar
          </Button>
        ) : (
          <Button type="button" onClick={timer.start}>
            <Play className="size-4" aria-hidden="true" />
            {timer.elapsedMs > 0 ? 'Retomar' : 'Começar'}
          </Button>
        )}
        <Button type="button" variant="ghost" onClick={timer.reset}>
          <RotateCcw className="size-4" aria-hidden="true" />
          Zerar
        </Button>
        {phase === 'foco' && (
          <Button
            type="button"
            variant="outline"
            onClick={handleEncerrarAgora}
            disabled={timer.elapsedMs < 1000}
          >
            <SkipForward className="size-4" aria-hidden="true" />
            Encerrar agora
          </Button>
        )}
      </div>
    </div>
  )
}

type PomodoroTimerProps = {
  tarefa: string
  onExit: () => void
}

/** Seção 6.4: pomodoro por timestamp, com ciclos foco/pausa e registro automático em focus_sessions. */
export function PomodoroTimer({ tarefa, onExit }: PomodoroTimerProps) {
  const [phase, setPhase] = useState<Phase>('foco')
  const [phaseInstance, setPhaseInstance] = useState(0)
  const [ciclosConcluidos, setCiclosConcluidos] = useState(0)
  const createSession = useCreateFocusSession()
  useWakeLock(true)

  function handlePhaseComplete(elapsedSeconds: number) {
    if (phase === 'foco') {
      const duracaoMin = Math.max(1, Math.round(elapsedSeconds / 60))
      createSession.mutate({ tarefa: tarefa.trim() || null, tecnica: 'pomodoro', duracao_min: duracaoMin })
      const novosCiclos = ciclosConcluidos + 1
      setCiclosConcluidos(novosCiclos)
      setPhase(novosCiclos % CICLOS_PARA_PAUSA_LONGA === 0 ? 'pausa_longa' : 'pausa_curta')
    } else {
      setPhase('foco')
    }
    setPhaseInstance((key) => key + 1)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pomodoro</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {tarefa && <p className="text-center text-sm text-aco-texto">Foco: {tarefa}</p>}
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

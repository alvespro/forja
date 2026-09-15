import { useEffect, useRef, useState } from 'react'
import { Pause, Play, SkipForward, X } from 'lucide-react'
import { toast } from 'sonner'

import { ExerciseMedia } from '@/components/workout/exercise-media'
import { formatClock } from '@/components/workout/session/session-views'
import { useCountdownTimer } from '@/hooks/use-countdown-timer'
import { useImmersiveMode } from '@/hooks/use-immersive-mode'
import { useCompleteMobilityRoutine, type RotinaComExercicios } from '@/hooks/use-mobility-routines'
import { useWakeLock } from '@/hooks/use-wake-lock'
import { playSoftBeep } from '@/lib/audio-beep'
import { splitCues } from '@/lib/cadence'
import { haptic } from '@/lib/haptics'
import { progressoRotina, TEMPOS_POR_EXERCICIO } from '@/lib/mobility'
import { cn } from '@/lib/utils'

const AVANCO_AUTOMATICO_MS = 1200

type MobilityRunnerProps = {
  rotina: RotinaComExercicios
  /** Hábito a marcar ao concluir (ativação vinda do "Mover o corpo"). */
  habitId?: string | null
  onClose: () => void
}

/**
 * Execução de rotina de mobilidade em tela cheia: sem carga, só tempo. Mídia em
 * destaque, instrução curta, cronômetro por exercício e avanço automático.
 */
export function MobilityRunner({ rotina, habitId, onClose }: MobilityRunnerProps) {
  const exercicios = rotina.exercicios
  const [indice, setIndice] = useState(0)
  const [segundos, setSegundos] = useState<number>(rotina.segundos_por_exercicio)
  const timer = useCountdownTimer(segundos)
  const concluir = useCompleteMobilityRoutine()
  const avisado = useRef(false)
  const finalizado = useRef(false)

  useWakeLock(true)
  useImmersiveMode(true)

  const atual = exercicios[indice]
  const ultimo = indice === exercicios.length - 1
  const restanteSeg = Math.ceil(timer.remainingMs / 1000)

  // Cada exercício começa do zero e já rodando.
  useEffect(() => {
    avisado.current = false
    timer.reset()
    timer.start()
    // timer muda de identidade a cada render; reinicia só ao trocar de exercício.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indice])

  function finalizar() {
    // Avanço automático e toque em "Concluir" podem coincidir no último exercício.
    if (finalizado.current) return
    finalizado.current = true
    concluir.mutate(
      { rotina, habitId },
      {
        onSuccess: () => {
          toast.success('✅ Mobilidade concluída — corpo preparado')
          onClose()
        },
        onError: (err) => {
          finalizado.current = false
          toast.error(err instanceof Error ? err.message : 'Não foi possível registrar a rotina.')
        },
      },
    )
  }

  function proximo() {
    if (ultimo) finalizar()
    else setIndice((i) => i + 1)
  }

  // Zerou: vibração e beep suaves, avança sozinho.
  useEffect(() => {
    if (!timer.isComplete || avisado.current || exercicios.length === 0) return
    avisado.current = true
    haptic('soft')
    playSoftBeep()
    const id = window.setTimeout(proximo, AVANCO_AUTOMATICO_MS)
    return () => window.clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timer.isComplete])

  if (!atual) {
    return (
      <div className="fixed inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-meia-noite p-6 text-center">
        <p className="ds-h4 text-foreground">Esta rotina ainda não tem exercícios.</p>
        <button type="button" onClick={onClose} className="min-h-11 rounded-full border border-linha px-5 text-foreground">
          Voltar
        </button>
      </div>
    )
  }

  const instrucao = atual.instrucoes?.[0] ?? splitCues(atual.cues)[0] ?? null
  const progresso = (indice + (timer.isComplete ? 1 : 1 - timer.remainingMs / (segundos * 1000))) / exercicios.length

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Rotina ${rotina.nome}`}
      className="fixed inset-0 z-30 flex flex-col bg-meia-noite pb-[env(safe-area-inset-bottom,0px)] pt-[env(safe-area-inset-top,0px)]"
    >
      <header className="flex flex-col gap-2 px-4 pt-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-col">
            <span className="ds-label text-brasa">🧘 {rotina.nome}</span>
            <span className="ds-data-md text-aco-texto">{progressoRotina(indice, exercicios.length, segundos, restanteSeg)}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Sair da rotina"
            className="flex size-11 shrink-0 items-center justify-center rounded-full text-aco-texto outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-aco" aria-hidden="true">
          <div className="h-full rounded-full bg-brasa transition-[width] duration-300" style={{ width: `${Math.min(100, progresso * 100)}%` }} />
        </div>
      </header>

      <main className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-3">
        <div className="mx-auto w-full max-w-md [&_img]:max-h-[45vh] [&_img]:object-contain [&_video]:max-h-[45vh]">
          <ExerciseMedia key={atual.id} exercise={atual} />
        </div>
        <div className="mx-auto flex w-full max-w-md flex-col gap-1.5">
          <h2 className="ds-h3 text-foreground">{atual.nome}</h2>
          {instrucao && <p className="ds-body-md text-aco-texto">{instrucao}</p>}
          <p className="ds-body-sm italic text-aco-texto">Respire fundo e mantenha a posição.</p>
        </div>
      </main>

      <footer className="flex flex-col items-center gap-3 border-t border-linha px-4 pb-4 pt-3">
        <span
          className={cn(
            'text-[56px] font-bold leading-none tabular-nums [font-family:var(--font-display)]',
            timer.isComplete ? 'text-ok' : 'text-foreground',
          )}
          aria-live="off"
        >
          {formatClock(restanteSeg)}
        </span>

        <div role="group" aria-label="Tempo por exercício" className="flex gap-2">
          {TEMPOS_POR_EXERCICIO.map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={segundos === t}
              onClick={() => setSegundos(t)}
              className={cn(
                'min-h-11 rounded-full border px-4 ds-data-md outline-none focus-visible:ring-2 focus-visible:ring-ring',
                segundos === t ? 'border-brasa bg-brasa/15 text-foreground' : 'border-linha text-aco-texto',
              )}
            >
              {t}s
            </button>
          ))}
        </div>

        <div className="flex w-full max-w-md gap-3">
          <button
            type="button"
            onClick={() => (timer.isRunning ? timer.pause() : timer.start())}
            aria-label={timer.isRunning ? 'Pausar' : 'Continuar'}
            className="flex min-h-14 flex-1 items-center justify-center gap-2 rounded-full border border-linha ds-body-md font-semibold text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {timer.isRunning ? <Pause className="size-5" aria-hidden="true" /> : <Play className="size-5" aria-hidden="true" />}
            {timer.isRunning ? 'Pausar' : 'Continuar'}
          </button>
          <button
            type="button"
            onClick={proximo}
            disabled={concluir.isPending}
            className="flex min-h-14 flex-1 items-center justify-center gap-2 rounded-full bg-brasa ds-body-md font-semibold text-meia-noite outline-none disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-ring"
          >
            <SkipForward className="size-5" aria-hidden="true" />
            {ultimo ? (concluir.isPending ? 'Salvando…' : 'Concluir') : 'Próximo'}
          </button>
        </div>
      </footer>
    </div>
  )
}

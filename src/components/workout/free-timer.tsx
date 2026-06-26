import { Pause, Play, RotateCcw, Timer } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useStopwatch } from '@/hooks/use-stopwatch'

function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

/** Seção 6.4: cronômetro livre (stopwatch), independente da sessão de treino. */
export function FreeTimer() {
  const { elapsedMs, isRunning, start, pause, reset } = useStopwatch()

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card/40 px-3 py-2">
      <div className="flex items-center gap-2">
        <Timer className="size-4 text-aco-texto" aria-hidden="true" />
        <span className="font-mono text-lg tabular-nums text-foreground">{formatElapsed(elapsedMs)}</span>
      </div>
      <div className="flex gap-1">
        {isRunning ? (
          <Button type="button" variant="outline" size="icon-sm" aria-label="Pausar" onClick={pause}>
            <Pause className="size-3.5" aria-hidden="true" />
          </Button>
        ) : (
          <Button type="button" variant="outline" size="icon-sm" aria-label="Iniciar" onClick={start}>
            <Play className="size-3.5" aria-hidden="true" />
          </Button>
        )}
        <Button type="button" variant="ghost" size="icon-sm" aria-label="Zerar" onClick={reset}>
          <RotateCcw className="size-3.5" aria-hidden="true" />
        </Button>
      </div>
    </div>
  )
}

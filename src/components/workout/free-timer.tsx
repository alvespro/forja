import { Icon } from '@/components/Icon'

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
        <Icon name="timer" size={16} className="text-aco-texto" />
        <span className="font-mono text-lg tabular-nums text-foreground">{formatElapsed(elapsedMs)}</span>
      </div>
      <div className="flex gap-3">
        {isRunning ? (
          <Button type="button" variant="outline" size="icon-sm" aria-label="Pausar" onClick={pause}>
            <Icon name="pause" size={14} />
          </Button>
        ) : (
          <Button type="button" variant="outline" size="icon-sm" aria-label="Iniciar" onClick={start}>
            <Icon name="play_arrow" size={14} />
          </Button>
        )}
        <Button type="button" variant="ghost" size="icon-sm" aria-label="Zerar" onClick={reset}>
          <Icon name="restart_alt" size={14} />
        </Button>
      </div>
    </div>
  )
}

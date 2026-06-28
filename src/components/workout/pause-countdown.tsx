import { useEffect, useRef } from 'react'
import { Pause, Play, RotateCcw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useStopwatch } from '@/hooks/use-stopwatch'
import { playBeep, vibrate } from '@/lib/audio-beep'
import { cn } from '@/lib/utils'

type PauseCountdownProps = {
  targetSeconds: number
  onElapsedChange: (elapsedSeconds: number) => void
}

function formatSeconds(totalSeconds: number): string {
  const sign = totalSeconds < 0 ? '-' : ''
  const abs = Math.abs(Math.round(totalSeconds))
  const minutes = Math.floor(abs / 60)
  const seconds = abs % 60
  return `${sign}${minutes}:${String(seconds).padStart(2, '0')}`
}

/** Cronômetro regressivo de pausa entre séries, embutido na linha da série (substitui o input manual). */
export function PauseCountdown({ targetSeconds, onElapsedChange }: PauseCountdownProps) {
  const { elapsedMs, isRunning, start, pause, reset } = useStopwatch()
  const alertedRef = useRef(false)
  const elapsedSeconds = elapsedMs / 1000
  const remainingSeconds = targetSeconds - elapsedSeconds
  const isOvertime = remainingSeconds <= 0 && elapsedSeconds > 0

  useEffect(() => {
    onElapsedChange(Math.round(elapsedSeconds))
  }, [elapsedSeconds, onElapsedChange])

  useEffect(() => {
    if (remainingSeconds <= 0 && elapsedSeconds > 0 && !alertedRef.current) {
      alertedRef.current = true
      playBeep()
      vibrate([200, 100, 200])
    }
    if (elapsedSeconds === 0) {
      alertedRef.current = false
    }
  }, [remainingSeconds, elapsedSeconds])

  return (
    <div
      className={cn(
        'flex h-8 items-center justify-between gap-1 rounded-lg border px-2',
        isOvertime ? 'border-atencao/40 bg-atencao/10' : 'border-input bg-transparent',
      )}
    >
      <span className="font-mono text-sm tabular-nums text-foreground">{formatSeconds(remainingSeconds)}</span>
      <div className="flex shrink-0 gap-0.5">
        {isRunning ? (
          <Button type="button" variant="ghost" size="icon-xs" aria-label="Pausar cronômetro" onClick={pause}>
            <Pause className="size-3" aria-hidden="true" />
          </Button>
        ) : (
          <Button type="button" variant="ghost" size="icon-xs" aria-label="Iniciar cronômetro" onClick={start}>
            <Play className="size-3" aria-hidden="true" />
          </Button>
        )}
        <Button type="button" variant="ghost" size="icon-xs" aria-label="Zerar cronômetro" onClick={reset}>
          <RotateCcw className="size-3" aria-hidden="true" />
        </Button>
      </div>
    </div>
  )
}

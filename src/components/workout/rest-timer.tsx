import { useEffect, useRef, useState } from 'react'
import { Bell } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useElapsedSince } from '@/hooks/use-elapsed-since'
import { playBeep, vibrate } from '@/lib/audio-beep'
import { cn } from '@/lib/utils'

type RestTimerProps = {
  targetSeconds: number
  onFinish: (elapsedSeconds: number) => void
}

function formatSeconds(totalSeconds: number): string {
  const sign = totalSeconds < 0 ? '-' : ''
  const abs = Math.abs(Math.round(totalSeconds))
  const minutes = Math.floor(abs / 60)
  const seconds = abs % 60
  return `${sign}${minutes}:${String(seconds).padStart(2, '0')}`
}

/** Seção 6.4: cronômetro de pausa por timestamp, com beep + vibração ao zerar. */
export function RestTimer({ targetSeconds, onFinish }: RestTimerProps) {
  const [startedAt] = useState(() => Date.now())
  const elapsedSeconds = useElapsedSince(startedAt)
  const remainingSeconds = targetSeconds - elapsedSeconds
  const alertedRef = useRef(false)

  useEffect(() => {
    if (remainingSeconds <= 0 && !alertedRef.current) {
      alertedRef.current = true
      playBeep()
      vibrate([200, 100, 200])
    }
  }, [remainingSeconds])

  const isOvertime = remainingSeconds <= 0

  return (
    <div
      className={cn(
        'sticky top-2 z-10 flex items-center justify-between gap-3 rounded-lg border px-3 py-2',
        isOvertime ? 'border-atencao/40 bg-atencao/10' : 'border-brasa/40 bg-brasa/10',
      )}
    >
      <div className="flex items-center gap-2">
        <Bell className={cn('size-4', isOvertime ? 'text-atencao' : 'text-brasa')} aria-hidden="true" />
        <span className="font-mono text-lg tabular-nums text-foreground">
          {formatSeconds(remainingSeconds)}
        </span>
        <span className="text-xs text-aco-texto">{isOvertime ? 'pausa estendida' : 'pausa'}</span>
      </div>
      <Button type="button" size="sm" onClick={() => onFinish(Math.round(elapsedSeconds))}>
        Encerrar pausa
      </Button>
    </div>
  )
}

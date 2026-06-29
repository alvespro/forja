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

/** Seção 6.4: cronômetro de pausa por timestamp, fixo no rodapé — nunca sai do campo de visão. */
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
        'fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 border-t px-4 py-3 shadow-lg md:bottom-0',
        isOvertime ? 'border-ok/40 bg-ok/10' : 'border-atencao/40 bg-atencao/10',
      )}
    >
      <div className="flex items-center gap-3">
        <Bell className={cn('size-5 shrink-0', isOvertime ? 'text-ok' : 'text-atencao')} aria-hidden="true" />
        <span
          className={cn(
            'font-mono text-[3rem] leading-none tabular-nums',
            isOvertime ? 'text-ok' : 'text-atencao',
          )}
        >
          {formatSeconds(remainingSeconds)}
        </span>
        <span className={cn('text-sm', isOvertime ? 'text-ok' : 'text-aco-texto')}>
          {isOvertime ? 'Pode começar!' : 'pausa'}
        </span>
      </div>
      <Button type="button" size="sm" onClick={() => onFinish(Math.round(elapsedSeconds))}>
        Encerrar pausa
      </Button>
    </div>
  )
}

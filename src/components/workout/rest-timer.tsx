import { useEffect, useRef, useState } from 'react'

import { RestTimerView } from '@/components/workout/session/session-views'
import { useElapsedSince } from '@/hooks/use-elapsed-since'
import { playRestCompleteAlert } from '@/lib/audio-beep'
import { haptic } from '@/lib/haptics'
import { notifyRestComplete } from '@/lib/rest-notifications'

type RestTimerProps = {
  targetSeconds: number
  onFinish: (elapsedSeconds: number) => void
}

/** Seção 6.4: cronômetro de pausa por timestamp (não atrasa com a aba em segundo plano). */
export function RestTimer({ targetSeconds, onFinish }: RestTimerProps) {
  const [startedAt] = useState(() => Date.now())
  const elapsedSeconds = useElapsedSince(startedAt)
  const remainingSeconds = targetSeconds - elapsedSeconds
  const alertedRef = useRef(false)

  useEffect(() => {
    if (remainingSeconds <= 0 && !alertedRef.current) {
      alertedRef.current = true
      playRestCompleteAlert()
      haptic('pausa')
      void notifyRestComplete()
    }
  }, [remainingSeconds])

  return (
    <RestTimerView
      remainingSeconds={remainingSeconds}
      targetSeconds={targetSeconds}
      onFinish={() => onFinish(Math.round(elapsedSeconds))}
    />
  )
}

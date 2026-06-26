import { useEffect, useState } from 'react'

/**
 * Cronômetro de contagem regressiva por timestamp (Seção 6.4 do SPEC): o tempo
 * restante é sempre recalculado a partir de Date.now(), nunca por decremento
 * acumulado — sobrevive a abas em segundo plano. Suporta pausar/retomar.
 */
export function useCountdownTimer(totalSeconds: number) {
  const [accumulatedMs, setAccumulatedMs] = useState(0)
  const [runningSince, setRunningSince] = useState<number | null>(null)
  const [, forceTick] = useState(0)

  useEffect(() => {
    if (runningSince === null) return
    const id = setInterval(() => forceTick((t) => t + 1), 250)
    return () => clearInterval(id)
  }, [runningSince])

  const elapsedMs = accumulatedMs + (runningSince !== null ? Date.now() - runningSince : 0)
  const totalMs = totalSeconds * 1000
  const remainingMs = Math.max(0, totalMs - elapsedMs)
  const isComplete = elapsedMs >= totalMs

  function start() {
    setRunningSince((current) => current ?? Date.now())
  }

  function pause() {
    setRunningSince((current) => {
      if (current === null) return null
      setAccumulatedMs((acc) => acc + (Date.now() - current))
      return null
    })
  }

  function reset() {
    setAccumulatedMs(0)
    setRunningSince(null)
  }

  return { elapsedMs, remainingMs, isRunning: runningSince !== null, isComplete, start, pause, reset }
}

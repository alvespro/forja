import { useEffect, useState } from 'react'

/** Cronômetro livre (stopwatch), também por timestamp — nunca decrementa uma variável acumulada. */
export function useStopwatch() {
  const [accumulatedMs, setAccumulatedMs] = useState(0)
  const [runningSince, setRunningSince] = useState<number | null>(null)
  const [, forceTick] = useState(0)

  useEffect(() => {
    if (runningSince === null) return
    const id = setInterval(() => forceTick((t) => t + 1), 250)
    return () => clearInterval(id)
  }, [runningSince])

  const elapsedMs = accumulatedMs + (runningSince !== null ? Date.now() - runningSince : 0)

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

  return { elapsedMs, isRunning: runningSince !== null, start, pause, reset }
}

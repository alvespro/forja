import { useEffect, useState } from 'react'

/**
 * Seção 6.4 do SPEC: o tempo decorrido é sempre recalculado a partir de Date.now(),
 * nunca por decremento acumulado — sobrevive a abas em segundo plano.
 */
export function useElapsedSince(startedAtMs: number): number {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(id)
  }, [])

  return Math.max(0, (now - startedAtMs) / 1000)
}

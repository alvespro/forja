import type { SetLog, WorkoutExercise } from '@/types/database'

/** Seção 6.5: 1RM estimado pela fórmula de Epley. */
export function epley1RM(cargaKg: number, reps: number): number {
  return cargaKg * (1 + reps / 30)
}

export type SessionAggregate = {
  sessionId: string
  performedAt: string
  cargaMaxima: number
  melhor1RM: number
  volume: number
  isPR: boolean
}

export type SetLogWithSession = SetLog & { performed_at: string }

/**
 * Agrega os set_logs de um exercício por sessão: carga máxima, melhor 1RM estimado e
 * volume total (Σ séries × reps × carga). Marca PR quando o 1RM supera o melhor histórico.
 */
export function computeSessionAggregates(logs: SetLogWithSession[]): SessionAggregate[] {
  const bySession = new Map<string, SetLogWithSession[]>()
  for (const log of logs) {
    const list = bySession.get(log.session_id) ?? []
    list.push(log)
    bySession.set(log.session_id, list)
  }

  const aggregates: Omit<SessionAggregate, 'isPR'>[] = []
  for (const [sessionId, sessionLogs] of bySession) {
    let cargaMaxima = 0
    let melhor1RM = 0
    let volume = 0

    for (const log of sessionLogs) {
      const carga = log.carga_kg ?? 0
      const reps = log.reps ?? 0
      if (carga > cargaMaxima) cargaMaxima = carga
      const oneRm = epley1RM(carga, reps)
      if (oneRm > melhor1RM) melhor1RM = oneRm
      volume += carga * reps
    }

    aggregates.push({ sessionId, performedAt: sessionLogs[0].performed_at, cargaMaxima, melhor1RM, volume })
  }

  aggregates.sort((a, b) => new Date(a.performedAt).getTime() - new Date(b.performedAt).getTime())

  let best1RM = 0
  return aggregates.map((aggregate) => {
    const isPR = aggregate.melhor1RM > best1RM
    if (aggregate.melhor1RM > best1RM) best1RM = aggregate.melhor1RM
    return { ...aggregate, isPR }
  })
}

/** Extrai o maior número de uma notação de reps (ex: '15' -> 15, '6-12' -> 12). */
export function parseRepsTarget(repsAlvo: string | null): number | null {
  if (!repsAlvo) return null
  const numbers = repsAlvo.match(/\d+/g)
  if (!numbers) return null
  return Math.max(...numbers.map(Number))
}

const OVERLOAD_INCREMENT_KG = 2.5

/**
 * Seção 6.5: se a última sessão bateu todas as séries×reps alvo, sugere +2,5kg (ou +1 rep).
 * Retorna null se não há dados suficientes ou a meta não foi batida.
 */
export function suggestOverload(
  lastSessionLogs: SetLog[],
  prescription: WorkoutExercise | undefined,
): string | null {
  if (!prescription || lastSessionLogs.length === 0) return null

  const targetSeries = prescription.series_alvo ?? lastSessionLogs.length
  const targetReps = parseRepsTarget(prescription.reps_alvo)
  const completed = lastSessionLogs.filter((log) => log.concluida)

  if (completed.length < targetSeries) return null
  if (targetReps === null) return null
  if (!completed.every((log) => (log.reps ?? 0) >= targetReps)) return null

  const cargas = completed.map((log) => log.carga_kg ?? 0)
  const minCarga = Math.min(...cargas)
  const novaCarga = minCarga + OVERLOAD_INCREMENT_KG

  return `Você bateu todas as séries na última sessão. Sugestão: ${novaCarga}kg (ou +1 rep) na próxima.`
}

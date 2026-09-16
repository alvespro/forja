import { metaReps, repsAlvoMax } from '@/lib/workout-phases'
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
  /** RPE médio das séries que registraram RPE (null se nenhuma). */
  rpeMedio: number | null
  isPR: boolean
}

export type SetLogWithSession = SetLog & { performed_at: string; treino_nome?: string | null }

export type SessionSets = {
  sessionId: string
  performedAt: string
  treinoNome: string | null
  /** Séries da sessão, ordenadas por serie_num. */
  sets: SetLogWithSession[]
  cargaMaxima: number
}

/** Agrupa os set_logs por sessão (mais recente primeiro), com séries ordenadas — base da Análise de Séries. */
export function groupSetsBySession(logs: SetLogWithSession[]): SessionSets[] {
  const map = new Map<string, SetLogWithSession[]>()
  for (const log of logs) {
    const list = map.get(log.session_id) ?? []
    list.push(log)
    map.set(log.session_id, list)
  }

  const sessions = [...map.entries()].map(([sessionId, sets]) => {
    sets.sort((a, b) => a.serie_num - b.serie_num)
    const cargaMaxima = sets.reduce((max, s) => Math.max(max, s.carga_kg ?? 0), 0)
    return {
      sessionId,
      performedAt: sets[0].performed_at,
      treinoNome: sets[0].treino_nome ?? null,
      sets,
      cargaMaxima,
    }
  })

  sessions.sort((a, b) => new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime())
  return sessions
}

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
    let rpeSoma = 0
    let rpeCount = 0

    for (const log of sessionLogs) {
      const carga = log.carga_kg ?? 0
      const reps = log.reps ?? 0
      if (carga > cargaMaxima) cargaMaxima = carga
      const oneRm = epley1RM(carga, reps)
      if (oneRm > melhor1RM) melhor1RM = oneRm
      volume += carga * reps
      if (log.rpe != null) {
        rpeSoma += log.rpe
        rpeCount += 1
      }
    }

    aggregates.push({
      sessionId,
      performedAt: sessionLogs[0].performed_at,
      cargaMaxima,
      melhor1RM,
      volume,
      rpeMedio: rpeCount > 0 ? Math.round((rpeSoma / rpeCount) * 10) / 10 : null,
    })
  }

  aggregates.sort((a, b) => new Date(a.performedAt).getTime() - new Date(b.performedAt).getTime())

  let best1RM = 0
  return aggregates.map((aggregate) => {
    const isPR = aggregate.melhor1RM > best1RM
    if (aggregate.melhor1RM > best1RM) best1RM = aggregate.melhor1RM
    return { ...aggregate, isPR }
  })
}

export type TrainingTrend = {
  estagnado: boolean
  deloadSugerido: boolean
  motivo: string | null
}

/**
 * Primeiro uso real do RPE coletado: tendência das últimas sessões de um
 * exercício. Estagnado = 3+ sessões sem o 1RM subir. Deload sugerido =
 * estagnado E RPE médio subindo (esforço maior pelo mesmo resultado —
 * assinatura clássica de fadiga acumulada).
 */
export function analyzeTrainingTrend(aggregates: SessionAggregate[]): TrainingTrend {
  if (aggregates.length < 4) return { estagnado: false, deloadSugerido: false, motivo: null }

  const tres = aggregates.slice(-3)
  const anteriores = aggregates.slice(0, -3)
  const pico = anteriores.reduce((best, a) => (a.melhor1RM > best.melhor1RM ? a : best))
  const estagnado = tres.every((a) => a.melhor1RM <= pico.melhor1RM)
  if (!estagnado) return { estagnado: false, deloadSugerido: false, motivo: null }

  const rpes = aggregates
    .slice(-4)
    .map((a) => a.rpeMedio)
    .filter((r): r is number => r !== null)
  const rpeSubindo = rpes.length >= 3 && rpes[rpes.length - 1] > rpes[0] && rpes[rpes.length - 1] >= 8

  if (rpeSubindo) {
    return {
      estagnado: true,
      deloadSugerido: true,
      motivo: `1RM parado há ${tres.length} sessões com RPE subindo (${rpes[0]} → ${rpes[rpes.length - 1]}) — esforço maior, mesmo resultado. Sinal de deload.`,
    }
  }
  return {
    estagnado: true,
    deloadSugerido: false,
    motivo: `1RM não sobe há ${tres.length} sessões (pico: ${Math.round(pico.melhor1RM)}kg em ${pico.performedAt.slice(0, 10)}). Revise carga, sono ou volume.`,
  }
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
  const targetReps = repsAlvoMax(prescription)
  const completed = lastSessionLogs.filter((log) => log.concluida)

  if (completed.length < targetSeries) return null
  if (targetReps === null) return null
  if (!completed.every((log) => (log.reps ?? 0) >= targetReps)) return null

  const cargas = completed.map((log) => log.carga_kg ?? 0)
  const minCarga = Math.min(...cargas)
  const novaCarga = minCarga + OVERLOAD_INCREMENT_KG

  return `Você bateu todas as séries na última sessão. Sugestão: ${novaCarga}kg (ou +1 rep) na próxima.`
}

export type OverloadSuggestion = {
  /** sobe = bateu tudo na última (aumentar carga); mantem = faltou rep (repetir carga). */
  tipo: 'sobe' | 'mantem'
  texto: string
  /** Carga sugerida para hoje, em kg (null se não houver carga registrada). */
  cargaKg: number | null
}

/**
 * Sugestão de progressão para a sessão atual, olhando só a sessão anterior mais
 * recente do exercício (a sessão em andamento é excluída do histórico).
 */
export function computeOverloadSuggestion(
  history: SetLogWithSession[],
  sessionIdAtual: string,
  prescription: WorkoutExercise,
): OverloadSuggestion | null {
  const logs = history.filter((l) => l.session_id !== sessionIdAtual)
  if (logs.length === 0) return null

  const ultimaSessao = logs.reduce((max, l) => (l.performed_at > max ? l.performed_at : max), '')
  const daUltima = logs.filter((l) => l.performed_at === ultimaSessao)
  if (daUltima.length === 0) return null

  const positivo = suggestOverload(daUltima, prescription)
  if (positivo) {
    const concluidas = daUltima.filter((l) => l.concluida)
    const minCarga = Math.min(...concluidas.map((l) => l.carga_kg ?? 0))
    return { tipo: 'sobe', texto: positivo, cargaKg: minCarga + OVERLOAD_INCREMENT_KG }
  }

  const targetReps = repsAlvoMax(prescription)
  const targetSeries = prescription.series_alvo ?? daUltima.length
  if (targetReps !== null && daUltima.length >= targetSeries) {
    const faltantes = daUltima.filter((l) => (l.reps ?? 0) < targetReps).length
    const melhor = daUltima.reduce((a, b) => ((b.carga_kg ?? 0) > (a.carga_kg ?? 0) ? b : a))
    return {
      tipo: 'mantem',
      texto: `Na última faltou rep em ${faltantes} série${faltantes > 1 ? 's' : ''} — repete ${melhor.carga_kg ?? '—'}kg e busca o topo (${metaReps(prescription) ?? `${targetReps} reps`}).`,
      cargaKg: melhor.carga_kg,
    }
  }
  return null
}

/**
 * Uma série bate recorde quando supera a maior carga do histórico E a maior já
 * feita nesta sessão — senão cada série acima do recorde antigo celebraria de novo.
 * Sem histórico (primeira vez no exercício) não há recorde a bater.
 */
export function isNewRecord(cargaKg: number | null, historicoMaxKg: number | null, sessaoMaxKg: number | null): boolean {
  if (cargaKg == null || historicoMaxKg == null) return false
  return cargaKg > Math.max(historicoMaxKg, sessaoMaxKg ?? 0)
}

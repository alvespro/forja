import { addDaysToDateString } from '@/lib/date'

export type ProjectionPoint = { date: string; peso: number }

export type ProjectionStatus = 'ok' | 'sem_dados' | 'ja_atingida' | 'recomposicao' | 'taxa_invalida'

export type WeightProjection = {
  /** Semanas até a meta (null quando indefinido: recomposição, taxa inválida ou sem dados). */
  weeks: number | null
  /** Data 'yyyy-MM-dd' projetada para atingir a meta (null quando indefinido). */
  targetDate: string | null
  points: ProjectionPoint[]
  status: ProjectionStatus
}

const RECOMPOSICAO_SEMANAS = 12

/**
 * Projeção linear de peso. `taxaSemanal` é kg/semana com sinal (negativo = perda).
 * Gera um ponto por semana do peso atual até a meta; recomposição (taxa 0) mantém o peso.
 */
export function projectWeight(
  pesoAtual: number | null,
  pesoMeta: number | null,
  taxaSemanal: number,
  startDateISO: string,
): WeightProjection {
  if (pesoAtual == null || pesoMeta == null) {
    return { weeks: null, targetDate: null, points: [], status: 'sem_dados' }
  }

  const delta = pesoMeta - pesoAtual

  if (Math.abs(delta) < 0.05) {
    return {
      weeks: 0,
      targetDate: startDateISO,
      points: [{ date: startDateISO, peso: pesoAtual }],
      status: 'ja_atingida',
    }
  }

  if (taxaSemanal === 0) {
    const points = Array.from({ length: RECOMPOSICAO_SEMANAS + 1 }, (_, k) => ({
      date: addDaysToDateString(startDateISO, k * 7),
      peso: pesoAtual,
    }))
    return { weeks: null, targetDate: null, points, status: 'recomposicao' }
  }

  // Taxa aponta na direção contrária à meta (ex.: quer emagrecer mas escolheu ganho).
  if (Math.sign(taxaSemanal) !== Math.sign(delta)) {
    return { weeks: null, targetDate: null, points: [], status: 'taxa_invalida' }
  }

  const weeks = Math.ceil(Math.abs(delta) / Math.abs(taxaSemanal))
  const points: ProjectionPoint[] = []
  for (let k = 0; k <= weeks; k++) {
    const raw = pesoAtual + taxaSemanal * k
    const peso = k === weeks ? pesoMeta : raw
    points.push({ date: addDaysToDateString(startDateISO, k * 7), peso: Math.round(peso * 10) / 10 })
  }

  return { weeks, targetDate: addDaysToDateString(startDateISO, weeks * 7), points, status: 'ok' }
}

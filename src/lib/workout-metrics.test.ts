import { describe, expect, it } from 'vitest'

import { analyzeTrainingTrend, type SessionAggregate } from './workout-metrics'

function agg(performedAt: string, melhor1RM: number, rpeMedio: number | null = null): SessionAggregate {
  return { sessionId: performedAt, performedAt, cargaMaxima: 0, melhor1RM, volume: 1000, rpeMedio, isPR: false }
}

describe('analyzeTrainingTrend', () => {
  it('menos de 4 sessões não conclui nada', () => {
    expect(analyzeTrainingTrend([agg('2026-06-01', 100), agg('2026-06-05', 100), agg('2026-06-10', 100)])).toEqual({
      estagnado: false,
      deloadSugerido: false,
      motivo: null,
    })
  })

  it('progresso recente não é estagnação', () => {
    const trend = analyzeTrainingTrend([
      agg('2026-06-01', 100),
      agg('2026-06-05', 100),
      agg('2026-06-10', 101),
      agg('2026-06-15', 103),
    ])
    expect(trend.estagnado).toBe(false)
  })

  it('3 sessões sem superar o pico = estagnado (sem RPE, sem deload)', () => {
    const trend = analyzeTrainingTrend([
      agg('2026-06-01', 105),
      agg('2026-06-05', 100),
      agg('2026-06-10', 102),
      agg('2026-06-15', 104),
    ])
    expect(trend.estagnado).toBe(true)
    expect(trend.deloadSugerido).toBe(false)
    expect(trend.motivo).toContain('105kg')
    expect(trend.motivo).toContain('2026-06-01')
  })

  it('estagnado com RPE subindo até 8+ = deload sugerido', () => {
    const trend = analyzeTrainingTrend([
      agg('2026-06-01', 105, 7),
      agg('2026-06-05', 100, 7.5),
      agg('2026-06-10', 102, 8),
      agg('2026-06-15', 104, 9),
    ])
    expect(trend.deloadSugerido).toBe(true)
    expect(trend.motivo).toContain('deload')
  })

  it('estagnado com RPE alto mas estável não dispara deload', () => {
    const trend = analyzeTrainingTrend([
      agg('2026-06-01', 105, 8),
      agg('2026-06-05', 100, 8),
      agg('2026-06-10', 102, 8),
      agg('2026-06-15', 104, 8),
    ])
    expect(trend.estagnado).toBe(true)
    expect(trend.deloadSugerido).toBe(false)
  })
})

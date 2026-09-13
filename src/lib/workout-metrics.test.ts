import { describe, expect, it } from 'vitest'

import {
  analyzeTrainingTrend,
  groupSetsBySession,
  type SessionAggregate,
  type SetLogWithSession,
} from './workout-metrics'

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

function setLog(
  sessionId: string,
  performedAt: string,
  serieNum: number,
  cargaKg: number | null,
): SetLogWithSession {
  return {
    id: `${sessionId}-${serieNum}`,
    user_id: 'u',
    session_id: sessionId,
    exercise_id: 'e',
    serie_num: serieNum,
    carga_kg: cargaKg,
    reps: 10,
    pausa_seg: null,
    cadencia: null,
    rpe: null,
    concluida: true,
    created_at: performedAt,
    performed_at: performedAt,
  }
}

describe('groupSetsBySession', () => {
  it('agrupa por sessão, ordena séries e calcula a carga máxima', () => {
    const sessions = groupSetsBySession([
      setLog('s1', '2026-06-01', 2, 80),
      setLog('s1', '2026-06-01', 1, 100),
      setLog('s2', '2026-06-08', 1, 90),
    ])
    expect(sessions).toHaveLength(2)
    // mais recente primeiro
    expect(sessions[0].sessionId).toBe('s2')
    expect(sessions[1].sessionId).toBe('s1')
    // séries ordenadas por serie_num
    expect(sessions[1].sets.map((s) => s.serie_num)).toEqual([1, 2])
    expect(sessions[1].cargaMaxima).toBe(100)
  })

  it('lista vazia retorna vazio', () => {
    expect(groupSetsBySession([])).toEqual([])
  })
})

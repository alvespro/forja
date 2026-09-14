import { describe, expect, it } from 'vitest'

import {
  analyzeTrainingTrend,
  computeOverloadSuggestion,
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

describe('computeOverloadSuggestion', () => {
  const prescricao = {
    id: 'p',
    user_id: 'u',
    workout_id: 'w',
    exercise_id: 'e',
    ordem: 1,
    series_alvo: 3,
    reps_alvo: '10-12',
    pausa_alvo_seg: 90,
    cadencia_alvo: null,
    notas: null,
  } as unknown as Parameters<typeof computeOverloadSuggestion>[2]

  const serie = (session: string, data: string, n: number, carga: number, reps: number): SetLogWithSession => ({
    ...setLog(session, data, n, carga),
    reps,
  })

  it('bateu todas as reps na última → sobe 2,5 kg sobre a menor carga', () => {
    const hist = [serie('s1', '2026-07-01', 1, 70, 12), serie('s1', '2026-07-01', 2, 70, 12), serie('s1', '2026-07-01', 3, 70, 12)]
    const s = computeOverloadSuggestion(hist, 'atual', prescricao)
    expect(s?.tipo).toBe('sobe')
    expect(s?.cargaKg).toBe(72.5)
  })

  it('faltou rep → mantém a melhor carga', () => {
    const hist = [serie('s1', '2026-07-01', 1, 70, 12), serie('s1', '2026-07-01', 2, 70, 9), serie('s1', '2026-07-01', 3, 67.5, 8)]
    const s = computeOverloadSuggestion(hist, 'atual', prescricao)
    expect(s?.tipo).toBe('mantem')
    expect(s?.cargaKg).toBe(70)
  })

  it('ignora as séries da sessão em andamento', () => {
    const hist = [serie('atual', '2026-09-14', 1, 80, 12)]
    expect(computeOverloadSuggestion(hist, 'atual', prescricao)).toBeNull()
  })

  it('usa só a sessão anterior mais recente', () => {
    const hist = [
      serie('antiga', '2026-06-01', 1, 50, 12), serie('antiga', '2026-06-01', 2, 50, 12), serie('antiga', '2026-06-01', 3, 50, 12),
      serie('recente', '2026-07-01', 1, 70, 12), serie('recente', '2026-07-01', 2, 70, 12), serie('recente', '2026-07-01', 3, 70, 12),
    ]
    expect(computeOverloadSuggestion(hist, 'atual', prescricao)?.cargaKg).toBe(72.5)
  })
})

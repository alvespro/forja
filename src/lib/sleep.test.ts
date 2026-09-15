import { describe, expect, it } from 'vitest'

import { homaInputsFrom, latestMarkers, lipidInputsFrom } from './clinical-inputs'
import { formatHoras, noiteAnterior, pairSleepWithRecovery, sleepWeekStats } from './sleep'
import type { RecoveryScore, SleepLog } from '@/types/database'

const sono = (data: string, horas: number): SleepLog => ({
  id: data,
  user_id: 'u',
  data,
  hora_dormir: null,
  hora_acordar: null,
  duracao_min: horas * 60,
  qualidade: null,
  notas: null,
  fonte: 'manual',
})

const rec = (data: string, score: number): RecoveryScore => ({
  id: data,
  user_id: 'u',
  data,
  score,
  classificacao: null,
  sono_horas: null,
  fc_repouso: null,
  dor_muscular: null,
  volume_ontem: null,
  recomendacao: null,
  componentes: null,
  decisao_treino: null,
})

describe('sono', () => {
  it('a noite que alimenta o score de hoje é a de ontem', () => {
    expect(noiteAnterior('2026-09-14')).toBe('2026-09-13')
  })

  it('média e dívida só dos últimos 7 dias (sem contar hoje)', () => {
    const logs = [sono('2026-09-01', 4), sono('2026-09-07', 6), sono('2026-09-12', 7.5), sono('2026-09-13', 8.5), sono('2026-09-14', 5)]
    // janela: 07..13 → 6, 7,5, 8,5
    expect(sleepWeekStats(logs, '2026-09-14')).toEqual({ media: 7.3, divida: 2.5, noitesRegistradas: 3 })
  })

  it('sem registros não inventa média', () => {
    expect(sleepWeekStats([], '2026-09-14')).toEqual({ media: null, divida: 0, noitesRegistradas: 0 })
  })

  it('pareia o score do dia com o sono da noite anterior', () => {
    const pares = pairSleepWithRecovery([sono('2026-09-12', 6), sono('2026-09-13', 8)], [rec('2026-09-13', 55), rec('2026-09-14', 90), rec('2026-09-10', 70)])
    expect(pares).toEqual([
      { data: '2026-09-13', horas: 6, score: 55 },
      { data: '2026-09-14', horas: 8, score: 90 },
    ])
  })

  it('formata com vírgula', () => {
    expect(formatHoras(6.5)).toBe('6,5h')
    expect(formatHoras(7)).toBe('7h')
  })
})

describe('entradas clínicas', () => {
  it('HOMA-IR exige glicemia e insulina', () => {
    expect(homaInputsFrom([{ chave: 'glicemia', valor: 90 }])).toBeNull()
    expect(homaInputsFrom([{ chave: 'glicemia', valor: 90 }, { chave: 'insulina', valor: 8 }])).toEqual({ glicemia: 90, insulina: 8 })
  })

  it('ratios exigem CT, HDL e LDL; triglicerídeos é opcional', () => {
    expect(lipidInputsFrom([{ chave: 'ldl', valor: 100 }, { chave: 'hdl', valor: 50 }])).toBeNull()
    expect(
      lipidInputsFrom([
        { chave: 'colesterol_total', valor: 180 },
        { chave: 'ldl', valor: 100 },
        { chave: 'hdl', valor: 50 },
      ]),
    ).toEqual({ colesterol_total: 180, hdl: 50, ldl: 100, triglicerides: null })
  })

  it('latestMarkers fica com a medição mais recente de cada chave', () => {
    const r = latestMarkers([
      { chave: 'hdl', valor: 40, measured_at: '2026-06-25' },
      { chave: 'hdl', valor: 48, measured_at: '2026-09-01' },
      { chave: 'ldl', valor: 110, measured_at: '2026-06-25' },
    ])
    expect(r.find((m) => m.chave === 'hdl')?.valor).toBe(48)
    expect(r).toHaveLength(2)
  })
})

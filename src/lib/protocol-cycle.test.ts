import { describe, expect, it } from 'vitest'

import { aplicacaoNaoRegistrada, alertasDoCiclo, compostosDaSemana, dataDoLog, datasDeAplicacao, estadoDoCiclo } from './protocol-cycle'

/** Ciclo 01 — Recomposição, como está no banco. */
const CICLO = { data_inicio: '2026-09-17', data_fim_prevista: '2026-12-10', duracao_semanas: 12 }

describe('estadoDoCiclo', () => {
  it('véspera: ciclo inicia amanhã', () => {
    expect(estadoDoCiclo(CICLO, '2026-09-16')).toEqual({ fase: 'antes', inicio: '2026-09-17', diasParaInicio: 1, totalSemanas: 12 })
  })

  it('dia do início é semana 1 e dia de aplicação', () => {
    expect(estadoDoCiclo(CICLO, '2026-09-17')).toMatchObject({ fase: 'ativo', semana: 1, ehDiaDeAplicacao: true, proximaAplicacao: '2026-09-17' })
  })

  it('no dia seguinte continua semana 1, próxima aplicação em 7 dias', () => {
    expect(estadoDoCiclo(CICLO, '2026-09-18')).toMatchObject({ semana: 1, ehDiaDeAplicacao: false, proximaAplicacao: '2026-09-24' })
  })

  it('29/10 (6 semanas completas) abre a semana 7; 12ª e última aplicação em 03/12', () => {
    expect(estadoDoCiclo(CICLO, '2026-10-28')).toMatchObject({ semana: 6, ehDiaDeAplicacao: false })
    expect(estadoDoCiclo(CICLO, '2026-10-29')).toMatchObject({ semana: 7, ehDiaDeAplicacao: true })
    expect(estadoDoCiclo(CICLO, '2026-12-03')).toMatchObject({ semana: 12, ehDiaDeAplicacao: true, ultimaSemana: true })
  })

  it('depois da última aplicação não há próxima; após o fim, concluído', () => {
    expect(estadoDoCiclo(CICLO, '2026-12-10')).toMatchObject({ fase: 'ativo', semana: 12, ehDiaDeAplicacao: false, proximaAplicacao: null })
    expect(estadoDoCiclo(CICLO, '2026-12-11')).toEqual({ fase: 'concluido', fim: '2026-12-10' })
  })

  it('sem data de início', () => {
    expect(estadoDoCiclo({ data_inicio: null, data_fim_prevista: null, duracao_semanas: null }, '2026-09-17')).toEqual({ fase: 'sem_data' })
  })
})

describe('datas e registros', () => {
  it('12 aplicações às quintas, de 17/09 a 03/12', () => {
    const datas = datasDeAplicacao(CICLO)
    expect(datas).toHaveLength(12)
    expect([datas[0], datas[5], datas[11]]).toEqual(['2026-09-17', '2026-10-22', '2026-12-03'])
  })

  it('dataDoLog usa o fuso de São Paulo (23h de quinta não vira sexta)', () => {
    expect(dataDoLog('2026-09-18T01:30:00.000Z')).toBe('2026-09-17')
    expect(dataDoLog('2026-09-17')).toBe('2026-09-17')
  })

  it('aplicação passada sem registro aparece; registrada ou futura não', () => {
    expect(aplicacaoNaoRegistrada(CICLO, new Set(), '2026-09-18')).toBe('2026-09-17')
    expect(aplicacaoNaoRegistrada(CICLO, new Set(['2026-09-17']), '2026-09-18')).toBeNull()
    expect(aplicacaoNaoRegistrada(CICLO, new Set(), '2026-09-17')).toBeNull()
  })

  it('compostos filtrados pela janela de semanas', () => {
    const compostos = [
      { nome: 'A', semana_inicio: 1, semana_fim: 12 },
      { nome: 'B', semana_inicio: 13, semana_fim: 16 },
      { nome: 'C', semana_inicio: null, semana_fim: null },
    ]
    expect(compostosDaSemana(compostos, 6).map((c) => c.nome)).toEqual(['A', 'C'])
  })
})

describe('alertasDoCiclo', () => {
  const exames = [
    { nome: 'Hemograma + Hematócrito', tipo: 'mid_ciclo', status: 'pendente', data_prevista: '2026-10-29' },
    { nome: 'Estradiol (E2)', tipo: 'mid_ciclo', status: 'pendente', data_prevista: '2026-10-29' },
    { nome: 'Lipidograma', tipo: 'mid_ciclo', status: 'realizado', data_prevista: '2026-10-29' },
    { nome: 'Testosterona', tipo: 'pos_ciclo', status: 'pendente', data_prevista: '2027-01-07' },
  ]

  it('exames mid-ciclo a 3 dias (26/10), só os pendentes', () => {
    expect(alertasDoCiclo(estadoDoCiclo(CICLO, '2026-10-26'), exames, '2026-10-26')).toEqual([
      { tipo: 'exames_mid_ciclo', dias: 3, data: '2026-10-29', exames: ['Hemograma + Hematócrito', 'Estradiol (E2)'] },
    ])
    expect(alertasDoCiclo(estadoDoCiclo(CICLO, '2026-10-25'), exames, '2026-10-25')).toEqual([])
  })

  it('última semana do ciclo', () => {
    expect(alertasDoCiclo(estadoDoCiclo(CICLO, '2026-12-03'), [], '2026-12-03')).toEqual([{ tipo: 'ultima_semana' }])
  })
})

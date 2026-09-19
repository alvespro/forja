import { describe, expect, it } from 'vitest'

import { baseDasSeries, confirmadasNosLogs, passoAposConfirmar, totalSeriesDe } from './session-progress'

describe('passoAposConfirmar', () => {
  it('fluxo de 3 séries: cronômetro, cronômetro, próximo exercício', () => {
    expect(passoAposConfirmar(1, 3, false)).toBe('cronometro')
    expect(passoAposConfirmar(2, 3, false)).toBe('cronometro')
    expect(passoAposConfirmar(3, 3, false)).toBe('proximo_exercicio')
  })

  it('última série do último exercício fecha o treino (sem série extra)', () => {
    expect(passoAposConfirmar(2, 3, true)).toBe('cronometro')
    expect(passoAposConfirmar(3, 3, true)).toBe('finalizar')
  })

  it('exercício de 1 série avança direto', () => {
    expect(passoAposConfirmar(1, 1, false)).toBe('proximo_exercicio')
  })
})

describe('totalSeriesDe', () => {
  it('mínimo 1', () => {
    expect(totalSeriesDe({ series_alvo: null })).toBe(1)
    expect(totalSeriesDe({ series_alvo: 0 })).toBe(1)
    expect(totalSeriesDe({ series_alvo: 4 })).toBe(4)
  })
})

describe('baseDasSeries', () => {
  it('exercício repetido grava numa faixa própria (extras não colidem)', () => {
    const base = baseDasSeries([
      { id: 'a', exercise_id: 'x', series_alvo: 4 },
      { id: 'b', exercise_id: 'y', series_alvo: 3 },
      { id: 'c', exercise_id: 'x', series_alvo: 3 },
    ])
    expect(base.get('a')).toBe(0)
    expect(base.get('b')).toBe(0)
    expect(base.get('c')).toBe(100)
  })
})

describe('confirmadasNosLogs', () => {
  const log = (serie_num: number, concluida = true, exercise_id = 'x') => ({ exercise_id, serie_num, concluida })

  it('conta a sequência contínua de séries concluídas', () => {
    expect(confirmadasNosLogs([log(1), log(2)], 'x', 0, 3)).toBe(2)
    expect(confirmadasNosLogs([log(1), log(3)], 'x', 0, 3)).toBe(1)
    expect(confirmadasNosLogs([log(1, false)], 'x', 0, 3)).toBe(0)
  })

  it('duplicatas não inflam; o limite corta o que passa do total', () => {
    expect(confirmadasNosLogs([log(1), log(1), log(2), log(3), log(4)], 'x', 0, 3)).toBe(3)
  })

  it('sem limite conta as séries extras gravadas', () => {
    expect(confirmadasNosLogs([log(1), log(2), log(3), log(4)], 'x', 0)).toBe(4)
  })

  it('respeita a base da 2ª ocorrência e ignora outro exercício', () => {
    const logs = [log(1), log(2), log(3), log(101), log(1, true, 'y')]
    expect(confirmadasNosLogs(logs, 'x', 100, 3)).toBe(1)
    expect(confirmadasNosLogs(logs, 'y', 0, 3)).toBe(1)
  })
})

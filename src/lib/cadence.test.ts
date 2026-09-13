import { describe, expect, it } from 'vitest'

import { explainCadence, parseCadence, splitCues } from './cadence'

describe('parseCadence', () => {
  it('interpreta notação de 4 fases', () => {
    expect(parseCadence('3-0-1-0')).toEqual({ excentrica: 3, pausaBaixo: 0, concentrica: 1, pausaCima: 0 })
  })

  it('aceita separador por espaço ou dois-pontos', () => {
    expect(parseCadence('2 1 2 0')).toEqual({ excentrica: 2, pausaBaixo: 1, concentrica: 2, pausaCima: 0 })
    expect(parseCadence('4:0:1:1')).toEqual({ excentrica: 4, pausaBaixo: 0, concentrica: 1, pausaCima: 1 })
  })

  it('retorna null para notação inválida ou nula', () => {
    expect(parseCadence(null)).toBeNull()
    expect(parseCadence('3-0-1')).toBeNull()
    expect(parseCadence('rápido')).toBeNull()
  })
})

describe('explainCadence', () => {
  it('descreve as fases, marcando ausência de pausa', () => {
    expect(explainCadence('3-0-1-0')).toBe('3s descendo, sem pausa embaixo, 1s subindo, sem pausa em cima')
  })

  it('descreve pausas quando existem', () => {
    expect(explainCadence('4-2-1-1')).toBe('4s descendo, 2s pausa embaixo, 1s subindo, 1s pausa em cima')
  })

  it('retorna null quando não há cadência', () => {
    expect(explainCadence(null)).toBeNull()
  })
})

describe('splitCues', () => {
  it('quebra por linhas', () => {
    expect(splitCues('Escápula retraída\nCotovelo colado\nDesça controlado')).toEqual([
      'Escápula retraída',
      'Cotovelo colado',
      'Desça controlado',
    ])
  })

  it('quebra linha única por ponto-e-vírgula ou frase', () => {
    expect(splitCues('Escápula retraída; cotovelo colado')).toEqual(['Escápula retraída', 'cotovelo colado'])
  })

  it('retorna vazio para nulo', () => {
    expect(splitCues(null)).toEqual([])
  })
})

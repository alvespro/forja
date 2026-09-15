import { describe, expect, it } from 'vitest'

import { ehHabitoDeMovimento, gateRecuperacao, progressoRotina } from './mobility'

describe('mobilidade', () => {
  it('progresso conta o exercício atual e os próximos', () => {
    expect(progressoRotina(1, 5, 45, 45)).toBe('Exercício 2 de 5 · 3min restantes') // 45 + 3×45 = 180s
    expect(progressoRotina(4, 5, 45, 20)).toBe('Exercício 5 de 5 · 20s restantes')
  })

  it('gate: crítico abaixo de 40 mesmo sem treino', () => {
    expect(gateRecuperacao({ score: 38, treinoProgramado: false, decisao: null })).toBe('critico')
    expect(gateRecuperacao({ score: 38, treinoProgramado: true, decisao: 'treino' })).toBe('critico')
  })

  it('gate: adaptado entre 40 e 59 só com treino programado e sem escolha de treinar', () => {
    expect(gateRecuperacao({ score: 54, treinoProgramado: true, decisao: null })).toBe('adaptado')
    expect(gateRecuperacao({ score: 54, treinoProgramado: true, decisao: 'treino' })).toBeNull()
    expect(gateRecuperacao({ score: 54, treinoProgramado: false, decisao: null })).toBeNull()
  })

  it('gate: nada a partir de 60 ou sem score', () => {
    expect(gateRecuperacao({ score: 60, treinoProgramado: true, decisao: null })).toBeNull()
    expect(gateRecuperacao({ score: 85, treinoProgramado: true, decisao: null })).toBeNull()
    expect(gateRecuperacao({ score: null, treinoProgramado: true, decisao: null })).toBeNull()
  })

  it('reconhece o hábito de movimento', () => {
    expect(ehHabitoDeMovimento('Mover o corpo')).toBe(true)
    expect(ehHabitoDeMovimento('Construir um ativo')).toBe(false)
  })
})

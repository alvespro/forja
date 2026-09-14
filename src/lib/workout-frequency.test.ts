import { describe, expect, it } from 'vitest'

import { resolveGroupKeys } from './muscle-groups'
import { muscleStatesFromFreshness, type MuscleGroupFreshness } from './workout-frequency'

const f = (foco: string, diasSemEstimulo: number | null): MuscleGroupFreshness => ({
  foco,
  ultimaSessao: null,
  diasSemEstimulo,
  alerta: diasSemEstimulo !== null && diasSemEstimulo > 7,
})

describe('muscleStatesFromFreshness', () => {
  it('classifica pelos limites: hoje, recente, descansado', () => {
    const estados = muscleStatesFromFreshness(
      [f('Peito', 0), f('Ombros', 2), f('Costas', 5), f('Membros Inferiores', 30)],
      resolveGroupKeys,
    )
    expect(estados).toEqual({ peito: 'ativo', ombros: 'recente', costas: 'inativo', pernas: 'descansado' })
  })

  it('grupo em mais de um treino assume o estímulo mais recente', () => {
    const estados = muscleStatesFromFreshness([f('Costas e Bíceps', 20), f('Bíceps e Tríceps', 1)], resolveGroupKeys)
    expect(estados.biceps).toBe('recente')
    expect(estados.costas).toBe('descansado')
    expect(estados.triceps).toBe('recente')
  })

  it('treino nunca realizado não marca nada', () => {
    expect(muscleStatesFromFreshness([f('Peito', null)], resolveGroupKeys)).toEqual({})
  })
})

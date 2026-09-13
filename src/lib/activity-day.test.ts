import { describe, expect, it } from 'vitest'

import { activityLevel, computeActivityDay } from './activity-day'

describe('computeActivityDay', () => {
  it('calcula o percentual de hábitos', () => {
    expect(computeActivityDay({ habitsTotal: 4, habitsDone: 3, treino: true, cardio: false }).habitos_pct).toBe(75)
  })

  it('sem hábitos ativos, percentual é 0 (sem divisão por zero)', () => {
    expect(computeActivityDay({ habitsTotal: 0, habitsDone: 0, treino: false, cardio: false }).habitos_pct).toBe(0)
  })
})

describe('activityLevel', () => {
  const base = { treino: false, cardio: false, habitos_pct: 0, refeicoes_pct: 0 }

  it('0 = sem nada', () => {
    expect(activityLevel(base)).toBe(0)
  })

  it('1 = hábitos abaixo de 50%', () => {
    expect(activityLevel({ ...base, habitos_pct: 25 })).toBe(1)
  })

  it('2 = hábitos ≥ 50% ou treino ou cardio', () => {
    expect(activityLevel({ ...base, habitos_pct: 50 })).toBe(2)
    expect(activityLevel({ ...base, treino: true })).toBe(2)
    expect(activityLevel({ ...base, cardio: true })).toBe(2)
  })

  it('3 = treino + hábitos ≥ 70%', () => {
    expect(activityLevel({ ...base, treino: true, habitos_pct: 70 })).toBe(3)
  })

  it('4 = treino + hábitos 100% + nutrição 100%', () => {
    expect(activityLevel({ treino: true, cardio: true, habitos_pct: 100, refeicoes_pct: 100 })).toBe(4)
  })
})

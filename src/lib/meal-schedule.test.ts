import { describe, expect, it } from 'vitest'

import { classifyMeals, horarioToMinutes, type SchedulableSlot } from './meal-schedule'

const slots: SchedulableSlot[] = [
  { id: 'cafe', numero: 1, horario_alvo: '07:00:00' },
  { id: 'almoco', numero: 2, horario_alvo: '12:30:00' },
  { id: 'pretreino', numero: 3, horario_alvo: '16:30:00' },
  { id: 'jantar', numero: 4, horario_alvo: '20:00:00' },
]

describe('horarioToMinutes', () => {
  it('converte HH:MM:SS em minutos', () => {
    expect(horarioToMinutes('12:30:00')).toBe(750)
    expect(horarioToMinutes('07:00')).toBe(420)
  })
  it('retorna null para nulo/invalido', () => {
    expect(horarioToMinutes(null)).toBeNull()
    expect(horarioToMinutes('abc')).toBeNull()
  })
})

describe('classifyMeals', () => {
  it('no meio da tarde, atual = almoço, próxima = pré-treino', () => {
    expect(classifyMeals(slots, 13 * 60)).toEqual({ currentId: 'almoco', nextId: 'pretreino' })
  })

  it('antes da primeira refeição, atual = café, próxima = almoço', () => {
    expect(classifyMeals(slots, 6 * 60)).toEqual({ currentId: 'cafe', nextId: 'almoco' })
  })

  it('depois da última, atual = jantar, próxima = null', () => {
    expect(classifyMeals(slots, 22 * 60)).toEqual({ currentId: 'jantar', nextId: null })
  })

  it('exatamente no horário conta como atual', () => {
    expect(classifyMeals(slots, 12 * 60 + 30).currentId).toBe('almoco')
  })

  it('lista vazia não quebra', () => {
    expect(classifyMeals([], 600)).toEqual({ currentId: null, nextId: null })
  })
})

import { describe, expect, it } from 'vitest'

import { computeNextAction, type NextActionInput } from './next-action'

const base: NextActionInput = {
  nowMinutes: 10 * 60,
  isSunday: false,
  weighedThisWeek: true,
  currentMeal: null,
}

describe('computeNextAction', () => {
  it('antes das 7h prioriza o ritual matinal', () => {
    expect(computeNextAction({ ...base, nowMinutes: 6 * 60 }).to).toBe('/habits')
    expect(computeNextAction({ ...base, nowMinutes: 6 * 60 }).icon).toBe('☀️')
  })

  it('dentro da janela de ±30min de uma refeição sugere registrar', () => {
    const action = computeNextAction({ ...base, currentMeal: { nome: 'Almoço', minutes: 12 * 60 }, nowMinutes: 12 * 60 + 20 })
    expect(action.to).toBe('/nutricao')
    expect(action.title).toContain('Almoço')
  })

  it('fora da janela da refeição não sugere registrar', () => {
    const action = computeNextAction({ ...base, currentMeal: { nome: 'Almoço', minutes: 12 * 60 }, nowMinutes: 15 * 60 })
    expect(action.to).not.toBe('/nutricao')
  })

  it('domingo sem pesagem sugere pesar', () => {
    expect(computeNextAction({ ...base, isSunday: true, weighedThisWeek: false }).to).toBe('/body')
  })

  it('domingo já pesado cai no padrão', () => {
    expect(computeNextAction({ ...base, isSunday: true, weighedThisWeek: true }).to).toBe('/habits')
  })

  it('padrão foca nos hábitos', () => {
    expect(computeNextAction(base).icon).toBe('🎯')
  })
})

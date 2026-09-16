import { describe, expect, it } from 'vitest'

import { computeNextAction, type NextActionInput } from './next-action'

const base: NextActionInput = {
  nowMinutes: 10 * 60,
  isSunday: false,
  weighedThisWeek: true,
  treinouHoje: true,
  currentMeal: null,
}

describe('computeNextAction', () => {
  it('antes das 7h prioriza o ritual 5AM', () => {
    const action = computeNextAction({ ...base, nowMinutes: 6 * 60 })
    expect(action.to).toBe('/habits')
    expect(action.icon).toBe('wb_twilight')
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

  it('domingo já pesado cai no padrão da faixa', () => {
    expect(computeNextAction({ ...base, isSunday: true, weighedThisWeek: true }).to).toBe('/habits')
  })

  it('manhã/tarde sem treino registrado aponta para o treino', () => {
    expect(computeNextAction({ ...base, treinouHoje: false }).to).toBe('/workout')
  })

  it('manhã/tarde com treino feito foca nos hábitos', () => {
    expect(computeNextAction(base).icon).toBe('flag')
  })

  it('16h–19h sem treino abre a janela do treino', () => {
    const action = computeNextAction({ ...base, nowMinutes: 17 * 60, treinouHoje: false })
    expect(action.to).toBe('/workout')
    expect(action.title).toBe('Janela do treino')
  })

  it('16h–19h com treino feito sugere o pós-treino', () => {
    expect(computeNextAction({ ...base, nowMinutes: 17 * 60 }).title).toBe('Pós-treino')
  })

  it('depois das 19h é o fechamento do dia, mesmo sem treino', () => {
    const action = computeNextAction({ ...base, nowMinutes: 20 * 60, treinouHoje: false })
    expect(action.title).toBe('Fechamento do dia')
    expect(action.to).toBe('/nutricao')
  })

  it('refeição na janela vence a faixa da noite', () => {
    const action = computeNextAction({ ...base, nowMinutes: 20 * 60, currentMeal: { nome: 'Jantar', minutes: 20 * 60 } })
    expect(action.title).toBe('Hora do Jantar')
  })
})

describe('computeNextAction — nome do treino', () => {
  it('usa o nome do próximo treino da rotação quando disponível', () => {
    const action = computeNextAction({ ...base, treinouHoje: false, proximoTreino: 'Treino C' })
    expect(action.title).toBe('Treino de hoje: Treino C')
  })
})

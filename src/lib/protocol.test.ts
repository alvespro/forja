import { describe, expect, it } from 'vitest'

import { computeWeekNumber, isExamOverdue } from './protocol'

describe('computeWeekNumber', () => {
  it('retorna 0 sem data de início', () => {
    expect(computeWeekNumber(null, '2026-07-01')).toBe(0)
    expect(computeWeekNumber(undefined, '2026-07-01')).toBe(0)
  })

  it('dia do início é semana 1', () => {
    expect(computeWeekNumber('2026-07-01', '2026-07-01')).toBe(1)
  })

  it('sexto dia ainda é semana 1; sétimo vira semana 2', () => {
    expect(computeWeekNumber('2026-07-01', '2026-07-07')).toBe(1)
    expect(computeWeekNumber('2026-07-01', '2026-07-08')).toBe(2)
  })

  it('12 semanas completas', () => {
    expect(computeWeekNumber('2026-01-01', '2026-03-26')).toBe(13)
  })

  it('antes do início retorna 0', () => {
    expect(computeWeekNumber('2026-07-10', '2026-07-01')).toBe(0)
  })
})

describe('isExamOverdue', () => {
  const today = '2026-07-04'
  const base = { status: 'pendente', data_prevista: null, semana_alvo: null }

  it('realizado nunca está atrasado', () => {
    expect(isExamOverdue({ ...base, status: 'realizado', data_prevista: '2026-01-01' }, '2026-01-01', today)).toBe(false)
  })

  it('com data prevista: atrasado só depois da data', () => {
    expect(isExamOverdue({ ...base, data_prevista: '2026-07-03' }, null, today)).toBe(true)
    expect(isExamOverdue({ ...base, data_prevista: '2026-07-04' }, null, today)).toBe(false)
    expect(isExamOverdue({ ...base, data_prevista: '2026-07-10' }, null, today)).toBe(false)
  })

  it('sem data prevista: atrasado quando a semana atual passa da semana-alvo', () => {
    // início 2026-06-01 → 2026-07-04 cai na semana 5
    expect(isExamOverdue({ ...base, semana_alvo: 4 }, '2026-06-01', today)).toBe(true)
    expect(isExamOverdue({ ...base, semana_alvo: 5 }, '2026-06-01', today)).toBe(false)
    expect(isExamOverdue({ ...base, semana_alvo: 8 }, '2026-06-01', today)).toBe(false)
  })

  it('semana-alvo sem data de início do protocolo não acusa atraso', () => {
    expect(isExamOverdue({ ...base, semana_alvo: 1 }, null, today)).toBe(false)
    expect(isExamOverdue({ ...base, semana_alvo: 1 }, undefined, today)).toBe(false)
  })

  it('sem data prevista e sem semana-alvo não acusa atraso', () => {
    expect(isExamOverdue(base, '2026-06-01', today)).toBe(false)
  })

  it('exame já marcado como atrasado continua acusando', () => {
    expect(isExamOverdue({ ...base, status: 'atrasado', semana_alvo: 2 }, '2026-06-01', today)).toBe(true)
  })
})

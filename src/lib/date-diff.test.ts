import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { cycleDaysElapsed, cycleDaysRemaining, projectWeeksToGoal } from './body-goals'
import { diffInDays } from './date'
import type { BodyMetric } from '@/types/database'

// Regressão: diffInDays(a, b) é a − b, mas a doc dizia "b − a". Quatro chamadores
// confiaram na doc e ficaram invertidos — o contador de fim de ciclo mostrava
// sempre 0, o progresso do ciclo ficava em 0% e a projeção nunca era calculada.

describe('diffInDays', () => {
  it('é a − b (dias de b até a)', () => {
    expect(diffInDays('2026-09-23', '2026-09-14')).toBe(9)
    expect(diffInDays('2026-09-14', '2026-09-23')).toBe(-9)
  })

  it('mesmo dia é zero', () => {
    expect(diffInDays('2026-09-14', '2026-09-14')).toBe(0)
  })
})

describe('ciclo (data fixa: 14/09/2026, meio-dia em São Paulo)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-14T15:00:00Z'))
  })
  afterEach(() => vi.useRealTimers())

  it('cycleDaysRemaining conta os dias até o fim', () => {
    expect(cycleDaysRemaining('2026-09-23')).toBe(9)
  })

  it('cycleDaysRemaining não fica negativo depois do fim', () => {
    expect(cycleDaysRemaining('2026-09-01')).toBe(0)
  })

  it('cycleDaysElapsed conta os dias desde o início, limitado ao prazo', () => {
    // Ciclo 01: 25/06 → 23/09 (90 dias)
    expect(cycleDaysElapsed('2026-06-25', 90)).toBe(81)
    expect(cycleDaysElapsed('2026-01-01', 90)).toBe(90)
  })

  it('cycleDaysElapsed é zero antes do início', () => {
    expect(cycleDaysElapsed('2026-10-01', 90)).toBe(0)
  })
})

describe('projectWeeksToGoal', () => {
  const metric = (medido_em: string, peso_kg: number) => ({ medido_em, peso_kg }) as unknown as BodyMetric

  it('projeta pela variação semanal observada', () => {
    // -1 kg em 2 semanas = -0,5 kg/semana; faltam 5 kg → 10 semanas
    const metrics = [metric('2026-06-29', 86), metric('2026-07-13', 85)]
    expect(projectWeeksToGoal(metrics, 'peso_kg', 80)).toBe(10)
  })

  it('null quando a variação vai na direção contrária da meta', () => {
    const metrics = [metric('2026-06-29', 85), metric('2026-07-13', 86)]
    expect(projectWeeksToGoal(metrics, 'peso_kg', 80)).toBeNull()
  })

  it('null com menos de duas medições', () => {
    expect(projectWeeksToGoal([metric('2026-06-29', 85)], 'peso_kg', 80)).toBeNull()
  })
})

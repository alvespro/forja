import { describe, expect, it } from 'vitest'

import { computeWeekNumber } from './protocol'

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

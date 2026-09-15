import { describe, expect, it } from 'vitest'

import { diasDesde, statusRecuperacao } from './today-grid'

describe('grade do Hoje', () => {
  it('dias desde uma data (virada de horário de verão não quebra)', () => {
    expect(diasDesde('2026-09-15', '2026-09-15')).toBe(0)
    expect(diasDesde('2026-09-07', '2026-09-15')).toBe(8)
    expect(diasDesde('2026-09-16', '2026-09-15')).toBe(0)
  })

  it('faixas de recuperação iguais às do classifyRecovery', () => {
    expect(statusRecuperacao(80)).toMatchObject({ label: 'Treino pesado', cor: 'ok' })
    expect(statusRecuperacao(79).label).toBe('Moderado')
    expect(statusRecuperacao(40).label).toBe('Treino leve')
    expect(statusRecuperacao(39)).toMatchObject({ label: 'Descanso ativo', cor: 'alerta' })
  })
})

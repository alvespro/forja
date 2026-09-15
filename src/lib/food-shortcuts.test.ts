import { describe, expect, it } from 'vitest'

import { atalhosDeAlimentos } from './food-shortcuts'

const r = (food_id: string, created_at: string) => ({ food_id, created_at, data: created_at.slice(0, 10) })

describe('atalhosDeAlimentos', () => {
  it('recentes: últimos alimentos distintos, do mais novo para o mais antigo', () => {
    const { recentes } = atalhosDeAlimentos(
      [r('arroz', '2026-09-14T12:00:00Z'), r('ovo', '2026-09-14T08:00:00Z'), r('arroz', '2026-09-13T12:00:00Z'), r('whey', '2026-09-14T19:00:00Z')],
      '2026-09-15',
    )
    expect(recentes).toEqual(['whey', 'arroz', 'ovo'])
  })

  it('frequentes: mais registrados nos últimos 30 dias, empate para o mais recente', () => {
    const { frequentes } = atalhosDeAlimentos(
      [
        r('ovo', '2026-09-10T08:00:00Z'),
        r('ovo', '2026-09-11T08:00:00Z'),
        r('arroz', '2026-09-12T12:00:00Z'),
        r('banana', '2026-09-14T10:00:00Z'),
        r('arroz', '2026-09-14T12:00:00Z'),
        r('feijao', '2026-07-01T12:00:00Z'), // fora da janela
        r('feijao', '2026-07-02T12:00:00Z'),
        r('feijao', '2026-07-03T12:00:00Z'),
      ],
      '2026-09-15',
    )
    expect(frequentes).toEqual(['arroz', 'ovo', 'banana'])
  })

  it('respeita o limite', () => {
    const muitos = Array.from({ length: 8 }, (_, i) => r(`f${i}`, `2026-09-1${i}T10:00:00Z`))
    const { recentes, frequentes } = atalhosDeAlimentos(muitos, '2026-09-20', 5)
    expect(recentes).toHaveLength(5)
    expect(frequentes).toHaveLength(5)
  })
})

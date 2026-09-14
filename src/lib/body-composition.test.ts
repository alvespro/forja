import { describe, expect, it } from 'vitest'

import { buildCompositionCards, progressoAteMeta, statusPorMeta } from './body-composition'
import type { BodyMetric } from '@/types/database'

const m = (medido_em: string, campos: Record<string, number | string | null>) =>
  ({ medido_em, ...campos }) as unknown as BodyMetric

describe('statusPorMeta', () => {
  it('menor é melhor: abaixo da meta é ok', () => {
    expect(statusPorMeta(13, 14, 'menor')).toBe('ok')
    expect(statusPorMeta(16, 14, 'menor')).toBe('atencao')
  })

  it('maior é melhor: acima da meta é ok', () => {
    expect(statusPorMeta(61, 60, 'maior')).toBe('ok')
    expect(statusPorMeta(57.3, 60, 'maior')).toBe('atencao')
  })

  it('longe da meta (>25%) vira alerta', () => {
    expect(statusPorMeta(22.1, 14, 'menor')).toBe('alerta')
  })
})

describe('progressoAteMeta', () => {
  it('mede a fração percorrida', () => {
    expect(progressoAteMeta(90, 85, 80)).toBe(50)
  })

  it('afastar-se da meta conta como zero', () => {
    expect(progressoAteMeta(82, 84.4, 75)).toBe(0)
  })

  it('satura em 100 ao passar da meta', () => {
    expect(progressoAteMeta(90, 78, 80)).toBe(100)
  })
})

describe('buildCompositionCards', () => {
  const historico = [
    m('2026-06-27', { peso_kg: '82', gordura_pct: '20' }),
    m('2026-06-29', { peso_kg: '84.4', gordura_pct: '22.1', musculo_pct: '57.3', agua_pct: '56.4', imc: '25.6', gordura_visceral: '7', tmb_kcal: 1647 }),
  ]
  const metas = { peso_meta_kg: 75, gordura_meta_pct: 14, musculo_pct_meta: 60, gordura_visceral_meta: 5, agua_meta_pct: null, imc_meta: null }

  it('usa só as métricas com valor na medição mais recente, na ordem definida', () => {
    const cards = buildCompositionCards(historico, metas)
    expect(cards.map((c) => c.key)).toEqual(['peso_kg', 'gordura_pct', 'musculo_pct', 'agua_pct', 'gordura_visceral', 'imc', 'tmb_kcal'])
  })

  it('converte os numéricos que o Supabase devolve como string', () => {
    const peso = buildCompositionCards(historico, metas).find((c) => c.key === 'peso_kg')
    expect(peso?.valor).toBe(84.4)
    expect(peso?.tendencia).toEqual([82, 84.4])
  })

  it('sem meta, cai na faixa de referência (IMC 25,6 fora de 18,5–24,9)', () => {
    const imc = buildCompositionCards(historico, metas).find((c) => c.key === 'imc')
    expect(imc?.status).toBe('atencao')
    expect(imc?.meta).toBeNull()
  })

  it('métrica sem regra fica neutra', () => {
    expect(buildCompositionCards(historico, metas).find((c) => c.key === 'tmb_kcal')?.status).toBe('neutro')
  })

  it('histórico vazio não quebra', () => {
    expect(buildCompositionCards([], metas)).toEqual([])
  })
})

describe('buildCompositionCards — alerta x faixa de referência', () => {
  it('longe da meta mas dentro da faixa saudável fica em atenção, não alerta', () => {
    const cards = buildCompositionCards([m('2026-06-29', { gordura_visceral: '7' })], { gordura_visceral_meta: 5 })
    expect(cards[0].status).toBe('atencao')
  })

  it('longe da meta e fora da faixa continua alerta', () => {
    const cards = buildCompositionCards([m('2026-06-29', { gordura_visceral: '13' })], { gordura_visceral_meta: 5 })
    expect(cards[0].status).toBe('alerta')
  })
})

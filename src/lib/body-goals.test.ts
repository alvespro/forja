import { describe, expect, it } from 'vitest'

import { metricsForCycle } from './body-goals'

const m = (medido_em: string) => ({ medido_em })

describe('metricsForCycle', () => {
  it('sem data de início devolve todas ordenadas', () => {
    const janela = metricsForCycle([m('2026-07-01'), m('2026-06-01')], null)
    expect(janela.map((x) => x.medido_em)).toEqual(['2026-06-01', '2026-07-01'])
  })

  it('baseline é a última medição anterior ao início do ciclo', () => {
    const janela = metricsForCycle(
      [m('2026-05-01'), m('2026-06-20'), m('2026-07-02'), m('2026-07-10')],
      '2026-07-01',
    )
    expect(janela.map((x) => x.medido_em)).toEqual(['2026-06-20', '2026-07-02', '2026-07-10'])
  })

  it('sem medição pré-ciclo, começa na primeira do ciclo', () => {
    const janela = metricsForCycle([m('2026-07-02'), m('2026-07-10')], '2026-07-01')
    expect(janela.map((x) => x.medido_em)).toEqual(['2026-07-02', '2026-07-10'])
  })

  it('medição no dia do início conta como do ciclo, não como baseline', () => {
    const janela = metricsForCycle([m('2026-06-01'), m('2026-07-01')], '2026-07-01')
    expect(janela.map((x) => x.medido_em)).toEqual(['2026-06-01', '2026-07-01'])
  })

  it('ciclo ainda sem medições devolve só o baseline', () => {
    const janela = metricsForCycle([m('2026-06-01'), m('2026-06-15')], '2026-07-01')
    expect(janela.map((x) => x.medido_em)).toEqual(['2026-06-15'])
  })
})

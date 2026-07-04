import { describe, expect, it } from 'vitest'

import { dueForReview, type Reviewable } from './spaced-review'

function item(titulo: string, concluidoEm: string | null, aprendizado = 'algo'): Reviewable {
  return {
    titulo,
    data_conclusao: concluidoEm,
    aprendizado_1: aprendizado || null,
    aprendizado_2: null,
    aprendizado_3: null,
    acao_1: null,
  }
}

describe('dueForReview', () => {
  const today = '2026-07-04'

  it('marco de 7 dias com janela de 3', () => {
    expect(dueForReview([item('a', '2026-06-27')], today)).toHaveLength(1) // 7 dias
    expect(dueForReview([item('b', '2026-06-25')], today)).toHaveLength(1) // 9 dias (última da janela)
    expect(dueForReview([item('c', '2026-06-24')], today)).toHaveLength(0) // 10 dias — janela fechou
    expect(dueForReview([item('d', '2026-06-28')], today)).toHaveLength(0) // 6 dias — ainda não
  })

  it('marcos de 30 e 90 dias', () => {
    expect(dueForReview([item('a', '2026-06-04')], today)[0]?.marco).toBe(30)
    expect(dueForReview([item('b', '2026-04-05')], today)[0]?.marco).toBe(90)
  })

  it('sem data de conclusão ou sem aprendizados, não entra', () => {
    expect(dueForReview([item('a', null)], today)).toHaveLength(0)
    expect(dueForReview([item('b', '2026-06-27', '')], today)).toHaveLength(0)
  })

  it('ordena por marco (7 antes de 30)', () => {
    const due = dueForReview([item('trinta', '2026-06-04'), item('sete', '2026-06-27')], today)
    expect(due.map((d) => d.item.titulo)).toEqual(['sete', 'trinta'])
  })
})

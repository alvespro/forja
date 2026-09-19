import { describe, expect, it } from 'vitest'

import { agendarRevisao, estaDevido, flashcardsDaResposta, sugestoesDaResposta } from './flashcards'

const HOJE = '2026-09-19'
const card = (nivel: number) => ({ nivel_revisao: nivel, acertos: 2, erros: 1 })

describe('agendarRevisao', () => {
  it('errei: amanhã, nível cai 1 e nunca abaixo de 0', () => {
    expect(agendarRevisao(card(3), 'errei', HOJE)).toMatchObject({ proxima_revisao: '2026-09-20', nivel_revisao: 2, erros: 2, acertos: 2 })
    expect(agendarRevisao(card(0), 'errei', HOJE).nivel_revisao).toBe(0)
  })

  it('difícil: +3 dias, nível mantido', () => {
    expect(agendarRevisao(card(2), 'dificil', HOJE)).toMatchObject({ proxima_revisao: '2026-09-22', nivel_revisao: 2, acertos: 3 })
  })

  it('acertei: +2^nível dias e sobe o nível', () => {
    expect(agendarRevisao(card(0), 'acertei', HOJE)).toMatchObject({ proxima_revisao: '2026-09-20', nivel_revisao: 1 })
    expect(agendarRevisao(card(3), 'acertei', HOJE)).toMatchObject({ proxima_revisao: '2026-09-27', nivel_revisao: 4 })
  })

  it('grava a data da revisão', () => {
    expect(agendarRevisao(card(1), 'acertei', HOJE).ultima_revisao).toBe(HOJE)
  })
})

describe('estaDevido', () => {
  it('hoje, atrasado ou sem data', () => {
    expect(estaDevido('2026-09-19', HOJE)).toBe(true)
    expect(estaDevido('2026-09-01', HOJE)).toBe(true)
    expect(estaDevido(null, HOJE)).toBe(true)
    expect(estaDevido('2026-09-20', HOJE)).toBe(false)
  })
})

describe('respostas da IA', () => {
  it('flashcards com cerca ```json e texto em volta', () => {
    const texto = 'Aqui vão:\n```json\n{"flashcards":[{"frente":"O que é SBPE?","verso":"Sistema Brasileiro de Poupança e Empréstimo"},{"frente":"","verso":"x"}]}\n```'
    expect(flashcardsDaResposta(texto)).toEqual([{ frente: 'O que é SBPE?', verso: 'Sistema Brasileiro de Poupança e Empréstimo', fonte: undefined }])
  })

  it('JSON inválido vira lista vazia', () => {
    expect(flashcardsDaResposta('não sei')).toEqual([])
    expect(sugestoesDaResposta('{quebrado')).toEqual([])
  })

  it('sugestões de livros', () => {
    const texto = '{"sugestoes":[{"titulo":"Essencialismo","autor":"Greg McKeown","motivo":"foco","area":"Gestão"}]}'
    expect(sugestoesDaResposta(texto)).toEqual([{ titulo: 'Essencialismo', autor: 'Greg McKeown', motivo: 'foco', area: 'Gestão' }])
  })
})

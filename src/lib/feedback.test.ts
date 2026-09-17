import { describe, expect, it } from 'vitest'

import { mensagemDeErro } from './feedback'

describe('mensagemDeErro', () => {
  it('traduz os códigos do Postgres mais comuns', () => {
    expect(mensagemDeErro({ code: '23503' }, 'excluir')).toBe('Não foi possível excluir: existem registros ligados a este item.')
    expect(mensagemDeErro({ code: '23514' })).toBe('Não foi possível salvar: algum valor está fora do permitido.')
  })

  it('usa a mensagem original quando não reconhece o código', () => {
    expect(mensagemDeErro(new Error('timeout'))).toBe('Não foi possível salvar. timeout')
    expect(mensagemDeErro(null, 'arquivar')).toBe('Não foi possível arquivar. Tente de novo.')
  })
})

import { describe, expect, it } from 'vitest'

import {
  alertaAcucarNoJantar,
  calcularMacros,
  gramasDaPorcao,
  isUltraprocessado,
  nutriscoreClass,
  nutriscoreRuim,
  type ProdutoOFF,
} from './off'

const produto = (over: Partial<ProdutoOFF> = {}): ProdutoOFF => ({
  barcode: '789',
  nome: 'Teste',
  marca: null,
  nutriscore: null,
  nova_group: null,
  imagem_url: null,
  por_100g: {
    calorias: 165,
    proteina: 31,
    carbo: 0,
    gordura: 4,
    fibra: 0,
    sodio: 0.4,
    acucar: 0,
    gordura_saturada: 1,
  },
  ...over,
})

describe('calcularMacros', () => {
  it('faz regra de três sobre os valores por 100g', () => {
    const m = calcularMacros(produto().por_100g, 150)
    expect(m.calorias).toBe(248) // 165 * 1.5 = 247,5 → 248
    expect(m.proteina).toBe(46.5)
    expect(m.gordura).toBe(6)
    expect(m.carbo).toBe(0)
  })

  it('trata valores nulos como zero', () => {
    const p = produto({ por_100g: { ...produto().por_100g, proteina: null, calorias: null } })
    const m = calcularMacros(p.por_100g, 200)
    expect(m.calorias).toBe(0)
    expect(m.proteina).toBe(0)
  })
})

describe('gramasDaPorcao', () => {
  it('converte unidades caseiras em gramas', () => {
    expect(gramasDaPorcao(150, 'g')).toBe(150)
    expect(gramasDaPorcao(2, 'colher')).toBe(30)
    expect(gramasDaPorcao(1, 'xicara')).toBe(240)
    expect(gramasDaPorcao(3, 'unidade')).toBe(300)
  })
})

describe('alertaAcucarNoJantar', () => {
  it('dispara com açúcar acima de 10g/100g no slot 6', () => {
    const doce = produto({ por_100g: { ...produto().por_100g, acucar: 25 } })
    expect(alertaAcucarNoJantar(doce, 6)).toBe(true)
  })

  it('não dispara fora do jantar', () => {
    const doce = produto({ por_100g: { ...produto().por_100g, acucar: 25 } })
    expect(alertaAcucarNoJantar(doce, 3)).toBe(false)
  })

  it('não dispara com açúcar baixo', () => {
    expect(alertaAcucarNoJantar(produto(), 6)).toBe(false)
  })
})

describe('badges', () => {
  it('identifica ultraprocessado e nutriscore ruim', () => {
    expect(isUltraprocessado(produto({ nova_group: 4 }))).toBe(true)
    expect(isUltraprocessado(produto({ nova_group: 1 }))).toBe(false)
    expect(nutriscoreRuim(produto({ nutriscore: 'd' }))).toBe(true)
    expect(nutriscoreRuim(produto({ nutriscore: 'E' }))).toBe(true)
    expect(nutriscoreRuim(produto({ nutriscore: 'a' }))).toBe(false)
  })

  it('nutriscore sem dado cai no cinza', () => {
    expect(nutriscoreClass(null)).toContain('aco-claro')
    expect(nutriscoreClass('a')).not.toContain('aco-claro')
  })
})

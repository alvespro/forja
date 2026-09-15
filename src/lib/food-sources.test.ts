import { describe, expect, it } from 'vitest'

import {
  estimativaPlausivel,
  fromCache,
  fromOff,
  fromUsda,
  macrosPlausiveis,
  nomeCasaComConsulta,
  normalizarConsulta,
} from './food-sources'

describe('fontes de alimentos', () => {
  it('normaliza o termo da IA (acento, caixa, pontuação)', () => {
    expect(normalizarConsulta('  Macarrão  de ARROZ! ')).toBe('macarrao de arroz')
  })

  it('linha TACO do cache ganha id estável e badge', () => {
    const p = fromCache({ fonte: 'taco', taco_id: '3', nome: 'Arroz, tipo 1, cozido', confianca: 'alta', calorias_100g: '128' })
    expect(p).toMatchObject({ id: 'taco:3', barcode: null, badge: '🇧🇷 TACO/UNICAMP', confianca: 'alta' })
    expect(p.por_100g.calorias).toBe(128)
  })

  it('OFF do search-a-licious: marcas em lista e Nutri-Score "unknown" vira null', () => {
    const p = fromOff({
      code: '7896800777715',
      product_name_pt: 'Arroz Integral',
      brands: ['Arroz Brilhante'],
      nutriscore_grade: 'unknown',
      nutriments: { 'energy-kcal_100g': 350, proteins_100g: 7.6 },
    })
    expect(p).toMatchObject({ id: '7896800777715', marca: 'Arroz Brilhante', nutriscore: null, fonte: 'off', confianca: 'media' })
  })

  it('USDA: usa Atwater quando falta a energia 1008 e converte sódio para g', () => {
    const p = fromUsda({
      fdcId: 168917,
      description: 'Quinoa, cooked',
      foodCategory: 'Cereal Grains and Pasta',
      foodNutrients: [
        { nutrientId: 2047, value: 120.4 },
        { nutrientId: 1003, value: 4.4 },
        { nutrientId: 1005, value: 21.3 },
        { nutrientId: 1004, value: 1.92 },
        { nutrientId: 1093, value: 7 },
      ],
    })
    expect(p).toMatchObject({ id: 'usda:168917', badge: '🔬 USDA', categoria: 'Cereal Grains and Pasta' })
    expect(p?.por_100g).toMatchObject({ calorias: 120, proteina: 4.4, gordura: 1.9, sodio: 0.007 })
  })

  it('OFF só entra se todas as palavras relevantes do termo estiverem no nome/marca', () => {
    expect(nomeCasaComConsulta('Frango Assado', null, 'xiriqueixo buriti assado')).toBe(false)
    expect(nomeCasaComConsulta('Whitey protein', null, 'whey')).toBe(false)
    expect(nomeCasaComConsulta('100% cfm whey isolat', null, 'whey')).toBe(true)
    expect(nomeCasaComConsulta('Macarrão de Arroz', 'Urbano', 'macarrao de arroz')).toBe(true)
    expect(nomeCasaComConsulta('Goma para tapioca', null, 'tapio')).toBe(true) // prefixo enquanto digita
    expect(nomeCasaComConsulta('Whey Dux', 'Dux', 'whey dux')).toBe(true)
  })

  it('rótulo impossível é descartado', () => {
    const p = { calorias: 442, proteina: 104, carbo: 2, gordura: 1, fibra: null, sodio: null, acucar: null, gordura_saturada: null }
    expect(macrosPlausiveis(p)).toBe(false)
    expect(macrosPlausiveis({ ...p, proteina: 80 })).toBe(true)
    expect(macrosPlausiveis({ ...p, calorias: null })).toBe(false)
  })

  it('estimativa da IA precisa ser fisicamente coerente', () => {
    const base = { reconhecido: true, nome: 'Macarrão de arroz cozido', calorias_100g: 109, proteina_100g: 1.8, carbo_100g: 24, gordura_100g: 0.2, fibra_100g: 1 }
    expect(estimativaPlausivel(base)).toBe(true)
    expect(estimativaPlausivel({ ...base, reconhecido: false })).toBe(false)
    expect(estimativaPlausivel({ ...base, calorias_100g: 600 })).toBe(false) // Atwater não fecha
    expect(estimativaPlausivel({ ...base, proteina_100g: 80, carbo_100g: 40 })).toBe(false) // > 100 g de macro
  })
})

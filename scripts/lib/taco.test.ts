import { describe, expect, it } from 'vitest'

import { parseCsv, tacoRows, tacoUpsertSql, valorTaco } from './taco.ts'

const CSV = [
  'numero_alimento,descricao,umidade_pct,energia_kcal,energia_kj,proteina_g,lipideos_g,colesterol_mg,carboidrato_g,fibra_g,cinzas_g,calcio_mg,magnesio_mg,manganes_mg,fosforo_mg,ferro_mg,sodio_mg,potassio_mg,cobre_mg,zinco_mg,retinol_mcg,RE_mcg,RAE_mcg,tiamina_mg,riboflavina_mg,piridoxina_mg,niacina_mg,vitamina_c_mg,base,preparo,qualificadores,categoria',
  '3,"Arroz, tipo 1, cozido",69.1,128.25848566666664,536.6,2.5208166666666667,0.227,,28.059849999999994,1.561,0.08,3.5,2.25,0.3,17.9,0.08,1.2006666666666665,14.7,0.015,0.49,,,,1e-05,1e-05,1e-05,1e-05,,Arroz,cozido,tipo 1,Cereais e derivados',
  '260,"Azeite, de oliva, extra virgem",,884.0,3698.656,,100.0,,,,,,,,,,,,,,,,,,,,,,Azeite,,"de oliva, extra virgem",Gorduras e óleos',
].join('\n')

describe('TACO', () => {
  it('CSV respeita vírgulas dentro de aspas', () => {
    const linhas = parseCsv('a,"b, c",d\n1,"x ""y""",3\n')
    expect(linhas).toEqual([
      ['a', 'b, c', 'd'],
      ['1', 'x "y"', '3'],
    ])
  })

  it('traço vira 0, vazio vira null', () => {
    expect(valorTaco('1e-05')).toBe(0)
    expect(valorTaco('')).toBeNull()
    expect(valorTaco('2.5208')).toBe(2.52)
  })

  it('mapeia colunas, arredonda e converte sódio de mg para g', () => {
    const [arroz, azeite] = tacoRows(CSV)
    expect(arroz).toMatchObject({
      taco_id: '3',
      nome: 'Arroz, tipo 1, cozido',
      categoria: 'Cereais e derivados',
      calorias_100g: 128,
      proteina_100g: 2.5,
      carbo_100g: 28.1,
      gordura_100g: 0.2,
      fibra_100g: 1.6,
      sodio_100g: 0.001,
      fonte: 'taco',
      confianca: 'alta',
    })
    expect(azeite).toMatchObject({ calorias_100g: 884, proteina_100g: null, gordura_100g: 100, carbo_100g: null })
  })

  it('SQL escapa aspas simples e é idempotente por taco_id', () => {
    const sql = tacoUpsertSql([{ ...tacoRows(CSV)[0], nome: "Pão d'água" }])
    expect(sql).toContain("'Pão d''água'")
    expect(sql).toContain('on conflict (taco_id) where taco_id is not null do update')
  })
})

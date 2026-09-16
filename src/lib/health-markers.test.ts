import { describe, expect, it } from 'vitest'

import {
  alertasDoPlacar,
  evolucaoDesdeBase,
  GRUPOS,
  MARCADORES,
  montarPlacar,
  statusDoMarcador,
  variacaoDoMarcador,
} from './health-markers'

type Leitura = { chave: string; valor: number; measured_at: string }

const JUL = '2026-07-15'
const JUN = '2026-06-25'

/** Os 38 marcadores de 15/07/2026 e os 5 de 25/06/2026, como estão no banco. */
const LEITURAS: Leitura[] = [
  ...Object.entries({ colesterol_total: 197, corrida: 0, glicemia: 103, ldl: 119.4, lpa: 44 }).map(([chave, valor]) => ({ chave, valor, measured_at: JUN })),
  ...Object.entries({
    acido_urico: 4.9, apo_a1: 137, apo_b: 84, colesterol_total: 181, creatinina: 1.25, egfr: 78, eritrocitos: 4.86,
    estradiol: 5, fsh: 2.8, glicemia: 91, hdl: 50, hematocrito: 45.5, hemoglobina: 15.7, homocisteina: 9.6, ldl: 107,
    leucocitos: 6610, lh: 3.8, linfocitos_pct: 42.1, nao_hdl: 132, neutrofilos_pct: 46, pcr_ultrassensivel: 0.06,
    plaquetas: 287000, prolactina: 8.4, psa_livre: 0.39, psa_total: 0.59, shbg: 26.91, t4_livre: 1.51,
    testosterona_biodisponivel: 232.13, testosterona_livre: 9.91, testosterona_total: 431, tgo: 25, tgp: 28,
    triglicerides: 136, tsh: 2.38, vitamina_b12: 600, vitamina_c: 0.5, vitamina_d: 42, vldl: 25,
  }).map(([chave, valor]) => ({ chave, valor, measured_at: JUL })),
]

describe('catálogo', () => {
  it('todos os 38 marcadores de julho têm grupo no placar', () => {
    const chavesJul = LEITURAS.filter((l) => l.measured_at === JUL).map((l) => l.chave)
    expect(chavesJul).toHaveLength(38)
    for (const chave of chavesJul) expect(MARCADORES[chave], chave).toBeDefined()
  })

  it('grupos na ordem pedida', () => {
    expect(GRUPOS.map((g) => g.label)).toEqual([
      'Lipídios', 'Glicemia', 'Hormônios', 'Função Renal', 'Função Hepática', 'Hemograma', 'Vitaminas', 'Inflamação', 'PSA',
    ])
  })
})

describe('statusDoMarcador', () => {
  it('normal, atenção e crítico pela faixa de referência', () => {
    expect(statusDoMarcador('glicemia', 91)).toBe('normal')
    expect(statusDoMarcador('glicemia', 103)).toBe('atencao')
    expect(statusDoMarcador('glicemia', 130)).toBe('critico')
    expect(statusDoMarcador('egfr', 78)).toBe('atencao')
    expect(statusDoMarcador('egfr', 45)).toBe('critico')
    expect(statusDoMarcador('estradiol', 5)).toBe('atencao')
    expect(statusDoMarcador('vitamina_c', 0.5)).toBe('atencao')
    expect(statusDoMarcador('vitamina_c', 1.1)).toBe('normal')
  })

  it('marcador sem faixa confiável fica sem referência', () => {
    expect(statusDoMarcador('testosterona_livre', 9.91)).toBe('sem_referencia')
    expect(statusDoMarcador('chave_desconhecida', 1)).toBe('sem_referencia')
  })
})

describe('variacaoDoMarcador', () => {
  it('compara com a medição anterior e diz se melhorou', () => {
    const glicemia = LEITURAS.filter((l) => l.chave === 'glicemia')
    expect(variacaoDoMarcador('glicemia', glicemia)).toEqual({ delta: -12, anterior: 103, dataAnterior: JUN, sentido: 'melhorou' })
  })

  it('maior_melhor: subir é melhorar; sem anterior não há variação', () => {
    const hdl = [
      { chave: 'hdl', valor: 45, measured_at: JUN },
      { chave: 'hdl', valor: 50, measured_at: JUL },
    ]
    expect(variacaoDoMarcador('hdl', hdl)?.sentido).toBe('melhorou')
    expect(variacaoDoMarcador('egfr', [{ chave: 'egfr', valor: 78, measured_at: JUL }])).toBeNull()
  })

  it('faixa: aproximar do meio é melhorar, igual é estável', () => {
    const tsh = [
      { chave: 'tsh', valor: 4.3, measured_at: JUN },
      { chave: 'tsh', valor: 2.4, measured_at: JUL },
    ]
    expect(variacaoDoMarcador('tsh', tsh)?.sentido).toBe('melhorou')
    expect(variacaoDoMarcador('tsh', [tsh[1], { ...tsh[1], measured_at: '2026-08-01' }])?.sentido).toBe('estavel')
  })
})

describe('alertasDoPlacar', () => {
  it('gera os 3 alertas de julho/2026 com o texto combinado', () => {
    const alertas = alertasDoPlacar(montarPlacar(LEITURAS))
    expect(alertas.map((a) => a.chave)).toEqual(['egfr', 'estradiol', 'vitamina_c'])
    expect(alertas[0].texto).toBe(
      'Filtração renal levemente reduzida — comum em pessoas com boa massa muscular. Beber 3,5L de água/dia. Repetir em 90 dias.',
    )
    expect(alertas[1].texto).toBe('Estradiol muito baixo — confirmar com médico antes de iniciar protocolo.')
    expect(alertas[2].texto).toBe('Limite inferior da referência — aumentar frutas cítricas ou suplementar 500mg/dia.')
  })

  it('sem gatilho, sem alerta', () => {
    const ok = montarPlacar([
      { chave: 'egfr', valor: 95, measured_at: JUL },
      { chave: 'estradiol', valor: 25, measured_at: JUL },
      { chave: 'vitamina_c', valor: 1.2, measured_at: JUL },
    ])
    expect(alertasDoPlacar(ok)).toEqual([])
  })
})

describe('evolucaoDesdeBase', () => {
  it('glicemia, colesterol e LDL de junho para julho, todos melhorando', () => {
    const evo = evolucaoDesdeBase(montarPlacar(LEITURAS))
    expect(evo?.dataBase).toBe(JUN)
    expect(evo?.itens.map((i) => [i.chave, Math.round(i.antes), i.depois, Math.round(i.delta), i.sentido])).toEqual([
      ['glicemia', 103, 91, -12, 'melhorou'],
      ['colesterol_total', 197, 181, -16, 'melhorou'],
      ['ldl', 119, 107, -12, 'melhorou'],
    ])
    expect(evo?.todosMelhoraram).toBe(true)
  })

  it('com uma medição só não há evolução', () => {
    expect(evolucaoDesdeBase(montarPlacar([{ chave: 'glicemia', valor: 91, measured_at: JUL }]))).toBeNull()
  })
})

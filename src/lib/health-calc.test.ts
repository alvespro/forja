import { describe, expect, it } from 'vitest'

import {
  cholesterolRatios,
  classifyHomaIr,
  classifyRecovery,
  concorda,
  findNumber,
  homaIr,
  karvonenZones,
  recompForecast,
  recoveryScore,
  simpleZones,
} from './health-calc'

describe('HOMA-IR', () => {
  it('glicemia 90 mg/dL × insulina 8 → 1,78', () => {
    expect(homaIr(90, 8)).toBe(1.78)
  })

  it('classifica nas faixas do FORJA (limites inclusivos para cima)', () => {
    expect(classifyHomaIr(1.49).risco).toBe('baixo')
    expect(classifyHomaIr(1.5).risco).toBe('intermediario')
    expect(classifyHomaIr(2.5).risco).toBe('alto')
    expect(classifyHomaIr(5).risco).toBe('alto')
    expect(classifyHomaIr(5.01).risco).toBe('critico')
  })
})

describe('cholesterolRatios', () => {
  it('perfil ideal → risco baixo', () => {
    const r = cholesterolRatios(180, 55, 100, 90)
    expect(r.tc_hdl).toMatchObject({ valor: 3.3, status: 'ok' })
    expect(r.ldl_hdl).toMatchObject({ valor: 1.8, status: 'ok' })
    expect(r.tg_hdl).toMatchObject({ valor: 1.6, status: 'ok' })
    expect(r.risco).toBe('baixo')
  })

  it('sem triglicerídeos o TG/HDL fica null', () => {
    expect(cholesterolRatios(200, 40, 130).tg_hdl).toBeNull()
  })

  it('um ratio acima da faixa de atenção → alto; dois → crítico', () => {
    expect(cholesterolRatios(230, 40, 130).risco).toBe('alto') // TC/HDL 5,75
    expect(cholesterolRatios(240, 38, 160).risco).toBe('critico') // TC/HDL 6,3 e LDL/HDL 4,2
  })
})

describe('zonas de FC', () => {
  it('Karvonen 32 anos, repouso 62: reserva 126 bpm', () => {
    const z = karvonenZones(32, 62)
    expect(z[0]).toMatchObject({ zona: 'Z1', min: 125, max: 138 })
    expect(z[1]).toMatchObject({ zona: 'Z2', min: 138, max: 150 })
    expect(z[4]).toMatchObject({ zona: 'Z5', min: 175, max: 188 })
  })

  it('fórmula simples usa % da FC máxima', () => {
    expect(simpleZones(32)[1]).toMatchObject({ zona: 'Z2', min: 113, max: 132 })
  })
})

describe('recoveryScore', () => {
  it('8h de sono, ótimo, FC na base, sem treino ontem → 100', () => {
    expect(recoveryScore({ sono_horas: 8, disposicao: 5, fc_repouso: 62, volume_ontem: 0 }).score).toBe(100)
  })

  it('sono curto e disposição ruim derrubam para descanso ativo', () => {
    const r = recoveryScore({ sono_horas: 4.5, disposicao: 2, fc_repouso: 62, volume_ontem: 12000 })
    expect(r.score).toBeLessThan(40)
    expect(r.classificacao).toContain('Descanso ativo')
  })

  it('FC acima da base reduz o componente cardíaco', () => {
    expect(recoveryScore({ sono_horas: 8, disposicao: 5, fc_repouso: 67 }).componentes.fc).toBe(50)
  })

  it('faixas da classificação', () => {
    expect(classifyRecovery(80).classificacao).toContain('pesado')
    expect(classifyRecovery(79).classificacao).toContain('moderado')
    expect(classifyRecovery(59).classificacao).toContain('leve')
    expect(classifyRecovery(39).classificacao).toContain('Descanso')
  })
})

describe('recompForecast', () => {
  it('déficit moderado com proteína e treino adequados: perde gordura e ganha músculo', () => {
    const f = recompForecast({ weight: 90, body_fat_pct: 22, protein_g: 170, calories: 2200, weeks: 12, training_days_week: 4 })
    expect(f.gordura_kg).toBeLessThan(0)
    expect(f.musculo_kg).toBeGreaterThan(0)
    expect(f.probabilidade).toBeGreaterThanOrEqual(5)
    expect(f.probabilidade).toBeLessThanOrEqual(95)
  })

  it('proteína baixa vira a recomendação principal', () => {
    const f = recompForecast({ weight: 90, body_fat_pct: 22, protein_g: 100, calories: 2400 })
    expect(f.recomendacao).toContain('proteína')
  })
})

describe('leitura da API', () => {
  it('findNumber acha a chave em qualquer profundidade e aceita string numérica', () => {
    expect(findNumber({ data: { result: { homa_ir: '1.78' } } }, /homa/i)).toBe(1.78)
    expect(findNumber({ a: 1 }, /homa/i)).toBeNull()
  })

  it('concorda rejeita valor fora da tolerância (ex.: unidade trocada)', () => {
    expect(concorda(1.8, 1.78)).toBe(true)
    expect(concorda(32, 1.78)).toBe(false)
    expect(concorda(null, 1.78)).toBe(false)
  })
})

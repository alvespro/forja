import { describe, expect, it } from 'vitest'

import { checkCriticalMarkers } from './use-protocol-alerts'

/**
 * Limiares médicos do módulo de protocolo — estes testes travam os valores:
 * qualquer mudança acidental nos limites quebra o build.
 */
describe('checkCriticalMarkers', () => {
  it('valores normais não geram alerta', () => {
    expect(
      checkCriticalMarkers({ hematocrito: 45, ldl: 100, tgo: 30, tgp: 35, estradiol: 30 }),
    ).toHaveLength(0)
  })

  it('hematócrito: >52 é crítico, 48–52 é atenção', () => {
    expect(checkCriticalMarkers({ hematocrito: 53 })[0]).toMatchObject({
      id: 'hematocrito_critico',
      level: 'critico',
    })
    expect(checkCriticalMarkers({ hematocrito: 48 })[0]).toMatchObject({
      id: 'hematocrito_atencao',
      level: 'atencao',
    })
    expect(checkCriticalMarkers({ hematocrito: 52 })[0]?.level).toBe('atencao')
    expect(checkCriticalMarkers({ hematocrito: 47.9 })).toHaveLength(0)
  })

  it('LDL: >160 é crítico, 130–160 é atenção', () => {
    expect(checkCriticalMarkers({ ldl: 161 })[0]).toMatchObject({ id: 'ldl_critico', level: 'critico' })
    expect(checkCriticalMarkers({ ldl: 130 })[0]).toMatchObject({ id: 'ldl_atencao', level: 'atencao' })
    expect(checkCriticalMarkers({ ldl: 129 })).toHaveLength(0)
  })

  it('enzimas hepáticas: TGO >120 e TGP >135 são críticos', () => {
    expect(checkCriticalMarkers({ tgo: 121 })[0]?.level).toBe('critico')
    expect(checkCriticalMarkers({ tgp: 136 })[0]?.level).toBe('critico')
    // no limite exato do crítico, cai na faixa de atenção (não silêncio)
    expect(checkCriticalMarkers({ tgo: 120 })[0]?.level).toBe('atencao')
    expect(checkCriticalMarkers({ tgp: 135 })[0]?.level).toBe('atencao')
  })

  it('estradiol: >60 é crítico', () => {
    expect(checkCriticalMarkers({ estradiol: 61 })[0]?.level).toBe('critico')
    expect(checkCriticalMarkers({ estradiol: 60 })).toHaveLength(0)
  })

  it('múltiplos marcadores alterados geram múltiplos alertas', () => {
    const alerts = checkCriticalMarkers({ hematocrito: 55, ldl: 170, tgo: 150 })
    expect(alerts).toHaveLength(3)
    expect(alerts.every((a) => a.level === 'critico')).toBe(true)
  })

  it('estradiol <20 é atenção (E2 suprimido); 20-60 é normal', () => {
    expect(checkCriticalMarkers({ estradiol: 19 })[0]).toMatchObject({ id: 'estradiol_baixo', level: 'atencao' })
    expect(checkCriticalMarkers({ estradiol: 20 })).toHaveLength(0)
    expect(checkCriticalMarkers({ estradiol: 60 })).toHaveLength(0)
  })

  it('enzimas hepáticas: faixa de atenção entre a referência e o crítico', () => {
    expect(checkCriticalMarkers({ tgo: 41 })[0]).toMatchObject({ id: 'tgo_atencao', level: 'atencao' })
    expect(checkCriticalMarkers({ tgo: 40 })).toHaveLength(0)
    expect(checkCriticalMarkers({ tgo: 120 })[0]?.level).toBe('atencao')
    expect(checkCriticalMarkers({ tgp: 46 })[0]).toMatchObject({ id: 'tgp_atencao', level: 'atencao' })
    expect(checkCriticalMarkers({ tgp: 45 })).toHaveLength(0)
    expect(checkCriticalMarkers({ tgp: 135 })[0]?.level).toBe('atencao')
  })

  it('PSA >4 é crítico', () => {
    expect(checkCriticalMarkers({ psa: 4.1 })[0]).toMatchObject({ id: 'psa_critico', level: 'critico' })
    expect(checkCriticalMarkers({ psa: 4 })).toHaveLength(0)
  })

  it('hemoglobina >18 é crítico (policitemia)', () => {
    expect(checkCriticalMarkers({ hemoglobina: 18.1 })[0]).toMatchObject({ id: 'hemoglobina_critico', level: 'critico' })
    expect(checkCriticalMarkers({ hemoglobina: 18 })).toHaveLength(0)
  })

  it('HDL <40 é atenção', () => {
    expect(checkCriticalMarkers({ hdl: 39 })[0]).toMatchObject({ id: 'hdl_baixo', level: 'atencao' })
    expect(checkCriticalMarkers({ hdl: 40 })).toHaveLength(0)
  })

  it('marcadores desconhecidos são ignorados', () => {
    expect(checkCriticalMarkers({ glicose: 300, creatinina: 2 })).toHaveLength(0)
  })
})

import { describe, expect, it } from 'vitest'

import { projectWeight } from './weight-projection'

describe('projectWeight', () => {
  it('projeta perda de peso semana a semana até a meta', () => {
    const p = projectWeight(84, 80, -0.5, '2026-01-01')
    expect(p.status).toBe('ok')
    expect(p.weeks).toBe(8) // 4kg / 0,5 = 8 semanas
    expect(p.points[0]).toEqual({ date: '2026-01-01', peso: 84 })
    expect(p.points.at(-1)).toEqual({ date: '2026-02-26', peso: 80 }) // 8*7 dias depois, cravado na meta
    expect(p.targetDate).toBe('2026-02-26')
  })

  it('arredonda semanas para cima quando não é múltiplo exato', () => {
    const p = projectWeight(85, 80, -0.5, '2026-01-01')
    expect(p.weeks).toBe(10) // 5 / 0,5
    const p2 = projectWeight(84.3, 80, -0.5, '2026-01-01')
    expect(p2.weeks).toBe(9) // 4,3 / 0,5 = 8,6 → 9
  })

  it('recomposição (taxa 0) mantém o peso e não define ETA', () => {
    const p = projectWeight(84, 84, 0, '2026-01-01')
    // delta ~0 já conta como atingida; para recomposição real com meta diferente:
    const r = projectWeight(84, 82, 0, '2026-01-01')
    expect(r.status).toBe('recomposicao')
    expect(r.weeks).toBeNull()
    expect(r.points.every((pt) => pt.peso === 84)).toBe(true)
    expect(p.status).toBe('ja_atingida')
  })

  it('taxa na direção errada é inválida', () => {
    const p = projectWeight(84, 80, 0.5, '2026-01-01') // quer perder, mas taxa é de ganho
    expect(p.status).toBe('taxa_invalida')
    expect(p.points).toEqual([])
  })

  it('sem peso atual ou meta retorna sem_dados', () => {
    expect(projectWeight(null, 80, -0.5, '2026-01-01').status).toBe('sem_dados')
    expect(projectWeight(84, null, -0.5, '2026-01-01').status).toBe('sem_dados')
  })

  it('projeta ganho de peso', () => {
    const p = projectWeight(80, 82, 0.25, '2026-01-01')
    expect(p.status).toBe('ok')
    expect(p.weeks).toBe(8) // 2 / 0,25
    expect(p.points.at(-1)?.peso).toBe(82)
  })
})

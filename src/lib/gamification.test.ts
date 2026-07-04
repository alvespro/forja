import { describe, expect, it } from 'vitest'

import { computeAchievements, computeStreak, last7Days, levelInfo, XP_POR_NIVEL } from './gamification'
import type { DailyScore } from '@/types/database'

function score(data: string, pontos: number, total = 100, bonus = 0): DailyScore {
  return { id: data, user_id: 'u', data, pontos, total, bonus, updated_at: '' }
}

describe('levelInfo', () => {
  it('0 XP é nível 1, Aprendiz da Forja', () => {
    const lv = levelInfo(0)
    expect(lv.nivel).toBe(1)
    expect(lv.titulo).toBe('Aprendiz da Forja')
    expect(lv.xpParaProximo).toBe(XP_POR_NIVEL)
  })

  it('sobe de nível a cada 500 XP', () => {
    expect(levelInfo(499).nivel).toBe(1)
    expect(levelInfo(500).nivel).toBe(2)
    expect(levelInfo(1250).nivel).toBe(3)
  })

  it('títulos por faixa', () => {
    expect(levelInfo(1000).titulo).toBe('Ferreiro') // nível 3
    expect(levelInfo(2000).titulo).toBe('Forjador de Aço') // nível 5
    expect(levelInfo(3500).titulo).toBe('Mestre da Forja') // nível 8
    expect(levelInfo(5500).titulo).toBe('Lenda do Aço') // nível 12
  })

  it('progresso dentro do nível', () => {
    const lv = levelInfo(750)
    expect(lv.xpNoNivel).toBe(250)
    expect(lv.progresso).toBe(0.5)
  })
})

describe('computeStreak', () => {
  const today = '2026-07-02'

  it('sem histórico é 0', () => {
    expect(computeStreak([], today)).toBe(0)
  })

  it('hoje com 50%+ conta 1', () => {
    expect(computeStreak([score(today, 50)], today)).toBe(1)
  })

  it('hoje incompleto não quebra o streak de ontem', () => {
    const scores = [score('2026-06-30', 80), score('2026-07-01', 80), score(today, 10)]
    expect(computeStreak(scores, today)).toBe(2)
  })

  it('dia abaixo de 50% quebra a sequência', () => {
    const scores = [score('2026-06-29', 80), score('2026-06-30', 30), score('2026-07-01', 80), score(today, 80)]
    expect(computeStreak(scores, today)).toBe(2)
  })

  it('dia sem registro quebra a sequência', () => {
    const scores = [score('2026-06-29', 80), score('2026-07-01', 80), score(today, 80)]
    expect(computeStreak(scores, today)).toBe(2)
  })
})

describe('last7Days', () => {
  it('sempre retorna 7 dias terminando hoje', () => {
    const days = last7Days([score('2026-07-01', 80)], '2026-07-02')
    expect(days).toHaveLength(7)
    expect(days[6].data).toBe('2026-07-02')
    expect(days[6].isToday).toBe(true)
    expect(days[5].pct).toBe(80)
    expect(days[0].pct).toBe(0)
  })
})

describe('computeAchievements', () => {
  const today = '2026-07-02'

  it('Primeiro FORJADO exige um dia com 80%+', () => {
    const sem = computeAchievements([score(today, 79)], today)
    expect(sem.find((a) => a.key === 'primeiro_forjado')?.earned).toBe(false)

    const com = computeAchievements([score(today, 80)], today)
    expect(com.find((a) => a.key === 'primeiro_forjado')?.earned).toBe(true)
  })

  it('semana perfeita exige 7 dias consecutivos com 80%+', () => {
    const seis = ['2026-06-26', '2026-06-27', '2026-06-28', '2026-06-29', '2026-06-30', '2026-07-01'].map((d) =>
      score(d, 90),
    )
    expect(computeAchievements(seis, today).find((a) => a.key === 'semana_perfeita')?.earned).toBe(false)

    const sete = [...seis, score('2026-07-02', 90)]
    expect(computeAchievements(sete, today).find((a) => a.key === 'semana_perfeita')?.earned).toBe(true)
  })

  it('1.000 XP soma pontos (o bônus do dia já está incluído em pontos)', () => {
    const scores = [score('2026-07-01', 700, 700, 100), score(today, 300)]
    expect(computeAchievements(scores, today).find((a) => a.key === 'xp_1000')?.earned).toBe(true)
  })

  it('não conta o bônus em dobro no XP', () => {
    // 550 + 400 = 950 < 1000; a dupla contagem antiga (550+100+400=1050) daria earned
    const scores = [score('2026-07-01', 550, 700, 100), score(today, 400)]
    expect(computeAchievements(scores, today).find((a) => a.key === 'xp_1000')?.earned).toBe(false)
  })
})

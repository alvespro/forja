// Modelo de um dia no calendário de atividades (contribution graph).

export type ActivityDay = {
  data: string // yyyy-MM-dd
  treino: boolean
  cardio: boolean
  habitos_pct: number
  refeicoes_pct: number
  score: number
}

export type ActivityLevel = 0 | 1 | 2 | 3 | 4

/** Cores por intensidade (SPEC Sub-passo 4). Índice = nível 0..4. */
export const ACTIVITY_LEVEL_COLORS: Record<ActivityLevel, string> = {
  0: '#1A1A1A', // sem atividade
  1: '#2E2E2E', // hábitos parciais
  2: 'rgba(252, 76, 19, 0.5)', // treino/cardio ou hábitos ≥ 50%
  3: 'rgba(252, 76, 19, 0.75)', // treino + hábitos ≥ 70%
  4: '#FC4C13', // tudo: treino + hábitos 100% + nutrição
}

/** Deriva os campos calculados do dia a partir das contagens de origem. */
export function computeActivityDay(input: {
  habitsTotal: number
  habitsDone: number
  treino: boolean
  cardio: boolean
  score?: number | null
  refeicoesPct?: number | null
}): Omit<ActivityDay, 'data'> {
  const habitos_pct =
    input.habitsTotal > 0 ? Math.round((input.habitsDone / input.habitsTotal) * 100) : 0
  return {
    treino: input.treino,
    cardio: input.cardio,
    habitos_pct,
    refeicoes_pct: input.refeicoesPct ?? 0,
    score: input.score ?? 0,
  }
}

/** Classifica o dia em um nível de intensidade 0..4 para colorir a célula. */
export function activityLevel(day: Pick<ActivityDay, 'treino' | 'cardio' | 'habitos_pct' | 'refeicoes_pct'>): ActivityLevel {
  const h = day.habitos_pct ?? 0
  const ref = day.refeicoes_pct ?? 0
  if (day.treino && h >= 100 && ref >= 100) return 4
  if (day.treino && h >= 70) return 3
  if (h >= 50 || day.treino || day.cardio) return 2
  if (h > 0) return 1
  return 0
}

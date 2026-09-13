// Decide "o que fazer agora" no cockpit, pela hora e pelo estado do dia.

export type NextAction = {
  icon: string
  title: string
  ctaLabel: string | null
  to: string | null
}

export type NextActionInput = {
  nowMinutes: number
  isSunday: boolean
  weighedThisWeek: boolean
  /** Refeição do momento (nome + horário em minutos), se houver plano. */
  currentMeal: { nome: string; minutes: number | null } | null
}

export const RITUAL_UNTIL_MINUTES = 7 * 60
export const MEAL_WINDOW_MINUTES = 30

/**
 * Prioridade: ritual matinal (antes das 7h) → hora de uma refeição (±30min) →
 * pesagem de domingo → foco padrão nos hábitos.
 */
export function computeNextAction(input: NextActionInput): NextAction {
  if (input.nowMinutes < RITUAL_UNTIL_MINUTES) {
    return { icon: '☀️', title: 'Ritual matinal — hábitos do dia', ctaLabel: 'Ver hábitos', to: '/habits' }
  }

  const meal = input.currentMeal
  if (meal && meal.minutes !== null && Math.abs(input.nowMinutes - meal.minutes) <= MEAL_WINDOW_MINUTES) {
    return { icon: '🥗', title: `Hora do ${meal.nome}`, ctaLabel: 'Registrar', to: '/nutricao' }
  }

  if (input.isSunday && !input.weighedThisWeek) {
    return { icon: '⚖️', title: 'Pesagem semanal', ctaLabel: 'Registrar peso', to: '/body' }
  }

  return { icon: '🎯', title: 'Mantenha o ritmo — complete seus hábitos', ctaLabel: 'Ver hábitos', to: '/habits' }
}

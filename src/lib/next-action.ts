// Decide "o que fazer agora" no cockpit, pela hora e pelo estado do dia.

export type NextAction = {
  icon: string
  title: string
  /** Linha de apoio: por que esta é a ação agora. */
  subtitle: string
  ctaLabel: string | null
  to: string | null
}

export type NextActionInput = {
  nowMinutes: number
  isSunday: boolean
  weighedThisWeek: boolean
  /** Já existe sessão de treino registrada hoje. */
  treinouHoje: boolean
  /** Nome do próximo treino da rotação, se houver treinos ativos. */
  proximoTreino?: string | null
  /** Refeição do momento (nome + horário em minutos), se houver plano. */
  currentMeal: { nome: string; minutes: number | null } | null
}

export const RITUAL_UNTIL_MINUTES = 7 * 60
export const TREINO_WINDOW_START = 16 * 60
export const NOITE_START = 19 * 60
export const MEAL_WINDOW_MINUTES = 30

/**
 * Prioridade: ritual 5AM (antes das 7h) → refeição na janela de ±30min →
 * pesagem de domingo → padrão da faixa do dia:
 *   07h–16h  treino do dia (se ainda não treinou) ou hábitos
 *   16h–19h  janela do treino, ou pós-treino se já treinou
 *   19h+     fechamento: jantar, suplementos e desligamento
 */
export function computeNextAction(input: NextActionInput): NextAction {
  const { nowMinutes, treinouHoje } = input

  if (nowMinutes < RITUAL_UNTIL_MINUTES) {
    return {
      icon: '☀️',
      title: 'Ritual 5AM',
      subtitle: 'Comece pelos hábitos inegociáveis antes do dia começar.',
      ctaLabel: 'Ver hábitos',
      to: '/habits',
    }
  }

  const meal = input.currentMeal
  if (meal && meal.minutes !== null && Math.abs(nowMinutes - meal.minutes) <= MEAL_WINDOW_MINUTES) {
    return {
      icon: '🥗',
      title: `Hora do ${meal.nome}`,
      subtitle: 'Registre agora, enquanto a refeição ainda está fresca na memória.',
      ctaLabel: 'Registrar',
      to: '/nutricao',
    }
  }

  if (input.isSunday && !input.weighedThisWeek) {
    return {
      icon: '⚖️',
      title: 'Pesagem semanal',
      subtitle: 'Mesma hora, mesmas condições — é o dado que calibra a projeção.',
      ctaLabel: 'Registrar peso',
      to: '/body',
    }
  }

  if (nowMinutes >= NOITE_START) {
    return {
      icon: '🌙',
      title: 'Fechamento do dia',
      subtitle: 'Jantar leve, suplementos da noite e desligar as telas.',
      ctaLabel: 'Ver nutrição',
      to: '/nutricao',
    }
  }

  if (nowMinutes >= TREINO_WINDOW_START) {
    return treinouHoje
      ? {
          icon: '🥤',
          title: 'Pós-treino',
          subtitle: 'Treino feito. Agora a proteína da recuperação.',
          ctaLabel: 'Registrar refeição',
          to: '/nutricao',
        }
      : {
          icon: '🔥',
          title: 'Janela do treino',
          subtitle: input.proximoTreino
            ? `${input.proximoTreino}: pré-treino, treino e pós.`
            : 'Pré-treino, treino e pós — é a sua melhor hora do dia.',
          ctaLabel: 'Ir para o treino',
          to: '/workout',
        }
  }

  return treinouHoje
    ? {
        icon: '🎯',
        title: 'Mantenha o ritmo',
        subtitle: 'Treino feito. Feche os hábitos que faltam.',
        ctaLabel: 'Ver hábitos',
        to: '/habits',
      }
    : {
        icon: '🏋️',
        title: input.proximoTreino ? `Treino de hoje: ${input.proximoTreino}` : 'Treino do dia',
        subtitle: 'Ainda não há sessão registrada hoje.',
        ctaLabel: 'Ir para o treino',
        to: '/workout',
      }
}

import { currentIsoWeekDates, todayInSaoPaulo } from './date'

import type { Habit, JournalEntry } from '@/types/database'

export type HabitsWeeklyScore = {
  percent: number
  concluidos: number
  possiveis: number
}

/** % de check-ins de hábitos concluídos nesta semana ISO (mesma regra da tela Hábitos). */
export function computeHabitsWeeklyScore(
  habits: Habit[],
  logsByHabit: Map<string, Set<string>>,
): HabitsWeeklyScore {
  const weekDates = currentIsoWeekDates()
  const today = todayInSaoPaulo()
  const diasDecorridos = weekDates.filter((d) => d <= today).length

  let concluidos = 0
  let possiveis = 0

  for (const habit of habits) {
    const completedDates = logsByHabit.get(habit.id) ?? new Set<string>()
    concluidos += weekDates.filter((d) => completedDates.has(d)).length
    possiveis += diasDecorridos
  }

  const percent = possiveis > 0 ? Math.round((concluidos / possiveis) * 100) : 0
  return { percent, concluidos, possiveis }
}

/** Humor médio (1-5) das entradas de diário desta semana ISO, arredondado em 1 casa. */
export function computeAverageMood(entries: JournalEntry[]): number | null {
  const weekDates = new Set(currentIsoWeekDates())
  const moods = entries
    .filter((entry) => weekDates.has(entry.data) && entry.humor !== null)
    .map((entry) => entry.humor as number)

  if (moods.length === 0) return null
  return Math.round((moods.reduce((sum, mood) => sum + mood, 0) / moods.length) * 10) / 10
}

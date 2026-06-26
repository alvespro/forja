import { addDaysToDateString } from './date'

/**
 * Seção 6.1 do SPEC: dias consecutivos com concluido=true, terminando em ontem
 * ou hoje. O dia de hoje ainda não marcado não quebra a sequência (só conta a
 * partir do dia anterior). Faltou um dia no meio, zera.
 */
export function calculateStreak(completedDates: Set<string>, today: string): number {
  let streak = 0
  let cursor = today

  if (completedDates.has(cursor)) {
    streak += 1
  }

  cursor = addDaysToDateString(cursor, -1)
  while (completedDates.has(cursor)) {
    streak += 1
    cursor = addDaysToDateString(cursor, -1)
  }

  return streak
}

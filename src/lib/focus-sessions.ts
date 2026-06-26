import { toSaoPauloDateString } from './date'

import type { FocusSession } from '@/types/database'

/** Sessões cujo `data` (timestamptz) cai em um conjunto de datas 'yyyy-MM-dd', no fuso America/Sao_Paulo. */
export function filterFocusSessionsByDates(
  sessions: FocusSession[],
  dates: string[],
): FocusSession[] {
  const set = new Set(dates)
  return sessions.filter((session) => set.has(toSaoPauloDateString(session.data)))
}

export function sumFocusMinutes(sessions: FocusSession[]): number {
  return sessions.reduce((total, session) => total + (session.duracao_min ?? 0), 0)
}

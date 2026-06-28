import { differenceInCalendarDays } from 'date-fns'

import { addDaysToDateString, parseDateOnly, todayInSaoPaulo } from '@/lib/date'

export type MacroStatus = 'ok' | 'atencao' | 'alerta'

/** ≥100% = ok (verde), 70-99% = atenção (âmbar), <70% = alerta (vermelho). Seção de cores do app. */
export function macroStatus(consumido: number, meta: number): MacroStatus {
  if (meta <= 0) return 'ok'
  const pct = (consumido / meta) * 100
  if (pct >= 100) return 'ok'
  if (pct >= 70) return 'atencao'
  return 'alerta'
}

export const MACRO_STATUS_TEXT_CLASS: Record<MacroStatus, string> = {
  ok: 'text-ok',
  atencao: 'text-atencao',
  alerta: 'text-alerta',
}

export const MACRO_STATUS_BAR_CLASS: Record<MacroStatus, string> = {
  ok: 'bg-ok',
  atencao: 'bg-atencao',
  alerta: 'bg-alerta',
}

const WEEKDAY_ABBR = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'] as const

/** Abreviação do dia da semana ('seg'..'dom') de uma data 'yyyy-MM-dd', igual ao formato de `supplements.dias_semana`. */
export function weekdayAbbrevOf(dateStr: string): string {
  return WEEKDAY_ABBR[parseDateOnly(dateStr).getDay()]
}

/**
 * Dias consecutivos com log `tomado = true`, terminando em ontem ou hoje (mesma regra de
 * streak de hábitos do app — hoje ainda não marcado não quebra a sequência).
 */
export function computeStreak(logDates: string[]): number {
  const taken = new Set(logDates)
  const today = todayInSaoPaulo()
  let cursor = taken.has(today) ? today : addDaysToDateString(today, -1)
  let streak = 0

  while (taken.has(cursor)) {
    streak += 1
    cursor = addDaysToDateString(cursor, -1)
  }
  return streak
}

export function daysSince(dateStr: string): number {
  return differenceInCalendarDays(parseDateOnly(todayInSaoPaulo()), parseDateOnly(dateStr))
}

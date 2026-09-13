import { addDays, differenceInCalendarDays, format, parse, startOfISOWeek } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

export const TIME_ZONE = 'America/Sao_Paulo'

const DATE_FORMAT = 'yyyy-MM-dd'

/** Data de hoje no fuso America/Sao_Paulo, como string 'yyyy-MM-dd'. */
export function todayInSaoPaulo(): string {
  return format(toZonedTime(new Date(), TIME_ZONE), DATE_FORMAT)
}

/** Minutos desde a meia-noite no fuso America/Sao_Paulo (ex.: 12:30 → 750). */
export function nowMinutesInSaoPaulo(): number {
  const zoned = toZonedTime(new Date(), TIME_ZONE)
  return zoned.getHours() * 60 + zoned.getMinutes()
}

/** Converte uma string 'yyyy-MM-dd' em Date (meia-noite local), sem deslocamento de fuso. */
export function parseDateOnly(dateStr: string): Date {
  return parse(dateStr, DATE_FORMAT, new Date())
}

export function formatDateOnly(date: Date): string {
  return format(date, DATE_FORMAT)
}

export function addDaysToDateString(dateStr: string, amount: number): string {
  return formatDateOnly(addDays(parseDateOnly(dateStr), amount))
}

/** Converte um timestamp (ISO/timestamptz) na data 'yyyy-MM-dd' correspondente no fuso America/Sao_Paulo. */
export function toSaoPauloDateString(timestamp: string): string {
  return format(toZonedTime(new Date(timestamp), TIME_ZONE), DATE_FORMAT)
}

/** Diferença em dias de calendário (b - a), para strings 'yyyy-MM-dd'. */
export function diffInDays(dateStrA: string, dateStrB: string): number {
  return differenceInCalendarDays(parseDateOnly(dateStrA), parseDateOnly(dateStrB))
}

/** As 7 datas (Seg..Dom) da semana ISO corrente, no fuso America/Sao_Paulo. */
export function currentIsoWeekDates(): string[] {
  const today = toZonedTime(new Date(), TIME_ZONE)
  const monday = startOfISOWeek(today)
  return Array.from({ length: 7 }, (_, i) => formatDateOnly(addDays(monday, i)))
}

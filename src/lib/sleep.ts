import { addDaysToDateString } from '@/lib/date'
import type { RecoveryScore, SleepLog } from '@/types/database'

/**
 * Regras do módulo Sono. Convenção: `sleep_logs.data` é o dia em que a noite
 * começou — o score de recuperação do dia D usa o sono gravado em D − 1.
 */

export const META_SONO_MIN = 7
export const META_SONO_MAX = 8

export function horasDormidas(log: Pick<SleepLog, 'duracao_min'>): number | null {
  return log.duracao_min == null ? null : Math.round((log.duracao_min / 60) * 10) / 10
}

/** A noite que alimenta o score de hoje. */
export function noiteAnterior(hoje: string): string {
  return addDaysToDateString(hoje, -1)
}

export type SleepWeekStats = {
  /** Média das noites registradas nos últimos 7 dias (null sem registro). */
  media: number | null
  /** Σ das horas que faltaram para 8h, só nas noites registradas. */
  divida: number
  noitesRegistradas: number
}

export function sleepWeekStats(logs: SleepLog[], hoje: string): SleepWeekStats {
  const inicio = addDaysToDateString(hoje, -7)
  const horas = logs
    .filter((l) => l.data >= inicio && l.data < hoje)
    .map(horasDormidas)
    .filter((h): h is number => h !== null)

  if (horas.length === 0) return { media: null, divida: 0, noitesRegistradas: 0 }
  const soma = horas.reduce((a, b) => a + b, 0)
  const divida = horas.reduce((a, h) => a + Math.max(0, META_SONO_MAX - h), 0)
  return {
    media: Math.round((soma / horas.length) * 10) / 10,
    divida: Math.round(divida * 10) / 10,
    noitesRegistradas: horas.length,
  }
}

/** Pares (horas da noite, score do dia seguinte) para o gráfico de correlação. */
export function pairSleepWithRecovery(logs: SleepLog[], scores: RecoveryScore[]): { data: string; horas: number; score: number }[] {
  const porNoite = new Map(logs.map((l) => [l.data, horasDormidas(l)]))
  return scores.flatMap((s) => {
    const horas = porNoite.get(noiteAnterior(s.data))
    return horas != null && s.score != null ? [{ data: s.data, horas, score: s.score }] : []
  })
}

/** Formata horas com vírgula decimal: 6.5 → "6,5h", 7 → "7h". */
export function formatHoras(horas: number): string {
  return `${String(Math.round(horas * 10) / 10).replace('.', ',')}h`
}

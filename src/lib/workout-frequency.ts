import { currentIsoWeekDates, diffInDays, formatDateOnly } from '@/lib/date'
import type { CardioSession, Workout, WorkoutSession } from '@/types/database'

export const FORCA_WEEKLY_GOAL = 4
export const CORRIDA_WEEKLY_GOAL = 3
export const STALE_THRESHOLD_DAYS = 7

function isInCurrentIsoWeek(performedAt: string): boolean {
  const week = currentIsoWeekDates()
  const dateStr = formatDateOnly(new Date(performedAt))
  return week.includes(dateStr)
}

/** Seção 6.6: sessões de força (treino) nesta semana ISO, vs. meta (4x). */
export function countSessionsThisWeek(sessions: WorkoutSession[]): number {
  return sessions.filter((session) => isInCurrentIsoWeek(session.performed_at)).length
}

/** Sessões de cardio/corrida nesta semana ISO, vs. meta (3x). */
export function countCardioThisWeek(cardioSessions: CardioSession[]): number {
  return cardioSessions.filter((session) => isInCurrentIsoWeek(session.performed_at)).length
}

export type MuscleGroupFreshness = {
  foco: string
  ultimaSessao: string | null
  diasSemEstimulo: number | null
  alerta: boolean
}

/**
 * Frequência por grupo muscular (via workouts.foco), Seção 6.6.
 * Alerta quando um grupo ficou mais de STALE_THRESHOLD_DAYS dias sem estímulo.
 */
export function computeMuscleGroupFreshness(
  workouts: Workout[],
  sessions: WorkoutSession[],
): MuscleGroupFreshness[] {
  const focos = Array.from(new Set(workouts.map((w) => w.foco).filter((f): f is string => !!f)))
  const today = formatDateOnly(new Date())

  return focos.map((foco) => {
    const workoutIds = new Set(workouts.filter((w) => w.foco === foco).map((w) => w.id))
    const relevantSessions = sessions.filter((s) => s.workout_id && workoutIds.has(s.workout_id))

    if (relevantSessions.length === 0) {
      return { foco, ultimaSessao: null, diasSemEstimulo: null, alerta: false }
    }

    const latest = relevantSessions.reduce((max, s) =>
      new Date(s.performed_at) > new Date(max.performed_at) ? s : max,
    )
    const lastDateStr = formatDateOnly(new Date(latest.performed_at))
    const diasSemEstimulo = diffInDays(today, lastDateStr)

    return {
      foco,
      ultimaSessao: latest.performed_at,
      diasSemEstimulo,
      alerta: diasSemEstimulo > STALE_THRESHOLD_DAYS,
    }
  })
}

export type MuscleFreshnessState = 'ativo' | 'recente' | 'descansado' | 'inativo'

/** Até quantos dias sem estímulo um grupo ainda conta como "recente" no BodyMap. */
export const RECENT_THRESHOLD_DAYS = 3

/**
 * Converte a frequência por foco de treino (texto livre, ex.: "Costas e Bíceps")
 * em estado por grupo muscular para o BodyMap. Um grupo presente em vários
 * treinos assume o estímulo mais recente.
 *   0 dias → ativo · < 3 → recente · > 7 → descansado · resto/sem registro → inativo
 */
export function muscleStatesFromFreshness(
  freshness: MuscleGroupFreshness[],
  resolve: (foco: string) => string[],
): Record<string, MuscleFreshnessState> {
  const menorDias = new Map<string, number>()
  for (const f of freshness) {
    if (f.diasSemEstimulo === null) continue
    for (const key of resolve(f.foco)) {
      const atual = menorDias.get(key)
      if (atual === undefined || f.diasSemEstimulo < atual) menorDias.set(key, f.diasSemEstimulo)
    }
  }
  const estados: Record<string, MuscleFreshnessState> = {}
  for (const [key, dias] of menorDias) {
    estados[key] =
      dias === 0 ? 'ativo' : dias < RECENT_THRESHOLD_DAYS ? 'recente' : dias > STALE_THRESHOLD_DAYS ? 'descansado' : 'inativo'
  }
  return estados
}

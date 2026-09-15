import { useMemo } from 'react'

import { useDailyScores } from '@/hooks/use-daily-scores'
import { useRecoveryScores } from '@/hooks/use-sleep-logs'
import { useWorkoutSessions } from '@/hooks/use-workout-sessions'
import { useWorkouts } from '@/hooks/use-workouts'
import { todayInSaoPaulo, toSaoPauloDateString } from '@/lib/date'
import { gateRecuperacao, type GateRecuperacao } from '@/lib/mobility'
import { pickTodaysWorkout } from '@/lib/workout-rotation'

export type RecoveryGate = {
  gate: GateRecuperacao
  score: number | null
  /** Treino de força da rotação para hoje (null se descanso, já treinou ou sem treinos). */
  treinoDeHoje: string | null
}

/**
 * Recuperação de hoje × treino programado — decide se o Hoje troca a ação
 * principal por mobilidade. Compartilhado entre o card de ação e o de recuperação.
 */
export function useRecoveryGate(): RecoveryGate {
  const scores = useRecoveryScores(14)
  const sessions = useWorkoutSessions()
  const workouts = useWorkouts()
  const daily = useDailyScores()

  return useMemo(() => {
    const hoje = todayInSaoPaulo()
    const recuperacao = scores.data?.find((s) => s.data === hoje) ?? null
    const descanso = daily.data?.find((d) => d.data === hoje)?.rest_day ?? false
    const treinouHoje = (sessions.data ?? []).some((s) => s.performed_at && toSaoPauloDateString(s.performed_at) === hoje)
    const ativos = (workouts.data ?? []).filter((w) => w.ativo)
    const proximo = pickTodaysWorkout(ativos, sessions.data?.[0]?.workout_id ?? null)
    const treinoDeHoje = !descanso && !treinouHoje && proximo ? proximo.nome + (proximo.foco ? `: ${proximo.foco}` : '') : null

    return {
      gate: gateRecuperacao({
        score: recuperacao?.score ?? null,
        treinoProgramado: treinoDeHoje !== null,
        decisao: recuperacao?.decisao_treino ?? null,
      }),
      score: recuperacao?.score ?? null,
      treinoDeHoje,
    }
  }, [scores.data, sessions.data, workouts.data, daily.data])
}

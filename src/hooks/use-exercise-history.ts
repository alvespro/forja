import { useQuery } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase'
import type { SetLogWithSession } from '@/lib/workout-metrics'

import { useAuth } from './use-auth'

type SetLogRow = {
  id: string
  user_id: string
  session_id: string
  exercise_id: string
  serie_num: number
  carga_kg: number | null
  reps: number | null
  pausa_seg: number | null
  cadencia: string | null
  rpe: number | null
  concluida: boolean
  created_at: string
  workout_sessions: { performed_at: string; workouts: { nome: string } | null } | null
}

/** Histórico completo de séries de um exercício, com a data da sessão embutida. */
export function useExerciseHistory(exerciseId: string) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['exercise-history', exerciseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('set_logs')
        .select('*, workout_sessions(performed_at, workouts(nome))')
        .eq('exercise_id', exerciseId)
        .eq('concluida', true)
        .order('created_at')
      if (error) throw error

      return (data as SetLogRow[])
        .filter((row) => row.workout_sessions)
        .map((row): SetLogWithSession => ({
          id: row.id,
          user_id: row.user_id,
          session_id: row.session_id,
          exercise_id: row.exercise_id,
          serie_num: row.serie_num,
          carga_kg: row.carga_kg,
          reps: row.reps,
          pausa_seg: row.pausa_seg,
          cadencia: row.cadencia,
          rpe: row.rpe,
          concluida: row.concluida,
          created_at: row.created_at,
          performed_at: row.workout_sessions!.performed_at,
          treino_nome: row.workout_sessions!.workouts?.nome ?? null,
        }))
    },
    enabled: !!user && !!exerciseId,
  })
}

import { useQuery } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase'

import { useAuth } from './use-auth'

export type ExerciseLoadSummary = {
  /** Carga da série concluída mais recente. */
  last: number | null
  /** Maior carga já registrada (record). */
  max: number | null
}

/**
 * Resumo de carga por exercício (última usada + recorde), em uma única query.
 * Usado na lista de exercícios do grupo para mostrar carga atual e badge de PR.
 */
export function useExerciseLoadSummary(exerciseIds: string[]) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['exercise-load-summary', exerciseIds.slice().sort().join(',')],
    queryFn: async () => {
      const map = new Map<string, ExerciseLoadSummary>()
      if (exerciseIds.length === 0) return map

      const { data, error } = await supabase
        .from('set_logs')
        .select('exercise_id, carga_kg, created_at')
        .in('exercise_id', exerciseIds)
        .eq('concluida', true)
        .not('carga_kg', 'is', null)
        .order('created_at', { ascending: false })
      if (error) throw error

      for (const row of data as { exercise_id: string; carga_kg: number }[]) {
        const cur = map.get(row.exercise_id) ?? { last: null, max: null }
        if (cur.last === null) cur.last = row.carga_kg // ordem desc: primeiro visto = mais recente
        if (cur.max === null || row.carga_kg > cur.max) cur.max = row.carga_kg
        map.set(row.exercise_id, cur)
      }
      return map
    },
    enabled: !!user && exerciseIds.length > 0,
  })
}

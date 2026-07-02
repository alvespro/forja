import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { addDaysToDateString, todayInSaoPaulo } from '@/lib/date'
import { supabase } from '@/lib/supabase'
import type { DailyScore } from '@/types/database'

import { useAuth } from './use-auth'

/** Scores diários dos últimos `days` dias (para streak, XP e conquistas). */
export function useDailyScores(days = 120) {
  const { user } = useAuth()
  const today = todayInSaoPaulo()
  const from = addDaysToDateString(today, -days)

  return useQuery({
    queryKey: ['daily-scores', from],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_scores')
        .select('*')
        .gte('data', from)
        .order('data', { ascending: true })
      if (error) throw error
      return data as DailyScore[]
    },
    enabled: !!user,
  })
}

export type DailyScoreInput = {
  data: string
  pontos: number
  total: number
  bonus: number
}

export function useUpsertDailyScore() {
  const { user } = useAuth()
  const qc = useQueryClient()

  return useMutation({
    // Upsert automático de telemetria: falha não deve interromper o usuário
    meta: { silent: true },
    mutationFn: async (input: DailyScoreInput) => {
      if (!user) throw new Error('Não autenticado')
      const { error } = await supabase
        .from('daily_scores')
        .upsert(
          { ...input, user_id: user.id, updated_at: new Date().toISOString() },
          { onConflict: 'user_id,data' },
        )
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['daily-scores'] }),
  })
}

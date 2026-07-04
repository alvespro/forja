import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase'
import type { DailyScore } from '@/types/database'

import { useAuth } from './use-auth'

/**
 * Histórico completo de scores diários, ascendente (base de streak, XP e conquistas —
 * uma janela parcial faria nível e conquistas REGREDIREM quando dias saíssem dela).
 * Busca descendente + reverse de propósito: se o histórico um dia passar do teto de
 * linhas do PostgREST (1000 ≈ 2,7 anos), caem os dias mais antigos, nunca os recentes.
 */
export function useDailyScores() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['daily-scores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_scores')
        .select('*')
        .order('data', { ascending: false })
        .limit(1000)
      if (error) throw error
      return (data as DailyScore[]).reverse()
    },
    enabled: !!user,
  })
}

export type DailyScoreInput = {
  data: string
  pontos: number
  total: number
  bonus: number
  rest_day?: boolean
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

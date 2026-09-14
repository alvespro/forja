import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { addDaysToDateString, todayInSaoPaulo } from '@/lib/date'
import { supabase } from '@/lib/supabase'
import type { RecoveryScore, SleepLog } from '@/types/database'

import { useAuth } from './use-auth'

/** Registros de sono dos últimos `dias` dias (ascendente, pronto para gráfico). */
export function useSleepLogs(dias = 60) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['sleep-logs', dias],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sleep_logs')
        .select('*')
        .gte('data', addDaysToDateString(todayInSaoPaulo(), -dias))
        .order('data', { ascending: true })
      if (error) throw error
      return data as SleepLog[]
    },
    enabled: !!user,
  })
}

/** Grava (ou corrige) as horas de sono de uma noite — um registro por data. */
export function useUpsertSleepLog() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ data, horas }: { data: string; horas: number }) => {
      if (!user) throw new Error('Usuário não autenticado')
      const { error } = await supabase
        .from('sleep_logs')
        .upsert(
          { user_id: user.id, data, duracao_min: Math.round(horas * 60), fonte: 'manual' },
          { onConflict: 'user_id,data' },
        )
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sleep-logs'] }),
  })
}

/** Scores de recuperação dos últimos `dias` dias (ascendente). */
export function useRecoveryScores(dias = 60) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['recovery-scores', dias],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recovery_scores')
        .select('*')
        .gte('data', addDaysToDateString(todayInSaoPaulo(), -dias))
        .order('data', { ascending: true })
      if (error) throw error
      return data as RecoveryScore[]
    },
    enabled: !!user,
  })
}

/**
 * Volume de treino (Σ carga × reps das séries concluídas) de um dia no fuso de
 * São Paulo — entra no score de recuperação do dia seguinte.
 */
export function useTrainingVolumeOn(data: string) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['training-volume', data],
    queryFn: async () => {
      const { data: logs, error } = await supabase
        .from('set_logs')
        .select('carga_kg, reps')
        .eq('concluida', true)
        .gte('created_at', `${data}T00:00:00-03:00`)
        .lt('created_at', `${addDaysToDateString(data, 1)}T00:00:00-03:00`)
      if (error) throw error
      return ((logs ?? []) as { carga_kg: number | null; reps: number | null }[]).reduce(
        (soma, l) => soma + (l.carga_kg ?? 0) * (l.reps ?? 0),
        0,
      )
    },
    enabled: !!user,
  })
}

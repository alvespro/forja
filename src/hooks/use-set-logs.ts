import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase'
import type { SetLog } from '@/types/database'

import { useAuth } from './use-auth'

export function useSetLogsForSession(sessionId: string | null) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['set-logs', 'session', sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('set_logs')
        .select('*')
        .eq('session_id', sessionId as string)
        .order('serie_num')
      if (error) throw error
      return data as SetLog[]
    },
    enabled: !!user && !!sessionId,
  })
}

/** Última série concluída de cada exercício (entre todas as sessões), para referência de carga. */
export function useLastSetLogByExercise(exerciseIds: string[]) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['set-logs', 'last-by-exercise', exerciseIds.slice().sort().join(',')],
    queryFn: async () => {
      if (exerciseIds.length === 0) return new Map<string, SetLog>()

      const { data, error } = await supabase
        .from('set_logs')
        .select('*')
        .in('exercise_id', exerciseIds)
        .eq('concluida', true)
        .order('created_at', { ascending: false })
      if (error) throw error

      const map = new Map<string, SetLog>()
      for (const log of data as SetLog[]) {
        if (!map.has(log.exercise_id)) map.set(log.exercise_id, log)
      }
      return map
    },
    enabled: !!user && exerciseIds.length > 0,
  })
}

export type SetLogInput = {
  session_id: string
  exercise_id: string
  serie_num: number
  carga_kg: number | null
  reps: number | null
  pausa_seg: number | null
  cadencia: string | null
  rpe: number | null
  concluida: boolean
}

export function useCreateSetLog() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (values: SetLogInput) => {
      if (!user) throw new Error('Usuário não autenticado')
      // Upsert na chave (sessão, exercício, série): retentativa de rede ou mutação
      // retomada depois de ficar offline não duplicam a série.
      const { data, error } = await supabase
        .from('set_logs')
        .upsert({ ...values, user_id: user.id }, { onConflict: 'session_id,exercise_id,serie_num' })
        .select('*')
        .single()
      if (error) throw error
      return data as SetLog
    },
    onSuccess: (_data, values) =>
      queryClient.invalidateQueries({ queryKey: ['set-logs', 'session', values.session_id] }),
  })
}

export function useUpdateSetLog() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: SetLogInput }) => {
      const { error } = await supabase.from('set_logs').update(values).eq('id', id)
      if (error) throw error
    },
    onSuccess: (_data, { values }) =>
      queryClient.invalidateQueries({ queryKey: ['set-logs', 'session', values.session_id] }),
  })
}

/** Grava a pausa real cronometrada (Seção 6.4), sem precisar reenviar os outros campos da série. */
export function useUpdateSetLogPausa() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, pausaSeg }: { id: string; sessionId: string; pausaSeg: number }) => {
      const { error } = await supabase.from('set_logs').update({ pausa_seg: pausaSeg }).eq('id', id)
      if (error) throw error
    },
    onSuccess: (_data, { sessionId }) =>
      queryClient.invalidateQueries({ queryKey: ['set-logs', 'session', sessionId] }),
  })
}

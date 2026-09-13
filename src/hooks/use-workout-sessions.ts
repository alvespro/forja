import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { syncActivityDay } from '@/lib/activity-sync'
import { addDaysToDateString, todayInSaoPaulo } from '@/lib/date'
import { supabase } from '@/lib/supabase'
import type { WorkoutSession } from '@/types/database'

import { useAuth } from './use-auth'

/**
 * Histórico de sessões realizadas, mais recentes primeiro (janela de 12 meses).
 * Usado por frequência e evolução — sem janela, a query cresceria para sempre.
 */
export function useWorkoutSessions() {
  const { user } = useAuth()
  const from = addDaysToDateString(todayInSaoPaulo(), -365)

  return useQuery({
    queryKey: ['workout-sessions', from],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workout_sessions')
        .select('*')
        .gte('performed_at', from)
        .order('performed_at', { ascending: false })
      if (error) throw error
      return data as WorkoutSession[]
    },
    enabled: !!user,
  })
}

export function useWorkoutSession(sessionId: string | null) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['workout-sessions', sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workout_sessions')
        .select('*')
        .eq('id', sessionId as string)
        .single()
      if (error) throw error
      return data as WorkoutSession
    },
    enabled: !!user && !!sessionId,
  })
}

export function useCreateWorkoutSession() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (workoutId: string | null) => {
      if (!user) throw new Error('Usuário não autenticado')
      const { data, error } = await supabase
        .from('workout_sessions')
        .insert({ workout_id: workoutId, user_id: user.id })
        .select('*')
        .single()
      if (error) throw error
      return data as WorkoutSession
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workout-sessions'] }),
  })
}

export type FinishWorkoutSessionInput = {
  id: string
  duracao_seg: number
  esforco_percebido: number | null
  notas: string | null
}

export function useFinishWorkoutSession() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...values }: FinishWorkoutSessionInput) => {
      const { error } = await supabase.from('workout_sessions').update(values).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout-sessions'] })
      // Marca treino = true no dia de hoje no calendário de atividades.
      if (user) {
        syncActivityDay(user.id, todayInSaoPaulo())
          .then(() => queryClient.invalidateQueries({ queryKey: ['activity-calendar'] }))
          .catch(() => {})
      }
    },
  })
}

export function useDeleteWorkoutSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('workout_sessions').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workout-sessions'] }),
  })
}
